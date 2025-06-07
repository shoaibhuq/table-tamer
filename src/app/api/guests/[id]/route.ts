import { NextRequest, NextResponse } from "next/server";
import { guestService } from "@/lib/firestore";
import { verifyAuthToken } from "@/lib/firebase-admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: guestId } = await params;
    const { name, phoneNumber } = await req.json();

    // Verify authentication
    const userId = await verifyAuthToken(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Guest name is required" },
        { status: 400 }
      );
    }

    await guestService.update(userId, guestId, {
      name: name.trim(),
      phoneNumber: phoneNumber ? phoneNumber.trim() : null,
    });

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
