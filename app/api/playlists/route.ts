import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/playlists — Fetch user's playlists with stats
// NOTE: POST was removed. Use POST /api/playlists/add to import playlists.
// The old POST handler had no rate limiting and no DB transaction.
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const playlists = await prisma.playlist.findMany({
            where: {
                userId: session.user.id,
            },
            include: {
                videos: {
                    include: {
                        video: true,
                    },
                    orderBy: {
                        position: "asc",
                    },
                },
            },
            orderBy: {
                updatedAt: "desc",
            },
        });

        // Calculate stats for each playlist
        const playlistsWithStats = playlists.map((playlist) => ({
            ...playlist,
            totalVideos: playlist.videos.length,
            completedVideos: playlist.videos.filter((pv: any) => pv.video.completed).length,
            totalDuration: playlist.videos.reduce((acc: number, pv: any) => acc + (pv.video.duration || 0), 0),
        }));

        return NextResponse.json(playlistsWithStats);
    } catch (error) {
        console.error("[PLAYLISTS_GET]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
