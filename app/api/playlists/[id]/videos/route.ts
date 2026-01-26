import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/playlists/[id]/videos - Get all videos in playlist
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Verify playlist belongs to user
        const playlist = await prisma.playlist.findUnique({
            where: { id },
        });

        if (!playlist || playlist.userId !== session.user.id) {
            return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
        }

        // Get videos in playlist
        const playlistVideos = await prisma.playlistVideo.findMany({
            where: { playlistId: id },
            include: { video: true },
            orderBy: { position: "asc" },
        });

        const videos = playlistVideos.map((pv) => pv.video);
        return NextResponse.json(videos);
    } catch (error) {
        console.error("[PLAYLIST_GET_VIDEOS]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// POST /api/playlists/[id]/videos - Add video to playlist
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
        const body = await request.json();
        const { videoId } = body;

        if (!videoId) {
            return NextResponse.json({ error: "Video ID is required" }, { status: 400 });
        }

        // Verify playlist belongs to user
        const playlist = await prisma.playlist.findUnique({
            where: {
                id,
            },
        });

        if (!playlist || playlist.userId !== session.user.id) {
            return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
        }

        // Verify video belongs to user
        const video = await prisma.video.findUnique({
            where: {
                id: videoId,
            },
        });

        if (!video || video.userId !== session.user.id) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        // Get current max order
        const maxPositionVideo = await prisma.playlistVideo.findFirst({
            where: {
                playlistId: id,
            },
            orderBy: {
                position: "desc",
            },
        });

        const newPosition = (maxPositionVideo?.position ?? -1) + 1;

        // Add video to playlist
        const playlistVideo = await prisma.playlistVideo.create({
            data: {
                playlistId: id,
                videoId,
                position: newPosition,
            },
            include: {
                video: true,
            },
        });

        return NextResponse.json(playlistVideo, { status: 201 });
    } catch (error: any) {
        if (error.code === "P2002") {
            return NextResponse.json({ error: "Video already in playlist" }, { status: 400 });
        }
        console.error("[PLAYLIST_ADD_VIDEO]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// DELETE /api/playlists/[id]/videos?videoId=xxx - Remove video from playlist
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const videoId = searchParams.get("videoId");

        if (!videoId) {
            return NextResponse.json({ error: "Video ID is required" }, { status: 400 });
        }

        // Verify playlist belongs to user
        const playlist = await prisma.playlist.findUnique({
            where: {
                id,
            },
        });

        if (!playlist || playlist.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        await prisma.playlistVideo.deleteMany({
            where: {
                playlistId: id,
                videoId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[PLAYLIST_REMOVE_VIDEO]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
