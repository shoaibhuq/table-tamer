import { NextRequest, NextResponse } from "next/server";
import { eventService, guestService, tableService } from "@/lib/firestore";
import { verifyAuthToken } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const userId = await verifyAuthToken(req);
    console.log("Authenticated user ID:", userId);

    if (!userId) {
      console.log("Authentication failed - no user ID");
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log("Fetching events for user:", userId);
    const events = await eventService.list(userId);
    console.log("Found events:", events.length);

    // Handle empty events case
    if (events.length === 0) {
      console.log("No events found for user");
      return NextResponse.json({
        success: true,
        events: [],
      });
    }

    // Get guest and table counts for each event
    console.log("Fetching counts for events...");
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        try {
          const [guests, tables] = await Promise.all([
            guestService.list(userId, event.id),
            tableService.list(userId, event.id),
          ]);

          return {
            ...event,
            _count: {
              guests: guests.length,
              tables: tables.length,
            },
          };
        } catch (error) {
          console.error(`Error fetching counts for event ${event.id}:`, error);
          // Return event with zero counts if there's an error
          return {
            ...event,
            _count: {
              guests: 0,
              tables: 0,
            },
          };
        }
      })
    );

    console.log("Successfully processed events with counts");
    return NextResponse.json({
      success: true,
      events: eventsWithCounts,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch events" },
      { status: 500 }
    );
  }
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

    const { name, description } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Event name is required" },
        { status: 400 }
      );
    }

    const eventId = await eventService.create(userId, {
      name: name.trim(),
      description: description?.trim() || null,
    });

    const event = await eventService.get(userId, eventId);

    return NextResponse.json({
      success: true,
      event,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create event" },
      { status: 500 }
    );
  }
}
