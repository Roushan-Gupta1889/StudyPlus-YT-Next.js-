import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createErrorResponse, ErrorCode, handleDatabaseError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";

// Rate limiter: 30 requests per minute per user
const limiter = rateLimit({
    interval: 60 * 1000,
    uniqueTokenPerInterval: 500,
});

// ==============================
// GET /api/history
// Fetch watch history
// ==============================
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            const { response, statusCode } = createErrorResponse(
                ErrorCode.UNAUTHORIZED,
                "Unauthorized",
                401
            );
            return NextResponse.json(response, { status: statusCode });
        }

        const history = await prisma.watchHistory.findMany({
            where: {
                userId: session.user.id,
            },
            include: {
                video: {
                    include: {
                        // Include playlist memberships so callers can build
                        // the correct watch URL with ?playlistId=
                        playlistVideos: {
                            select: {
                                playlistId: true,
                            },
                            take: 1, // we only need the first playlist
                        },
                    },
                },
            },
            orderBy: {
                watchedAt: "desc",
            },
            take: 50,
        });

        return NextResponse.json(history);
    } catch (error) {
        console.error("[HISTORY_GET]", error);
        const { response, statusCode } = createErrorResponse(
            ErrorCode.INTERNAL_ERROR,
            "Failed to fetch watch history",
            500
        );
        return NextResponse.json(response, { status: statusCode });
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
            const { response, statusCode } = createErrorResponse(
                ErrorCode.UNAUTHORIZED,
                "Unauthorized",
                401
            );
            return NextResponse.json(response, { status: statusCode });
        }

        // Rate limiting - 30 req/min
        try {
            await limiter.check(30, session.user.id);
        } catch {
            const { response, statusCode } = createErrorResponse(
                ErrorCode.RATE_LIMIT_EXCEEDED,
                "Too many requests. Please slow down.",
                429
            );
            return NextResponse.json(response, { status: statusCode });
        }

        const body = await request.json();
        let { videoId, watchTime } = body;

        if (!videoId || watchTime === undefined) {
            const { response, statusCode } = createErrorResponse(
                ErrorCode.MISSING_FIELD,
                "Missing required fields: videoId and watchTime",
                400
            );
            return NextResponse.json(response, { status: statusCode });
        }

        if (watchTime <= 0) {
            const { response, statusCode } = createErrorResponse(
                ErrorCode.INVALID_INPUT,
                "Watch time must be positive",
                400
            );
            return NextResponse.json(response, { status: statusCode });
        }

        // Cap watch time (12 hours safety)
        if (watchTime > 3600 * 12) {
            watchTime = 3600 * 12;
        }

        const video = await prisma.video.findUnique({
            where: { id: videoId },
        });

        if (!video || video.userId !== session.user.id) {
            const { response, statusCode } = createErrorResponse(
                ErrorCode.NOT_FOUND,
                "Video not found",
                404
            );
            return NextResponse.json(response, { status: statusCode });
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

            // Calculate progress with division-by-zero protection
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
    } catch (error: any) {
        console.error("[HISTORY_POST]", error);

        // Handle database errors FIRST (Prisma errors also have error.code)
        if (error.code?.startsWith('P')) {
            const appError = handleDatabaseError(error);
            return NextResponse.json(appError.toJSON(), { status: appError.statusCode });
        }

        // Handle known application errors
        if (error.code && error.toJSON) {
            return NextResponse.json(error.toJSON(), { status: error.statusCode });
        }

        const { response, statusCode } = createErrorResponse(
            ErrorCode.INTERNAL_ERROR,
            "Failed to update watch history",
            500
        );
        return NextResponse.json(response, { status: statusCode });
    }
}

// ==============================
// DELETE /api/history
// Delete watch history
// ==============================
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const videoId = searchParams.get("videoId");

        if (videoId) {
            // Delete specific history entry
            await prisma.watchHistory.delete({
                where: {
                    userId_videoId: {
                        userId: session.user.id,
                        videoId,
                    },
                },
            });
        } else {
            // Clear all history
            await prisma.watchHistory.deleteMany({
                where: {
                    userId: session.user.id,
                },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[HISTORY_DELETE]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
