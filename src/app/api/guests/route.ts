import { NextRequest, NextResponse } from "next/server";
import { guestService, tableService } from "@/lib/firestore";
import { verifyAuthToken } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const userId = await verifyAuthToken(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");

    const guests = await guestService.list(userId, eventId || undefined);

    // Add table information to guests
    if (eventId) {
      const tables = await tableService.list(userId, eventId);
      const guestsWithTables = guests.map((guest) => {
        const table = guest.tableId
          ? tables.find((t) => t.id === guest.tableId)
          : null;
        return {
          ...guest,
          table: table || null,
        };
      });

      return NextResponse.json({ success: true, guests: guestsWithTables });
    }

    return NextResponse.json({ success: true, guests });
  } catch (error) {
    console.error("Error fetching guests:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch guests" },
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

    const { name, email, phoneNumber, eventId } = await req.json();

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Guest name is required" },
        { status: 400 }
      );
    }

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: "Event ID is required" },
        { status: 400 }
      );
    }

    const guestData: {
      name: string;
      eventId: string;
      email?: string;
      phoneNumber?: string;
    } = {
      name: name.trim(),
      eventId: eventId,
    };

    // Only add optional fields if they have values
    if (email && email.trim()) {
      guestData.email = email.trim();
    }
    if (phoneNumber && phoneNumber.trim()) {
      guestData.phoneNumber = phoneNumber.trim();
    }

    const guestId = await guestService.create(userId, guestData);

    return NextResponse.json({
      success: true,
      message: "Guest created successfully",
      guestId: guestId,
    });
  } catch (error) {
    console.error("Error creating guest:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create guest" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await verifyAuthToken(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id, name, phoneNumber, tableId } = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Guest ID is required" },
        { status: 400 }
      );
    }

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Guest name is required" },
        { status: 400 }
      );
    }

    await guestService.update(userId, id, {
      name: name.trim(),
      phoneNumber: phoneNumber ? phoneNumber.trim() : undefined,
      tableId: tableId || undefined,
    });

    const updatedGuest = await guestService.list(userId);
    const guest = updatedGuest.find((g) => g.id === id);

    return NextResponse.json({ success: true, guest });
  } catch (error) {
    console.error("Error updating guest:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update guest" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await verifyAuthToken(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const ids = searchParams.get("ids");

    if (!id && !ids) {
      return NextResponse.json(
        { success: false, error: "Guest ID(s) required" },
        { status: 400 }
      );
    }

    if (ids) {
      // Bulk delete - now uses optimized parallel processing
      const guestIds = ids.split(",");
      await guestService.delete(userId, guestIds);
      return NextResponse.json({
        success: true,
        message: `Deleted ${guestIds.length} guests`,
      });
    } else {
      // Single delete
      await guestService.delete(userId, [id!]);
      return NextResponse.json({
        success: true,
        message: "Guest deleted successfully",
      });
    }
  } catch (error) {
    console.error("Error deleting guest(s):", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete guest(s)" },
      { status: 500 }
    );
  }
}
