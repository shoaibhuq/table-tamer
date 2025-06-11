import { NextRequest, NextResponse } from "next/server";
import { tableService, Table } from "@/lib/firestore";
import { verifyAuthToken } from "@/lib/firebase-admin";
import { logTableDeleted } from "@/lib/analytics";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

    const { id: tableId } = await params;
    const body = await req.json();

    // Validate the update data
    const updates: Partial<Omit<Table, "id" | "userId" | "createdAt">> = {};

    if ("name" in body) {
      if (
        !body.name ||
        typeof body.name !== "string" ||
        body.name.trim().length === 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Table name is required and must be a non-empty string",
          },
          { status: 400 }
        );
      }
      updates.name = body.name.trim();
    }

    if ("capacity" in body) {
      if (!Number.isInteger(body.capacity) || body.capacity < 1) {
        return NextResponse.json(
          { success: false, error: "Capacity must be a positive integer" },
          { status: 400 }
        );
      }
      updates.capacity = body.capacity;
    }

    if ("color" in body) {
      if (!body.color || typeof body.color !== "string") {
        return NextResponse.json(
          { success: false, error: "Color must be a valid color string" },
          { status: 400 }
        );
      }
      updates.color = body.color;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    await tableService.update(userId, tableId, updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating table:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update table" },
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

    const { id: tableId } = await params;

    // Get table info before deletion for analytics
    let tableName = "Unknown Table";
    let eventId = "";
    let eventName = "Unknown Event";

    try {
      // Get the table directly from Firestore
      const tableDoc = await getDoc(doc(db, "tables", tableId));

      if (tableDoc.exists()) {
        const tableData = tableDoc.data();
        tableName = tableData.name || "Unknown Table";
        eventId = tableData.eventId;

        // Get event name
        if (eventId) {
          const eventDoc = await getDoc(doc(db, "events", eventId));
          eventName = eventDoc.exists()
            ? eventDoc.data().name
            : "Unknown Event";
        }
      }
    } catch (error) {
      console.error("Failed to get table info for analytics:", error);
    }

    await tableService.delete(userId, [tableId]);

    // Log analytics after successful deletion
    if (eventId) {
      try {
        await logTableDeleted(userId, eventId, eventName, tableName);
      } catch (error) {
        console.error("Failed to log table deletion analytics:", error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting table:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete table" },
      { status: 500 }
    );
  }
}
