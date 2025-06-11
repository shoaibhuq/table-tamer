import { NextRequest, NextResponse } from "next/server";
import { guestService, Guest } from "@/lib/firestore";
import { verifyAuthToken } from "@/lib/firebase-admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: guestId } = await params;
    const updates = await req.json();

    // Verify authentication
    const userId = await verifyAuthToken(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate that at least firstName or lastName is provided (or legacy name field)
    const hasName =
      (updates.firstName && updates.firstName.trim()) ||
      (updates.lastName && updates.lastName.trim()) ||
      (updates.name && updates.name.trim());

    if (!hasName) {
      return NextResponse.json(
        {
          success: false,
          error: "At least first name or last name is required",
        },
        { status: 400 }
      );
    }

    // Clean up the updates object
    const cleanUpdates: Partial<Guest> = {};

    // Handle name fields
    if (updates.firstName !== undefined) {
      cleanUpdates.firstName = updates.firstName?.trim() || undefined;
    }
    if (updates.lastName !== undefined) {
      cleanUpdates.lastName = updates.lastName?.trim() || undefined;
    }
    if (updates.name !== undefined) {
      cleanUpdates.name = updates.name?.trim() || undefined;
    }

    // Handle contact fields
    if (updates.phoneNumber !== undefined) {
      cleanUpdates.phoneNumber = updates.phoneNumber?.trim() || undefined;
    }
    if (updates.email !== undefined) {
      cleanUpdates.email = updates.email?.trim() || undefined;
    }

    // Handle notes
    if (updates.notes !== undefined) {
      cleanUpdates.notes = updates.notes?.trim() || undefined;
    }

    // Handle table assignment
    if (updates.tableId !== undefined) {
      cleanUpdates.tableId = updates.tableId;
    }

    await guestService.update(userId, guestId, cleanUpdates);

    return NextResponse.json({
      success: true,
      message: "Guest updated successfully",
    });
  } catch (error) {
    console.error("Error updating guest:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update guest" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: guestId } = await params;

    // Verify authentication
    const userId = await verifyAuthToken(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await guestService.delete(userId, [guestId]);

    return NextResponse.json({
      success: true,
      message: "Guest deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting guest:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete guest" },
      { status: 500 }
    );
  }
}
