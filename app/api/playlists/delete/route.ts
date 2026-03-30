import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // ✅ FIX: Use session.user.id directly — no extra DB lookup needed
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Playlist ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership — find playlist and check userId in one query
    const playlist = await prisma.playlist.findUnique({
      where: { id },
    });

    if (!playlist || playlist.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Playlist not found or access denied" },
        { status: 403 }
      );
    }

    // Delete playlist (cascades to playlist_videos)
    await prisma.playlist.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting playlist:", error);
    return NextResponse.json(
      { error: "Failed to delete playlist" },
      { status: 500 }
    );
  }
}
