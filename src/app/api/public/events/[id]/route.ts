import { NextRequest, NextResponse } from "next/server";
import { eventService } from "@/lib/firestore";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;

    // Get public event information (we need to add a public method)
    const event = await eventService.getPublic(eventId);

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    // Return only basic event information for public access
    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        name: event.name,
        description: event.description,
        theme: event.theme,
        customTitle: event.customTitle,
        customSubtitle: event.customSubtitle,
        customWelcomeMessage: event.customWelcomeMessage,
      },
    });
  } catch (error) {
    console.error("Error fetching public event:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}
