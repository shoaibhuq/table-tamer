import { NextRequest, NextResponse } from "next/server";
import { tableService } from "@/lib/firestore";
import { verifyAuthToken } from "@/lib/firebase-admin";

export async function PATCH(req: NextRequest) {
  try {
    const userId = await verifyAuthToken(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { eventId, nameType, customPrefix } = await req.json();

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: "Event ID is required" },
        { status: 400 }
      );
    }

    if (!nameType) {
      return NextResponse.json(
        { success: false, error: "Name type is required" },
        { status: 400 }
      );
    }

    // Get all tables for this event
    const tables = await tableService.list(userId, eventId);

    if (tables.length === 0) {
      return NextResponse.json(
        { success: false, error: "No tables found for this event" },
        { status: 404 }
      );
    }

    // Generate names for all tables
    const generateTableName = (
      index: number,
      type: string,
      prefix: string = "Table"
    ) => {
      switch (type) {
        case "numbers":
          return (index + 1).toString();
        case "letters":
          return String.fromCharCode(65 + index); // A, B, C...
        case "roman":
          const romans = [
            "I",
            "II",
            "III",
            "IV",
            "V",
            "VI",
            "VII",
            "VIII",
            "IX",
            "X",
            "XI",
            "XII",
            "XIII",
            "XIV",
            "XV",
            "XVI",
            "XVII",
            "XVIII",
            "XIX",
            "XX",
          ];
          return romans[index] || (index + 1).toString();
        case "custom-prefix":
          return `${prefix} ${index + 1}`;
        default:
          return (index + 1).toString();
      }
    };

    // Update all tables with new names
    const updatePromises = tables.map((table, index) => {
      const newName = generateTableName(index, nameType, customPrefix);
      return tableService.update(userId, table.id, { name: newName });
    });

    await Promise.all(updatePromises);

    // Get updated tables to return
    const updatedTables = await tableService.list(userId, eventId);

    return NextResponse.json({
      success: true,
      message: `Successfully renamed ${tables.length} tables using ${nameType} convention`,
      tables: updatedTables,
    });
  } catch (error) {
    console.error("Error batch renaming tables:", error);
    return NextResponse.json(
      { success: false, error: "Failed to rename tables" },
      { status: 500 }
    );
  }
}
