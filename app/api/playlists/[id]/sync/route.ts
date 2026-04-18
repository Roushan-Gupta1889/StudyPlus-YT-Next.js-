import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const playlist = await prisma.playlist.findUnique({
            where: { id },
        });

        if (!playlist || playlist.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        if (!playlist.youtubePlaylistId) {
             return NextResponse.json({ error: "No YouTube Playlist ID to sync from" }, { status: 400 });
        }

        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "YouTube API Key not configured" }, { status: 500 });
        }

        const playlistDetailsRes = await fetch(
            `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlist.youtubePlaylistId}&key=${apiKey}`
        );

        if (!playlistDetailsRes.ok) {
             return NextResponse.json({ error: "Failed to fetch from YouTube API" }, { status: 500 });
        }

        const detailsData = await playlistDetailsRes.json();
        if (detailsData.items && detailsData.items.length > 0) {
            const fetchedDescription = detailsData.items[0].snippet?.description || "";
            
            const updatedPlaylist = await prisma.playlist.update({
                where: { id },
                data: {
                    description: fetchedDescription,
                },
            });

            return NextResponse.json(updatedPlaylist);
        }

        return NextResponse.json({ error: "No details found on YouTube for this playlist" }, { status: 404 });
        
    } catch (error) {
        console.error("[PLAYLIST_SYNC]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
