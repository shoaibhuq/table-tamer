import { NextRequest, NextResponse } from "next/server";
import { guestService, eventService } from "@/lib/firestore";
import { verifyAuthToken } from "@/lib/firebase-admin";

interface ProcessedGuest {
  name: string;
  phoneNumber?: string;
  email?: string;
  groupInfo?: string;
  selected?: boolean;
}

interface GuestToCreate {
  name: string;
  eventId: string;
  phoneNumber?: string;
  email?: string;
  notes?: string;
}

interface GuestGroup {
  id: string;
  name: string;
  members: string[];
  suggestedTableSize?: number;
  selected?: boolean;
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

    const { eventId, guests, groups } = await req.json();

    if (!eventId) {
      return NextResponse.json({
        success: false,
        error: "Event ID is required",
      });
    }

    if (!guests || !Array.isArray(guests) || guests.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No guests provided for import",
      });
    }

    // Verify the event exists and user owns it
    const event = await eventService.get(userId, eventId);
    if (!event) {
      return NextResponse.json({
        success: false,
        error: "Event not found or access denied",
      });
    }

    // Process guests for database insertion
    const guestsToCreate = guests
      .filter((guest: ProcessedGuest) => guest.selected !== false)
      .map((guest: ProcessedGuest) => {
        const guestData: GuestToCreate = {
          name: guest.name.trim(),
          eventId: eventId,
        };

        // Only add fields if they have valid values
        if (guest.phoneNumber?.trim()) {
          guestData.phoneNumber = guest.phoneNumber.trim();
        }

        if (guest.email?.trim()) {
          guestData.email = guest.email.trim();
        }

        if (guest.groupInfo?.trim()) {
          guestData.notes = `Group: ${guest.groupInfo.trim()}`;
        }

        return guestData;
      })
      .filter((guest) => guest.name.length > 0);

    if (guestsToCreate.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No valid guests to import",
      });
    }

    // Import guests in batches
    const batchSize = 25;
    const successfulGuests: typeof guestsToCreate = [];
    const failedGuests: { name: string; error: string }[] = [];

    for (let i = 0; i < guestsToCreate.length; i += batchSize) {
      const batch = guestsToCreate.slice(i, i + batchSize);

      try {
        await guestService.bulkCreate(userId, batch);
        successfulGuests.push(...batch);
      } catch (batchError) {
        console.error(
          `Batch ${Math.floor(i / batchSize) + 1} failed:`,
          batchError
        );

        // Try individual creates for failed batch
        for (const guest of batch) {
          try {
            await guestService.create(userId, guest);
            successfulGuests.push(guest);
          } catch (individualError) {
            console.error(
              `Failed to create guest ${guest.name}:`,
              individualError
            );
            failedGuests.push({
              name: guest.name,
              error:
                individualError instanceof Error
                  ? individualError.message
                  : "Unknown error",
            });
          }
        }
      }
    }

    // Store group information if provided (for future enhancement)
    // Note: Currently we don't have a groups table, so we'll store this info in guest notes
    if (groups && Array.isArray(groups) && groups.length > 0) {
      const selectedGroups = groups.filter(
        (group: GuestGroup) => group.selected !== false
      );

      // In future, we could create a groups table and link guests to groups
      // For now, the group info is already stored in guest notes
      console.log(
        `Processed ${selectedGroups.length} groups for future implementation`
      );
    }

    const responseMessage =
      successfulGuests.length === guestsToCreate.length
        ? `Successfully imported ${successfulGuests.length} guests.`
        : `Imported ${successfulGuests.length} out of ${guestsToCreate.length} guests. ${failedGuests.length} failed.`;

    return NextResponse.json({
      success: true,
      savedCount: successfulGuests.length,
      failedCount: failedGuests.length,
      failedGuests: failedGuests,
      message: responseMessage,
    });
  } catch (error) {
    console.error("Save guests error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    return NextResponse.json({
      success: false,
      error: `Failed to save guests: ${errorMessage}`,
    });
  }
}
