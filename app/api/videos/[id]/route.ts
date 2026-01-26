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
        const { progress, completed } = body;

        const video = await prisma.video.findUnique({
            where: {
                id,
            },
        });

        if (!video || video.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const updatedVideo = await prisma.video.update({
            where: {
                id,
            },
            data: {
                progress,
                completed,
            },
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

        await prisma.video.delete({
            where: {
                id,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[VIDEO_DELETE]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
