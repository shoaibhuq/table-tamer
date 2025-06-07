import { NextRequest, NextResponse } from "next/server";
import { guestService, tableService } from "@/lib/firestore";

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
          .filter((guest) =>
            guest.name.toLowerCase().includes(name.toLowerCase())
          )
          .slice(0, 10) // Limit to 10 suggestions
          .map((guest) => guest.name);

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

      // Search for guest by name (case-insensitive, partial match)
      const guest = allGuests.find((g) =>
        g.name.toLowerCase().includes(name.trim().toLowerCase())
      );

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
          name: guest.name,
          phoneNumber: guest.phoneNumber,
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
