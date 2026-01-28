import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/notes - Fetch notes (optionally filter by videoId)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const videoId = searchParams.get("videoId");

        const notes = await prisma.note.findMany({
            where: {
                userId: session.user.id,
                ...(videoId && { videoId }),
            },
            include: {
                video: {
                    select: {
                        id: true,
                        title: true,
                        youtubeId: true,
                        thumbnail: true,
                        channel: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(notes);
    } catch (error) {
        console.error("[NOTES_GET]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// POST /api/notes - Create a note
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { videoId, content, timestamp } = body;

        if (!videoId || !content || timestamp === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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

        const note = await prisma.note.create({
            data: {
                userId: session.user.id,
                videoId,
                content,
                timestamp,
            },
            include: {
                video: {
                    select: {
                        id: true,
                        title: true,
                        youtubeId: true,
                        thumbnail: true,
                        channel: true,
                    },
                },
            },
        });

        return NextResponse.json(note, { status: 201 });
    } catch (error) {
        console.error("[NOTES_POST]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
