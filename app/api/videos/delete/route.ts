import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // ✅ FIX (Bug 2): Use session.user.id directly — no extra DB lookup needed
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const video = await prisma.video.findUnique({
      where: { id },
    });

    if (!video || video.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Video not found or access denied" },
        { status: 403 }
      );
    }

    // ✅ FIX (Bug 4): Soft delete — set inLibrary: false instead of hard deleting.
    // This preserves watch history, notes, and playlist references.
    // The video record remains intact; it just disappears from the library view.
    await prisma.video.update({
      where: { id },
      data: { inLibrary: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting video:", error);
    return NextResponse.json(
      { error: "Failed to delete video" },
      { status: 500 }
    );
  }
}
