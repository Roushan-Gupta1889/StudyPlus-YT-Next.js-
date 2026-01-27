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
                inLibrary: true,
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
            // Restore to library if it was "deleted"
            if (!existingVideo.inLibrary) {
                const updatedVideo = await prisma.video.update({
                    where: { id: existingVideo.id },
                    data: { inLibrary: true }
                });
                return NextResponse.json(updatedVideo);
            }
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
                inLibrary: true,
            },
        });

        return NextResponse.json(video, { status: 201 });
    } catch (error) {
        console.error("[VIDEOS_POST]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// DELETE /api/videos - Clear library
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const clearAll = searchParams.get("clearAll");

        if (clearAll === "true") {
            // Remove all videos from library (soft delete)
            await prisma.video.updateMany({
                where: {
                    userId: session.user.id,
                    inLibrary: true,
                },
                data: {
                    inLibrary: false,
                },
            });
            return NextResponse.json({ message: "Library cleared" });
        }

        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    } catch (error) {
        console.error("[VIDEOS_DELETE]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
