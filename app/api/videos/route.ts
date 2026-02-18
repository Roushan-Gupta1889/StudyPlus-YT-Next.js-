import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVideoDetails, extractVideoId } from "@/lib/youtube";

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
        let { youtubeId, title, description, thumbnail, duration, channel } = body;

        // If simple quick-add (only URL provided)
        if (!title && youtubeId) {
            const extractedId = extractVideoId(youtubeId);
            if (!extractedId) {
                return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
            }

            try {
                const details = await getVideoDetails(extractedId);
                youtubeId = details.id;
                title = details.title;
                description = details.description;
                thumbnail = details.thumbnail;
                duration = details.duration;
                channel = details.channel;
            } catch (error) {
                console.error("Failed to fetch video details:", error);
                return NextResponse.json({ error: "Failed to fetch video details" }, { status: 400 });
            }
        }

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
            console.log("[VIDEOS_DELETE] Clearing all videos for user:", session.user.id);

            try {
                // Delete all videos in library (hard delete)
                const result = await prisma.video.deleteMany({
                    where: {
                        userId: session.user.id,
                        inLibrary: true,
                    },
                });

                console.log("[VIDEOS_DELETE] Successfully deleted", result.count, "videos");
                return NextResponse.json({
                    message: "Library cleared",
                    deletedCount: result.count
                });
            } catch (deleteError) {
                console.error("[VIDEOS_DELETE] Error during deletion:", deleteError);
                return NextResponse.json({
                    error: "Failed to delete videos",
                    details: deleteError instanceof Error ? deleteError.message : "Unknown error"
                }, { status: 500 });
            }
        }

        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    } catch (error) {
        console.error("[VIDEOS_DELETE]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
