import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get all playlists for this user
    const playlists = await prisma.playlist.findMany({
      where: { userId: user.id },
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
    });

    // Map to include thumbnail from first video
    const playlistsWithThumbnail = playlists.map((playlist) => ({
      ...playlist,
      thumbnail: playlist.videos[0]?.video?.thumbnail || null,
    }));

    return NextResponse.json(playlistsWithThumbnail);
  } catch (error) {
    console.error("Error fetching playlists:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlists" },
      { status: 500 }
    );
  }
}
