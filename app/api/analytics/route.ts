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

        // Calculate current streak
        const allHistory = await prisma.watchHistory.findMany({
            where: {
                userId: session.user.id,
            },
            orderBy: {
                watchedAt: "desc",
            },
        });

        let currentStreak = 0;
        let longestStreak = 0;

        if (allHistory.length > 0) {
            // Group watch history by day
            const daySet = new Set<string>();
            allHistory.forEach(entry => {
                const day = entry.watchedAt.toISOString().split("T")[0];
                daySet.add(day);
            });

            // Sort days in descending order
            const sortedDays = Array.from(daySet).sort().reverse();

            // Calculate current streak (consecutive days from today backwards)
            const today = new Date().toISOString().split("T")[0];
            let checkDate = new Date(today);

            for (let i = 0; i < sortedDays.length; i++) {
                const currentDay = checkDate.toISOString().split("T")[0];

                if (sortedDays.includes(currentDay)) {
                    currentStreak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }

            // Calculate longest streak (all time)
            let tempStreak = 1;
            for (let i = 0; i < sortedDays.length - 1; i++) {
                const currentDate = new Date(sortedDays[i]);
                const nextDate = new Date(sortedDays[i + 1]);
                const dayDiff = Math.round((currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24));

                if (dayDiff === 1) {
                    tempStreak++;
                    longestStreak = Math.max(longestStreak, tempStreak);
                } else {
                    tempStreak = 1;
                }
            }
            longestStreak = Math.max(longestStreak, tempStreak, currentStreak);
        }

        // Update analytics with calculated streaks
        analytics = await prisma.userAnalytics.update({
            where: {
                userId: session.user.id,
            },
            data: {
                currentStreak,
                longestStreak,
            },
        });

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
            acc[day].watchTime += entry.watchTime;
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
