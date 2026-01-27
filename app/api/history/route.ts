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
        const { videoId, watchTime } = body;

        if (!videoId || watchTime === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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

        let historyEntry;

        if (recentEntry) {
            // Update existing entry
            historyEntry = await prisma.watchHistory.update({
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
            historyEntry = await prisma.watchHistory.create({
                data: {
                    userId: session.user.id,
                    videoId,
                    watchTime,
                },
            });
        }

        // Update user analytics
        const analytics = await prisma.userAnalytics.upsert({
            where: {
                userId: session.user.id,
            },
            create: {
                userId: session.user.id,
                totalWatchTime: watchTime,
                videosCompleted: video.completed ? 1 : 0,
                lastWatchDate: new Date(),
                currentStreak: 1,
                longestStreak: 1,
            },
            update: {
                totalWatchTime: {
                    increment: watchTime,
                },
                lastWatchDate: new Date(),
            },
        });

        return NextResponse.json(historyEntry, { status: 201 });
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
