import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/videos/[id] - Get single video
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

        const video = await prisma.video.findUnique({
            where: { id },
        });

        if (!video || video.userId !== session.user.id) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        return NextResponse.json(video);
    } catch (error) {
        console.error("[VIDEO_GET]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// PATCH /api/videos/[id] - Update video progress
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
        const {
            progress,
            completed,
            duration,
            // Phase 1: Player state fields
            currentTime,
            playbackRate,
            muted
        } = body;

        const video = await prisma.video.findUnique({
            where: {
                id,
            },
        });

        if (!video || video.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // Build update data
        const updateData: any = {};

        // Existing fields
        if (progress !== undefined) updateData.progress = progress;
        if (completed !== undefined) updateData.completed = completed;
        if (duration !== undefined) updateData.duration = duration;

        // Phase 1: Player state fields with validation
        if (currentTime !== undefined) {
            if (typeof currentTime === 'number' && currentTime >= 0) {
                updateData.currentTime = Math.floor(currentTime);
            }
        }

        if (playbackRate !== undefined) {
            // Validate playback rate (YouTube supports: 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2)
            const validRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
            if (validRates.includes(playbackRate)) {
                updateData.playbackRate = playbackRate;
            }
        }

        if (muted !== undefined) {
            if (typeof muted === 'boolean') {
                updateData.muted = muted;
            }
        }

        // Only update if there's something to update
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(video);
        }

        const updatedVideo = await prisma.video.update({
            where: {
                id,
            },
            data: updateData,
        });

        return NextResponse.json(updatedVideo);
    } catch (error) {
        console.error("[VIDEO_PATCH]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// DELETE /api/videos/[id] - Delete video
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

        const video = await prisma.video.findUnique({
            where: {
                id,
            },
        });

        if (!video || video.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // Soft delete: Remove from library view but keep record for playlists/history
        await prisma.video.update({
            where: {
                id,
            },
            data: {
                inLibrary: false,
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[VIDEO_DELETE]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
