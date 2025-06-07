import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: guestId } = await params;
    const { name, phoneNumber } = await req.json();

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Guest name is required" },
        { status: 400 }
      );
    }

    const updatedGuest = await prisma.guest.update({
      where: { id: guestId },
      data: {
        name: name.trim(),
        phoneNumber: phoneNumber ? phoneNumber.trim() : null,
      },
    });

    return NextResponse.json({ success: true, guest: updatedGuest });
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

    await prisma.guest.delete({
      where: { id: guestId },
    });

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
