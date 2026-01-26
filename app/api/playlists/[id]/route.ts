import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/playlists/[id] - Get playlist details
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

        const playlist = await prisma.playlist.findUnique({
            where: {
                id,
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
        });

        if (!playlist || playlist.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        return NextResponse.json(playlist);
    } catch (error) {
        console.error("[PLAYLIST_GET]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// PATCH /api/playlists/[id] - Update playlist
export async function PATCH(
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
        const { name, description } = body;

        const playlist = await prisma.playlist.findUnique({
            where: {
                id,
            },
        });

        if (!playlist || playlist.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const updatedPlaylist = await prisma.playlist.update({
            where: {
                id,
            },
            data: {
                name,
                description,
            },
        });

        return NextResponse.json(updatedPlaylist);
    } catch (error) {
        console.error("[PLAYLIST_PATCH]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// DELETE /api/playlists/[id] - Delete playlist
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

        const playlist = await prisma.playlist.findUnique({
            where: {
                id,
            },
        });

        if (!playlist || playlist.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        await prisma.playlist.delete({
            where: {
                id,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[PLAYLIST_DELETE]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
