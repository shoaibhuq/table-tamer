import { NextRequest, NextResponse } from "next/server";
import { eventService, guestService } from "@/lib/firestore";
import { verifyAuthToken } from "@/lib/firebase-admin";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate the request
    const userId = await verifyAuthToken(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id: eventId } = await params;

    // Verify that the event exists and belongs to the user
    const event = await eventService.get(userId, eventId);
    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    // Get all guests for this event
    const guests = await guestService.list(userId, eventId);

    if (guests.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No guests to remove",
        removedCount: 0,
      });
    }

    // Remove all guests from this event
    const guestIds = guests.map((guest) => guest.id);
    await guestService.delete(userId, guestIds);

    return NextResponse.json({
      success: true,
      message: `Successfully removed ${guests.length} guests from the event`,
      removedCount: guests.length,
    });
  } catch (error) {
    console.error("Error removing all guests:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to remove guests",
      },
      { status: 500 }
    );
  }
}
