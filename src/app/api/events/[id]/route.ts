import { NextRequest, NextResponse } from "next/server";
import { eventService, guestService, tableService } from "@/lib/firestore";
import { verifyAuthToken } from "@/lib/firebase-admin";

export async function GET(
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
    const event = await eventService.get(userId, eventId);

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    // Get guests and tables for this event
    const [guests, tables] = await Promise.all([
      guestService.list(userId, eventId),
      tableService.list(userId, eventId),
    ]);

    // Add table information to guests
    const guestsWithTables = guests.map((guest) => {
      const table = guest.tableId
        ? tables.find((t) => t.id === guest.tableId)
        : null;
      return {
        ...guest,
        table: table || null,
      };
    });

    // Add guest information to tables
    const tablesWithGuests = tables.map((table) => ({
      ...table,
      guests: guests.filter((guest) => guest.tableId === table.id),
    }));

    const eventWithDetails = {
      ...event,
      guests: guestsWithTables,
      tables: tablesWithGuests,
      _count: {
        guests: guests.length,
        tables: tables.length,
      },
    };

    return NextResponse.json({
      success: true,
      event: eventWithDetails,
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

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

    const { id: eventId } = await params;

    // Check if event exists
    const event = await eventService.get(userId, eventId);
    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    // Delete the event (this will cascade delete guests and tables)
    await eventService.delete(userId, eventId);

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete event" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const { name, description, theme } = await req.json();

    // If updating name, validate it
    if (name !== undefined && (!name || !name.trim())) {
      return NextResponse.json(
        { success: false, error: "Event name is required" },
        { status: 400 }
      );
    }

    // Check if event exists
    const existingEvent = await eventService.get(userId, eventId);
    if (!existingEvent) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: {
      name?: string;
      description?: string | null;
      theme?: string;
    } = {};
    if (name !== undefined) {
      updateData.name = name.trim();
    }
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }
    if (theme !== undefined) {
      updateData.theme = theme;
    }

    // Update the event
    await eventService.update(userId, eventId, updateData);

    const updatedEvent = await eventService.get(userId, eventId);

    return NextResponse.json({
      success: true,
      event: updatedEvent,
      message: "Event updated successfully",
    });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update event" },
      { status: 500 }
    );
  }
}
