import { NextRequest, NextResponse } from "next/server";
import { eventService, guestService } from "@/lib/firestore";
import { verifyAuthToken } from "@/lib/firebase-admin";
import { AnalyticsService } from "@/lib/analytics";

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

    // Use the optimized deleteByEvent method for much faster performance
    const removedCount = await guestService.deleteByEvent(userId, eventId);

    // Log analytics for guest removal
    if (removedCount > 0) {
      try {
        await AnalyticsService.logActivity(userId, {
          type: "guest_deleted",
          title: `Removed all guests (${removedCount})`,
          description: `Cleared all ${removedCount} guests from "${event.name}"`,
          eventId,
          eventName: event.name,
          metadata: {
            action: "delete_all",
            resource: "guests",
            count: removedCount,
          },
        });
      } catch (error) {
        console.error("Failed to log guest removal analytics:", error);
      }
    }

    if (removedCount === 0) {
      return NextResponse.json({
        success: true,
        message: "No guests to remove",
        removedCount: 0,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully removed ${removedCount} guests from the event`,
      removedCount: removedCount,
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
