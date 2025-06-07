import { NextRequest, NextResponse } from "next/server";
import { tableService, guestService, Guest, Table } from "@/lib/firestore";
import { verifyAuthToken } from "@/lib/firebase-admin";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: "Event ID is required" },
        { status: 400 }
      );
    }

    const [tables, allGuests] = await Promise.all([
      tableService.list(userId, eventId),
      guestService.list(userId, eventId),
    ]);

    // Add guests to each table
    const tablesWithGuests = tables.map((table) => ({
      ...table,
      guests: allGuests
        .filter((guest) => guest.tableId === table.id)
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));

    // Get unassigned guests
    const unassignedGuests = allGuests
      .filter((guest) => !guest.tableId)
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      success: true,
      tables: tablesWithGuests,
      unassignedGuests,
    });
  } catch (error) {
    console.error("Error fetching tables:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tables" },
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

    const { numTables, eventId } = await req.json();

    if (!eventId) {
      return NextResponse.json({
        success: false,
        error: "Event ID is required.",
      });
    }

    if (typeof numTables !== "number" || numTables < 0) {
      return NextResponse.json({
        success: false,
        error: "Invalid number of tables.",
      });
    }

    // Get existing tables to delete
    const existingTables = await tableService.list(userId, eventId);
    if (existingTables.length > 0) {
      await tableService.delete(
        userId,
        existingTables.map((t) => t.id)
      );
    }

    // Clear guest table assignments for this event
    const guests = await guestService.list(userId, eventId);
    const assignedGuests = guests.filter((g) => g.tableId);
    for (const guest of assignedGuests) {
      await guestService.update(userId, guest.id, { tableId: undefined });
    }

    // If numTables is 0, just remove all tables (don't create new ones)
    if (numTables === 0) {
      return NextResponse.json({
        success: true,
        tables: [],
        message: "All tables removed successfully.",
      });
    }

    // Get user's naming preferences from their profile
    let namingType = "numbers"; // default
    let customPrefix = "Table"; // default

    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.tableNamingPreferences) {
          namingType = userData.tableNamingPreferences.type || "numbers";
          customPrefix =
            userData.tableNamingPreferences.customPrefix || "Table";
        }
      }
    } catch (error) {
      console.warn("Could not fetch user preferences, using defaults:", error);
    }

    // Generate table name based on user's preferences
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

    // Table colors
    const tableColors = [
      "#ef4444",
      "#f97316",
      "#eab308",
      "#22c55e",
      "#06b6d4",
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
      "#64748b",
      "#dc2626",
      "#ea580c",
      "#ca8a04",
      "#16a34a",
      "#0891b2",
      "#2563eb",
      "#7c3aed",
      "#db2777",
      "#475569",
    ];

    // Create new tables for this event using user's naming preferences
    const tables = [];
    for (let i = 1; i <= numTables; i++) {
      const colorIndex = (i - 1) % tableColors.length;
      const tableName = generateTableName(i - 1, namingType, customPrefix);

      const tableId = await tableService.create(userId, {
        name: tableName,
        capacity: 8, // Default capacity
        color: tableColors[colorIndex],
        eventId,
      });
      const table = await tableService.list(userId, eventId);
      const newTable = table.find((t) => t.id === tableId);
      if (newTable) {
        tables.push({ ...newTable, guests: [] });
      }
    }

    return NextResponse.json({ success: true, tables });
  } catch (error) {
    console.error("Error creating tables:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create tables" },
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

    const { guestId, tableId } = await req.json();

    if (!guestId) {
      return NextResponse.json(
        { success: false, error: "Guest ID is required" },
        { status: 400 }
      );
    }

    // Update guest table assignment
    await guestService.update(userId, guestId, {
      tableId: tableId || undefined,
    });

    // Get updated guest data
    const guests = await guestService.list(userId);
    const updatedGuest = guests.find((g) => g.id === guestId);

    // Add table info if assigned
    let guestWithTable: Guest & { table?: Table | null } = updatedGuest!;
    if (updatedGuest?.tableId) {
      const allTables = await tableService.list(userId, updatedGuest.eventId);
      const table = allTables.find((t) => t.id === updatedGuest.tableId);
      guestWithTable = {
        ...updatedGuest,
        table: table || null,
      };
    }

    return NextResponse.json({ success: true, guest: guestWithTable });
  } catch (error) {
    console.error("Error updating guest table assignment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update table assignment" },
      { status: 500 }
    );
  }
}
