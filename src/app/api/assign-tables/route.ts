import { NextRequest, NextResponse } from "next/server";
import { guestService, tableService } from "@/lib/firestore";
import { verifyAuthToken } from "@/lib/firebase-admin";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const userId = await verifyAuthToken(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { eventId } = await req.json();

    if (!eventId) {
      return NextResponse.json({
        success: false,
        error: "Event ID is required.",
      });
    }

    // Get existing tables for this event
    const tables = await tableService.list(userId, eventId);

    if (tables.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No tables found. Please create tables first.",
      });
    }

    // Get unassigned guests for this event
    const allGuests = await guestService.list(userId, eventId);
    const guests = allGuests.filter((guest) => !guest.tableId);

    if (guests.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No unassigned guests found.",
      });
    }

    const guestNames = guests.map((guest) => guest.name);
    const numTables = tables.length;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a table assignment assistant. You will be given a list of guest names and a number of tables. Your task is to assign each guest to a table number (1 to ${numTables}). Try to distribute guests evenly across tables. Return a JSON object where the keys are guest names and the values are the assigned table numbers.`,
        },
        {
          role: "user",
          content: `Guests: ${guestNames.join(
            ", "
          )}\nTables: ${numTables} (numbered 1 to ${numTables})`,
        },
      ],
    });

    const assignments = JSON.parse(response.choices[0].message.content || "{}");

    // Apply assignments
    let assignedCount = 0;
    for (const guestName in assignments) {
      const guest = guests.find((g) => g.name === guestName);
      const tableNumber = assignments[guestName];
      const table = tables.find((t) => t.name === `Table ${tableNumber}`);

      if (guest && table) {
        await guestService.update(userId, guest.id, { tableId: table.id });
        assignedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Assigned ${assignedCount} guests to tables.`,
    });
  } catch (error) {
    console.error("Error in auto-assign:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to assign tables.",
    });
  }
}
