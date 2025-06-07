import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/firebase-admin";
import { saveAssignmentChanges } from "@/lib/firebase-batch";

interface BatchAssignmentRequest {
  guestChanges: Array<{ guestId: string; tableId: string | null }>;
  tableChanges?: Array<{ tableId: string; updates: Record<string, unknown> }>;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await verifyAuthToken(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { guestChanges, tableChanges = [] }: BatchAssignmentRequest =
      await req.json();

    if (!Array.isArray(guestChanges)) {
      return NextResponse.json(
        { success: false, error: "guestChanges must be an array" },
        { status: 400 }
      );
    }

    if (guestChanges.length === 0 && tableChanges.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No changes to process",
        totalProcessed: 0,
      });
    }

    // Validate guest changes format
    for (const change of guestChanges) {
      if (!change.guestId || typeof change.guestId !== "string") {
        return NextResponse.json(
          { success: false, error: "Invalid guestId in guestChanges" },
          { status: 400 }
        );
      }
      if (change.tableId !== null && typeof change.tableId !== "string") {
        return NextResponse.json(
          { success: false, error: "Invalid tableId in guestChanges" },
          { status: 400 }
        );
      }
    }

    // Validate table changes format
    for (const change of tableChanges) {
      if (!change.tableId || typeof change.tableId !== "string") {
        return NextResponse.json(
          { success: false, error: "Invalid tableId in tableChanges" },
          { status: 400 }
        );
      }
      if (!change.updates || typeof change.updates !== "object") {
        return NextResponse.json(
          { success: false, error: "Invalid updates in tableChanges" },
          { status: 400 }
        );
      }
    }

    console.log(
      `Processing batch assignment: ${guestChanges.length} guest changes, ${tableChanges.length} table changes`
    );

    // Execute the batch update with proper error handling
    const result = await saveAssignmentChanges(guestChanges, tableChanges);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully processed ${result.totalProcessed} changes`,
        totalProcessed: result.totalProcessed,
      });
    } else {
      // Log errors but return partial success if some operations succeeded
      console.error("Batch assignment errors:", result.errors);

      if (result.totalProcessed > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Partially completed: ${result.totalProcessed} operations succeeded, but ${result.errors.length} chunks failed`,
            totalProcessed: result.totalProcessed,
            errors: result.errors,
          },
          { status: 207 }
        ); // 207 Multi-Status
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "All operations failed",
            errors: result.errors,
          },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("Error in batch assignment API:", error);

    // Check if it's a quota exceeded error
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    if (errorMessage.includes("quota") || errorMessage.includes("rate")) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded. Please try again in a few moments.",
          retryAfter: 5000, // Suggest retry after 5 seconds
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to process batch assignment" },
      { status: 500 }
    );
  }
}
