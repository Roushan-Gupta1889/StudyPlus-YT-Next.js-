import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/videos - Fetch user's videos
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const videos = await prisma.video.findMany({
            where: {
                userId: session.user.id,
            },
            include: {
                notes: {
                    orderBy: {
                        timestamp: "asc",
                    },
                },
            },
            orderBy: {
                updatedAt: "desc",
            },
        });

        return NextResponse.json(videos);
    } catch (error) {
        console.error("[VIDEOS_GET]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// POST /api/videos - Save a new video
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { youtubeId, title, description, thumbnail, duration, channel } = body;

        if (!youtubeId || !title) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check if video already exists for this user
        const existingVideo = await prisma.video.findUnique({
            where: {
                userId_youtubeId: {
                    userId: session.user.id,
                    youtubeId,
                },
            },
        });

        if (existingVideo) {
            return NextResponse.json(existingVideo);
        }

        // Create new video
        const video = await prisma.video.create({
            data: {
                userId: session.user.id,
                youtubeId,
                title,
                description,
                thumbnail,
                duration,
                channel,
            },
        });

        return NextResponse.json(video, { status: 201 });
    } catch (error) {
        console.error("[VIDEOS_POST]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
