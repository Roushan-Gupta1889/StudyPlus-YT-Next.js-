import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/playlists/[id]/mark-iitm — Mark an existing playlist as an IITM course
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the playlist belongs to the user
    const playlist = await prisma.playlist.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    // Update isIITM to true
    const updated = await prisma.playlist.update({
      where: { id },
      data: { isIITM: true },
    });

    return NextResponse.json({ success: true, playlist: updated });
  } catch (error) {
    console.error("[MARK_IITM]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
