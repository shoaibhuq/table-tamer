import { NextRequest, NextResponse } from "next/server";
import { guestService, eventService, tableService } from "@/lib/firestore";
import { verifyAuthToken } from "@/lib/firebase-admin";
import { AnalyticsService } from "@/lib/analytics";

interface ProcessedGuest {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  email?: string;
  groupInfo?: string;
  selected?: boolean;
}

interface GuestToCreate {
  name: string; // Keep for backward compatibility
  firstName: string;
  lastName: string;
  eventId: string;
  phoneNumber?: string;
  email?: string;
  notes?: string;
  tableId?: string; // Add tableId for automatic assignment
}

interface GuestGroup {
  id: string;
  name: string;
  members: string[];
  suggestedTableSize?: number;
  selected?: boolean;
  autoCreateTable?: boolean; // New field to control table creation
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

    const { eventId, guests, groups, autoTableAssignment } = await req.json();

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

    // Create tables for selected groups if auto table assignment is enabled
    const createdTables: { [groupId: string]: string } = {};
    const createdTablesByName: { [groupName: string]: string } = {};
    let tablesCreated = 0;

    if (autoTableAssignment?.createTables && groups && Array.isArray(groups)) {
      const groupsToCreateTables = groups.filter(
        (group: GuestGroup) => group.selected && group.autoCreateTable
      );

      for (const group of groupsToCreateTables) {
        try {
          // Get existing tables count to determine table number
          const existingTables = await tableService.list(userId, eventId);
          const nextTableNumber = existingTables.length + tablesCreated + 1;

          // Create table with group name or default naming
          let tableName = group.name;
          if (tableName.toLowerCase().includes("table")) {
            // If group name already contains "table", use as is
          } else {
            // If it's a family name or other group type, prepend "Table"
            tableName = `Table ${nextTableNumber} (${group.name})`;
          }

          const tableId = await tableService.create(userId, {
            name: tableName,
            capacity: group.suggestedTableSize || 8,
            color: "#3B82F6", // Default blue color
            eventId: eventId,
          });

          // Store table ID by both group name and group ID for flexible lookup
          createdTablesByName[group.name] = tableId;

          // Extract the group ID from the group ID field (e.g., "group_1" -> "1")
          const groupId = group.id.replace(/^group_/, "");
          createdTables[groupId] = tableId;

          console.log(
            `Created table "${tableName}" (ID: ${tableId}) for group "${group.name}" (groupId: ${groupId})`
          );

          tablesCreated++;
        } catch (error) {
          console.error(
            `Failed to create table for group ${group.name}:`,
            error
          );
        }
      }
    }

    // Process guests for database insertion
    const guestsToCreate = guests
      .filter((guest: ProcessedGuest) => guest.selected !== false)
      .map((guest: ProcessedGuest) => {
        const firstName = guest.firstName?.trim() || "";
        const lastName = guest.lastName?.trim() || "";
        const fullName = `${firstName} ${lastName}`.trim();

        const guestData: GuestToCreate = {
          name: fullName, // Keep for backward compatibility
          firstName: firstName,
          lastName: lastName,
          eventId: eventId,
        };

        // Only add fields if they have valid values
        if (guest.phoneNumber?.trim()) {
          guestData.phoneNumber = guest.phoneNumber.trim();
        }

        if (guest.email?.trim()) {
          guestData.email = guest.email.trim();
        }

        // Handle group assignment and table assignment
        if (guest.groupInfo?.trim()) {
          const groupInfo = guest.groupInfo.trim();
          guestData.notes = `Group: ${groupInfo}`;

          // If auto table assignment is enabled and this guest's group has a table
          if (autoTableAssignment?.createTables) {
            // Try to find table by group ID first (direct match)
            let tableId = createdTables[groupInfo];

            // If not found, try by group name lookup
            if (!tableId) {
              // Look for a group name that might match this groupInfo
              const matchingGroupName = Object.keys(createdTablesByName).find(
                (name) => {
                  // Try exact match first
                  if (name.includes(groupInfo)) return true;
                  // Try extracting number from group name and compare
                  const nameMatch = name.match(/(\d+)/);
                  if (nameMatch && nameMatch[1] === groupInfo) return true;
                  return false;
                }
              );

              if (matchingGroupName) {
                tableId = createdTablesByName[matchingGroupName];
              }
            }

            if (tableId) {
              guestData.tableId = tableId;
              console.log(
                `Assigned guest "${guestData.name}" to table ${tableId} (group: ${groupInfo})`
              );
            } else {
              console.log(
                `No table found for guest "${guestData.name}" with group: ${groupInfo}`
              );
              console.log(
                `Available tables:`,
                Object.keys(createdTables),
                Object.keys(createdTablesByName)
              );
            }
          }
        }

        return guestData;
      })
      .filter(
        (guest) => guest.firstName.length > 0 || guest.lastName.length > 0
      );

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

    // Calculate assignment statistics
    const assignedGuests = successfulGuests.filter(
      (guest) => guest.tableId
    ).length;

    const responseMessage =
      successfulGuests.length === guestsToCreate.length
        ? `Successfully imported ${successfulGuests.length} guests.${
            tablesCreated > 0
              ? ` Created ${tablesCreated} tables and assigned ${assignedGuests} guests.`
              : ""
          }`
        : `Imported ${successfulGuests.length} out of ${
            guestsToCreate.length
          } guests. ${failedGuests.length} failed.${
            tablesCreated > 0
              ? ` Created ${tablesCreated} tables and assigned ${assignedGuests} guests.`
              : ""
          }`;

    // Log analytics for successful guest import
    if (successfulGuests.length > 0) {
      try {
        // Get event details for analytics
        const event = await eventService.get(userId, eventId);
        if (event) {
          await AnalyticsService.logGuestsImported(
            userId,
            eventId,
            event.name,
            successfulGuests.length
          );

          // If tables were assigned, log that too
          if (assignedGuests > 0) {
            await AnalyticsService.logTablesAssigned(
              userId,
              eventId,
              event.name,
              tablesCreated,
              assignedGuests
            );
          }
        }
      } catch (analyticsError) {
        console.error("Analytics logging failed:", analyticsError);
        // Don't fail the main operation for analytics errors
      }
    }

    return NextResponse.json({
      success: true,
      savedCount: successfulGuests.length,
      failedCount: failedGuests.length,
      tablesCreated: tablesCreated,
      guestsAssigned: assignedGuests,
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
