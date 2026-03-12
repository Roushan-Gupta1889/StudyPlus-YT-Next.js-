import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/overview - Platform-wide admin stats
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify admin role
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        });

        if (!user || (user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // --- Aggregate stats ---
        const [
            totalUsers,
            iitmUsers,
            totalVideos,
            totalNotes,
            totalPlaylists,
            watchTimeAgg,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { isIITMUser: true } }),
            prisma.video.count(),
            prisma.note.count(),
            prisma.playlist.count(),
            prisma.userAnalytics.aggregate({ _sum: { totalWatchTime: true } }),
        ]);

        const totalWatchTime = watchTimeAgg._sum.totalWatchTime || 0;

        // New users in the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const newUsersThisWeek = await prisma.user.count({
            where: { createdAt: { gte: sevenDaysAgo } },
        });

        // Signups per day (last 30 days) for chart
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentUsers = await prisma.user.findMany({
            where: { createdAt: { gte: thirtyDaysAgo } },
            select: { createdAt: true },
            orderBy: { createdAt: "asc" },
        });

        // Group signups by day
        const signupsByDay: Record<string, number> = {};
        for (let i = 0; i < 30; i++) {
            const d = new Date();
            d.setDate(d.getDate() - (29 - i));
            signupsByDay[d.toISOString().split("T")[0]] = 0;
        }
        recentUsers.forEach((u) => {
            const day = u.createdAt.toISOString().split("T")[0];
            if (signupsByDay[day] !== undefined) {
                signupsByDay[day]++;
            }
        });

        const signupsChart = Object.entries(signupsByDay).map(([date, count]) => ({
            date,
            count,
        }));

        // Videos completed count
        const videosCompleted = await prisma.video.count({
            where: { completed: true },
        });

        return NextResponse.json({
            totalUsers,
            iitmUsers,
            totalVideos,
            totalNotes,
            totalPlaylists,
            totalWatchTime,
            newUsersThisWeek,
            videosCompleted,
            signupsChart,
            avgVideosPerUser: totalUsers > 0 ? Math.round((totalVideos / totalUsers) * 10) / 10 : 0,
            iitmPercentage: totalUsers > 0 ? Math.round((iitmUsers / totalUsers) * 100) : 0,
        });
    } catch (error) {
        console.error("[ADMIN_OVERVIEW_GET]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
