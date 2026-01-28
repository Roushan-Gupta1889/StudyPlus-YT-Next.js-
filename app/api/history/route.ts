import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/history - Fetch watch history
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
            take: 50, // Limit to last 50 items
        });

        return NextResponse.json(history);
    } catch (error) {
        console.error("[HISTORY_GET]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// POST /api/history - Log a watch event
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        let { videoId, watchTime } = body;

        // Validate watch time
        if (!videoId || watchTime === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (watchTime <= 0) {
            return NextResponse.json({ error: "Watch time must be positive" }, { status: 400 });
        }

        // Cap watch time to reasonable maximum (12 hours per sync)
        if (watchTime > 3600 * 12) {
            watchTime = 3600 * 12;
        }

        // Verify video exists and belongs to user
        const video = await prisma.video.findUnique({
            where: {
                id: videoId,
            },
        });

        if (!video || video.userId !== session.user.id) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        // Calculate total watch time for this video
        const existingHistory = await prisma.watchHistory.findMany({
            where: {
                userId: session.user.id,
                videoId: videoId,
            },
        });

        const totalWatchTime = existingHistory.reduce((sum, entry) => sum + entry.watchTime, 0) + watchTime;

        // Calculate progress percentage (0-100)
        let progress = 0;
        if (video.duration && video.duration > 0) {
            progress = Math.min(100, Math.round((totalWatchTime / video.duration) * 100));
        }

        // Determine if video is completed (95% threshold)
        const isCompleted = progress >= 95;
        const wasCompleted = video.completed;

        // Check if there's a recent history entry (e.g., within last 1 hour)
        const recentEntry = await prisma.watchHistory.findFirst({
            where: {
                userId: session.user.id,
                videoId: videoId,
                watchedAt: {
                    gt: new Date(Date.now() - 60 * 60 * 1000), // Last 1 hour
                },
            },
            orderBy: {
                watchedAt: "desc",
            },
        });

        // Use transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
            let historyEntry;

            if (recentEntry) {
                // Update existing entry
                historyEntry = await tx.watchHistory.update({
                    where: {
                        id: recentEntry.id,
                    },
                    data: {
                        watchTime: {
                            increment: watchTime,
                        },
                        watchedAt: new Date(),
                    },
                });
            } else {
                // Create new watch history entry
                historyEntry = await tx.watchHistory.create({
                    data: {
                        userId: session.user.id,
                        videoId,
                        watchTime,
                    },
                });
            }

            // Update video progress and completion status
            await tx.video.update({
                where: {
                    id: videoId,
                },
                data: {
                    progress,
                    completed: isCompleted,
                    updatedAt: new Date(),
                },
            });

            // Update user analytics
            const videosCompletedIncrement = !wasCompleted && isCompleted ? 1 : 0;

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


// DELETE /api/history - Delete history items
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
            // Delete all history for user
            await prisma.watchHistory.deleteMany({
                where: {
                    userId: session.user.id,
                },
            });
            return NextResponse.json({ message: "History cleared" });
        }

        if (id) {
            // Delete specific history item
            // Ensure it belongs to the user
            const historyItem = await prisma.watchHistory.findUnique({
                where: { id },
            });

            if (!historyItem) {
                return NextResponse.json({ error: "Item not found" }, { status: 404 });
            }

            if (historyItem.userId !== session.user.id) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
            }

            await prisma.watchHistory.delete({
                where: { id },
            });

            return NextResponse.json({ message: "Item deleted" });
        }

        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    } catch (error) {
        console.error("[HISTORY_DELETE]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
