import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch playlists and all IITM course YouTube playlist IDs in parallel
    const [playlists, iitmCourses] = await Promise.all([
      prisma.playlist.findMany({
        where: { userId: session.user.id },
        include: {
          _count: {
            select: { videos: true },
          },
          videos: {
            take: 1,
            include: {
              video: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.iITMCourse.findMany({
        select: { youtubePlaylistId: true },
      }),
    ]);

    // Build a Set of all IITM YouTube playlist IDs for O(1) lookup
    const iitmPlaylistIds = new Set(
      iitmCourses.map((c) => c.youtubePlaylistId)
    );

    // Determine which playlists need their isIITM flag fixed in the DB
    const toFix = playlists.filter(
      (p) =>
        !p.isIITM &&
        p.youtubePlaylistId &&
        iitmPlaylistIds.has(p.youtubePlaylistId)
    );

    // Silently backfill isIITM = true for any misclassified playlists
    if (toFix.length > 0) {
      await prisma.playlist.updateMany({
        where: { id: { in: toFix.map((p) => p.id) } },
        data: { isIITM: true },
      }).catch((err) => console.error("[LIST_BACKFILL_IITM]", err));
    }

    // Map to include thumbnail and the corrected isIITM value
    const playlistsWithThumbnail = playlists.map((playlist) => {
      const isActuallyIITM =
        playlist.isIITM ||
        (!!playlist.youtubePlaylistId &&
          iitmPlaylistIds.has(playlist.youtubePlaylistId));

      return {
        ...playlist,
        isIITM: isActuallyIITM,
        thumbnail: playlist.videos[0]?.video?.thumbnail || null,
      };
    });

    return NextResponse.json(playlistsWithThumbnail);
  } catch (error) {
    console.error("Error fetching playlists:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlists" },
      { status: 500 }
    );
  }
}
