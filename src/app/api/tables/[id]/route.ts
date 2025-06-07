import { NextRequest, NextResponse } from "next/server";
import { tableService } from "@/lib/firestore";
import { verifyAuthToken } from "@/lib/firebase-admin";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await verifyAuthToken(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id: tableId } = await params;

    if (!tableId) {
      return NextResponse.json(
        { success: false, error: "Table ID is required" },
        { status: 400 }
      );
    }

    // Use the existing delete method from tableService which handles guest unassignment
    await tableService.delete(userId, [tableId]);

    return NextResponse.json({
      success: true,
      message: "Table deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting table:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete table" },
      { status: 500 }
    );
  }
}
