import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/analytics - Fetch user analytics
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get or create analytics
        let analytics = await prisma.userAnalytics.findUnique({
            where: {
                userId: session.user.id,
            },
        });

        if (!analytics) {
            analytics = await prisma.userAnalytics.create({
                data: {
                    userId: session.user.id,
                },
            });
        }

        // Get weekly activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const weeklyHistory = await prisma.watchHistory.findMany({
            where: {
                userId: session.user.id,
                watchedAt: {
                    gte: sevenDaysAgo,
                },
            },
            orderBy: {
                watchedAt: "asc",
            },
        });

        // Group by day
        const dailyStats = weeklyHistory.reduce((acc: any, entry) => {
            const day = entry.watchedAt.toISOString().split("T")[0];
            if (!acc[day]) {
                acc[day] = { date: day, watchTime: 0, count: 0 };
            }
            acc[day].watchTime += entry.duration;
            acc[day].count += 1;
            return acc;
        }, {});

        const weeklyActivity = Object.values(dailyStats);

        // Get category breakdown (top channels)
        const videos = await prisma.video.findMany({
            where: {
                userId: session.user.id,
            },
            select: {
                channel: true,
                duration: true,
            },
        });

        const categoryStats = videos.reduce((acc: any, video) => {
            const channel = video.channel || "Unknown";
            if (!acc[channel]) {
                acc[channel] = { name: channel, totalTime: 0, count: 0 };
            }
            acc[channel].totalTime += video.duration || 0;
            acc[channel].count += 1;
            return acc;
        }, {});

        const topCategories = Object.values(categoryStats)
            .sort((a: any, b: any) => b.totalTime - a.totalTime)
            .slice(0, 5);

        return NextResponse.json({
            ...analytics,
            weeklyActivity,
            topCategories,
        });
    } catch (error) {
        console.error("[ANALYTICS_GET]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
