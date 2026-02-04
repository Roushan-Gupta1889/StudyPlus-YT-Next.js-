import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ==============================
// GET /api/history
// Fetch watch history
// ==============================
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const history = await prisma.watchHistory.findMany({
            where: {
                userId: session.user.id,
            },
            include: {
                video: true,
            },
            orderBy: {
                watchedAt: "desc",
            },
            take: 50,
        });

        return NextResponse.json(history);
    } catch (error) {
        console.error("[HISTORY_GET]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// ==============================
// POST /api/history
// Log watch progress (NO DUPLICATES)
// ==============================
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        let { videoId, watchTime } = body;

        if (!videoId || watchTime === undefined) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (watchTime <= 0) {
            return NextResponse.json(
                { error: "Watch time must be positive" },
                { status: 400 }
            );
        }

        // Cap watch time (12 hours safety)
        if (watchTime > 3600 * 12) {
            watchTime = 3600 * 12;
        }

        const video = await prisma.video.findUnique({
            where: { id: videoId },
        });

        if (!video || video.userId !== session.user.id) {
            return NextResponse.json(
                { error: "Video not found" },
                { status: 404 }
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            // 🔥 ONE history row per (userId + videoId)
            const historyEntry = await tx.watchHistory.upsert({
                where: {
                    userId_videoId: {
                        userId: session.user.id,
                        videoId,
                    },
                },
                create: {
                    userId: session.user.id,
                    videoId,
                    watchTime,
                },
                update: {
                    watchTime: {
                        increment: watchTime,
                    },
                    watchedAt: new Date(),
                },
            });

            // Calculate progress
            let progress = 0;
            if (video.duration && video.duration > 0) {
                progress = Math.min(
                    100,
                    Math.round(
                        (historyEntry.watchTime / video.duration) * 100
                    )
                );
            }

            const isCompleted = progress >= 95;
            const wasCompleted = video.completed;

            // Update video progress
            await tx.video.update({
                where: { id: videoId },
                data: {
                    progress,
                    completed: isCompleted,
                    updatedAt: new Date(),
                },
            });

            // Update analytics
            const videosCompletedIncrement =
                !wasCompleted && isCompleted ? 1 : 0;

            await tx.userAnalytics.upsert({
                where: {
                    userId: session.user.id,
                },
                create: {
                    userId: session.user.id,
                    totalWatchTime: watchTime,
                    videosCompleted: videosCompletedIncrement,
                    lastWatchDate: new Date(),
                    currentStreak: 1,
                    longestStreak: 1,
                },
                update: {
                    totalWatchTime: {
                        increment: watchTime,
                    },
                    videosCompleted: {
                        increment: videosCompletedIncrement,
                    },
                    lastWatchDate: new Date(),
                },
            });

            return historyEntry;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("[HISTORY_POST]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// ==============================
// DELETE /api/history
// ==============================
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const clearAll = searchParams.get("clearAll");

        if (clearAll === "true") {
            await prisma.watchHistory.deleteMany({
                where: {
                    userId: session.user.id,
                },
            });

            return NextResponse.json({ message: "History cleared" });
        }

        if (id) {
            const historyItem = await prisma.watchHistory.findUnique({
                where: { id },
            });

            if (!historyItem) {
                return NextResponse.json(
                    { error: "Item not found" },
                    { status: 404 }
                );
            }

            if (historyItem.userId !== session.user.id) {
                return NextResponse.json(
                    { error: "Unauthorized" },
                    { status: 403 }
                );
            }

            await prisma.watchHistory.delete({
                where: { id },
            });

            return NextResponse.json({ message: "Item deleted" });
        }

        return NextResponse.json(
            { error: "Missing parameters" },
            { status: 400 }
        );
    } catch (error) {
        console.error("[HISTORY_DELETE]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
