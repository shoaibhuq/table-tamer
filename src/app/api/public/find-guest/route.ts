import { NextRequest, NextResponse } from "next/server";
import {
  guestService,
  tableService,
  getGuestFullName,
  getGuestDisplayName,
  matchesGuestSearch,
} from "@/lib/firestore";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");
    const eventId = searchParams.get("eventId");
    const autocomplete = searchParams.get("autocomplete");

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: "Event ID is required" },
        { status: 400 }
      );
    }

    // For autocomplete, return name suggestions
    if (autocomplete === "true") {
      if (!name || name.length < 2) {
        return NextResponse.json({
          success: true,
          suggestions: [],
        });
      }

      try {
        const allGuests = await guestService.listPublic(eventId);

        const suggestions = allGuests
          .filter((guest) => matchesGuestSearch(guest, name))
          .slice(0, 10) // Limit to 10 suggestions
          .map((guest) => getGuestDisplayName(guest)); // Show enhanced display name with contact info

        return NextResponse.json({
          success: true,
          suggestions,
        });
      } catch (error) {
        console.error("Error fetching autocomplete suggestions:", error);
        return NextResponse.json({
          success: true,
          suggestions: [],
        });
      }
    }

    // For actual guest search
    if (!name) {
      return NextResponse.json(
        { success: false, error: "Name parameter is required" },
        { status: 400 }
      );
    }

    try {
      const allGuests = await guestService.listPublic(eventId);

      // Search for guest using enhanced search function
      const guest = allGuests.find((g) => matchesGuestSearch(g, name.trim()));

      if (!guest) {
        return NextResponse.json({
          success: false,
          error: "Guest not found",
        });
      }

      // Get table information if guest is assigned to a table
      let table = null;
      if (guest.tableId) {
        const allTables = await tableService.listPublic(eventId);
        const foundTable = allTables.find((t) => t.id === guest.tableId);
        if (foundTable) {
          table = {
            id: foundTable.id,
            name: foundTable.name,
            color: foundTable.color,
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
      console.error("Error searching for guest:", error);
      return NextResponse.json(
        { success: false, error: "Failed to search for guest" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in find-guest API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while processing the request",
      },
      { status: 500 }
    );
  }
}
