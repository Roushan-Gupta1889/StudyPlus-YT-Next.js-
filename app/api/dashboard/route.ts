import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const userId = user.id;

        // Execute all data fetching in parallel
        const [analyticsData, continueWatching, playlists] = await Promise.all([
            getAnalytics(userId),
            getContinueWatching(userId),
            getPlaylists(userId),
        ]);

        return NextResponse.json({
            analytics: analyticsData,
            continueWatching,
            playlists,
        });
    } catch (error) {
        console.error("[DASHBOARD_GET]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

async function getAnalytics(userId: string) {
    // Get or create analytics record
    let analytics = await prisma.userAnalytics.findUnique({
        where: { userId },
    });

    if (!analytics) {
        analytics = await prisma.userAnalytics.create({
            data: { userId },
        });
    }

    // Calculate streaks
    const allHistory = await prisma.watchHistory.findMany({
        where: { userId },
        orderBy: { watchedAt: "desc" },
        select: { watchedAt: true }
    });

    let currentStreak = 0;
    let longestStreak = 0;

    if (allHistory.length > 0) {
        const daySet = new Set<string>();
        allHistory.forEach((entry) => {
            const day = entry.watchedAt.toISOString().split("T")[0];
            daySet.add(day);
        });

        const sortedDays = Array.from(daySet).sort().reverse();
        const today = new Date().toISOString().split("T")[0];
        let checkDate = new Date(today);

        // Calculate current streak
        for (let i = 0; i < sortedDays.length; i++) {
            const currentDay = checkDate.toISOString().split("T")[0];
            if (sortedDays.includes(currentDay)) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                // Check yesterday logic
                if (i === 0 && currentDay !== sortedDays[0]) {
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    if (sortedDays[0] === yesterday.toISOString().split("T")[0]) {
                        // streak is valid from yesterday
                    }
                }
                break;
            }
        }

        // Calculate longest streak
        let tempStreak = 1;
        for (let i = 0; i < sortedDays.length - 1; i++) {
            const currentDate = new Date(sortedDays[i]);
            const nextDate = new Date(sortedDays[i + 1]);
            const dayDiff = Math.round(
                (currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (dayDiff === 1) {
                tempStreak++;
                longestStreak = Math.max(longestStreak, tempStreak);
            } else {
                tempStreak = 1;
            }
        }
        longestStreak = Math.max(longestStreak, tempStreak, currentStreak);
    }

    // Side effect: Update analytics record
    if (analytics.currentStreak !== currentStreak || analytics.longestStreak !== longestStreak) {
        await prisma.userAnalytics.update({
            where: { userId },
            data: { currentStreak, longestStreak },
        });
    }

    // Weekly Activity (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyHistory = await prisma.watchHistory.findMany({
        where: {
            userId,
            watchedAt: { gte: sevenDaysAgo },
        },
        orderBy: { watchedAt: "asc" },
    });

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

    // Top Categories
    const videos = await prisma.video.findMany({
        where: { userId },
        select: { channel: true, duration: true },
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

    return {
        ...analytics,
        currentStreak,
        longestStreak,
        weeklyActivity,
        topCategories,
    };
}

async function getContinueWatching(userId: string) {
    return prisma.video.findMany({
        where: {
            userId,
            inLibrary: true,
            progress: {
                gt: 0,
                lt: 100,
            },
        },
        orderBy: { updatedAt: "desc" },
        take: 4,
    });
}

async function getPlaylists(userId: string) {
    const playlists = await prisma.playlist.findMany({
        where: { userId },
        include: {
            videos: {
                orderBy: { position: "asc" },
                select: {
                    video: {
                        select: {
                            duration: true,
                            completed: true,
                            thumbnail: true,
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
    });

    return playlists.map((playlist) => ({
        id: playlist.id,
        name: playlist.name,
        // Calculate stats
        totalVideos: playlist.videos.length,
        completedVideos: playlist.videos.filter((pv) => pv.video.completed).length,
        totalDuration: playlist.videos.reduce((acc, pv) => acc + (pv.video.duration || 0), 0),
        thumbnail: playlist.videos[0]?.video?.thumbnail || null,
    }));
}
