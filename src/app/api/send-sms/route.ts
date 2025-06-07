import { NextRequest, NextResponse } from "next/server";
import { guestService, tableService } from "@/lib/firestore";
import { verifyAuthToken } from "@/lib/firebase-admin";
import twilio from "twilio";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

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
      return NextResponse.json(
        { success: false, error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Get all guests and tables for the event
    const [guests, tables] = await Promise.all([
      guestService.list(userId, eventId),
      tableService.list(userId, eventId),
    ]);

    // Filter guests with phone numbers and table assignments
    const assignedGuests = guests.filter(
      (guest) => guest.phoneNumber && guest.tableId
    );

    for (const guest of assignedGuests) {
      const table = tables.find((t) => t.id === guest.tableId);
      if (table) {
        await twilioClient.messages.create({
          body: `Hi ${guest.name}, you have been assigned to ${table.name}.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: guest.phoneNumber!,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `SMS sent to ${assignedGuests.length} guests`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      error: "Failed to send SMS notifications.",
    });
  }
}
