import { NextRequest, NextResponse } from "next/server";
import { eventService } from "@/lib/firestore";
import { verifyAuthToken } from "@/lib/firebase-admin";

export async function POST(
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

    const { id: eventId } = await params;

    // Check if event exists
    const event = await eventService.get(userId, eventId);
    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    // Reset the event: unassign all guests and delete all tables
    await eventService.reset(userId, eventId);

    return NextResponse.json({
      success: true,
      message: "Event reset successfully",
    });
  } catch (error) {
    console.error("Error resetting event:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reset event" },
      { status: 500 }
    );
  }
}
