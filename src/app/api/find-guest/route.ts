import { NextRequest, NextResponse } from "next/server";
import {
  guestService,
  tableService,
  getGuestFullName,
  matchesGuestSearch,
} from "@/lib/firestore";
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
    const name = searchParams.get("name");
    const eventId = searchParams.get("eventId");

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Name parameter is required" },
        { status: 400 }
      );
    }

    // Get all guests for the user (or specific event)
    const guests = await guestService.list(userId, eventId || undefined);

    // Search for guest using enhanced search function
    const guest = guests.find((g) => matchesGuestSearch(g, name.trim()));

    if (!guest) {
      return NextResponse.json({
        success: false,
        error: "Guest not found",
      });
    }

    // Get table information if guest is assigned to a table
    let table = null;
    if (guest.tableId && eventId) {
      const tables = await tableService.list(userId, eventId);
      const foundTable = tables.find((t) => t.id === guest.tableId);
      if (foundTable) {
        table = {
          id: foundTable.id,
          name: foundTable.name,
        };
      }
    }

    return NextResponse.json({
      success: true,
      guest: {
        id: guest.id,
        name: getGuestFullName(guest), // Use helper function for display name
        firstName: guest.firstName,
        lastName: guest.lastName,
        phoneNumber: guest.phoneNumber,
        email: guest.email,
        table,
      },
    });
  } catch (error) {
    console.error("Error finding guest:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while searching for the guest",
      },
      { status: 500 }
    );
  }
}
