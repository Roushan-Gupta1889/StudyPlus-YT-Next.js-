import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/iitm/progress - Update course progress
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { courseSlug, videosWatched, totalVideos } = body;

        if (!courseSlug || typeof videosWatched !== 'number' || typeof totalVideos !== 'number') {
            return NextResponse.json(
                { error: "Invalid request data" },
                { status: 400 }
            );
        }

        // Find the course
        const course = await prisma.iITMCourse.findUnique({
            where: { slug: courseSlug },
        });

        if (!course) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        // Calculate completion rate
        const completionRate = totalVideos > 0
            ? Math.round((videosWatched / totalVideos) * 100)
            : 0;

        const isCompleted = completionRate >= 95;
        const isStarted = videosWatched > 0;

        // Upsert progress
        const progress = await prisma.iITMUserProgress.upsert({
            where: {
                userId_courseId: {
                    userId: session.user.id,
                    courseId: course.id,
                },
            },
            create: {
                userId: session.user.id,
                courseId: course.id,
                videosWatched,
                totalVideos,
                completionRate,
                isStarted,
                isCompleted,
                lastWatchedAt: new Date(),
            },
            update: {
                videosWatched,
                totalVideos,
                completionRate,
                isStarted,
                isCompleted,
                lastWatchedAt: new Date(),
            },
        });

        return NextResponse.json(progress);
    } catch (error) {
        console.error("[IITM_PROGRESS_POST]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// GET /api/iitm/progress - Get user's overall IITM progress
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get all progress records for this user
        const progressRecords = await prisma.iITMUserProgress.findMany({
            where: { userId: session.user.id },
            include: {
                course: {
                    include: {
                        category: {
                            include: {
                                section: true,
                            },
                        },
                    },
                },
            },
            orderBy: { lastWatchedAt: 'desc' },
        });

        // Calculate overall stats
        const totalCourses = await prisma.iITMCourse.count();
        const startedCourses = progressRecords.filter(p => p.isStarted).length;
        const completedCourses = progressRecords.filter(p => p.isCompleted).length;

        // Group by section
        const sectionStats: Record<string, any> = {};

        for (const record of progressRecords) {
            const sectionSlug = record.course.category.section.slug;

            if (!sectionStats[sectionSlug]) {
                sectionStats[sectionSlug] = {
                    sectionTitle: record.course.category.section.title,
                    total: 0,
                    completed: 0,
                    started: 0,
                };
            }

            sectionStats[sectionSlug].total++;
            if (record.isCompleted) sectionStats[sectionSlug].completed++;
            if (record.isStarted) sectionStats[sectionSlug].started++;
        }

        return NextResponse.json({
            overallProgress: {
                totalCourses,
                startedCourses,
                completedCourses,
                completionRate: totalCourses > 0
                    ? Math.round((completedCourses / totalCourses) * 100)
                    : 0,
            },
            sectionProgress: sectionStats,
            recentCourses: progressRecords.slice(0, 5).map(p => ({
                courseSlug: p.course.slug,
                courseTitle: p.course.title,
                categoryTitle: p.course.category.title,
                sectionTitle: p.course.category.section.title,
                completionRate: p.completionRate,
                lastWatchedAt: p.lastWatchedAt,
            })),
        });
    } catch (error) {
        console.error("[IITM_PROGRESS_GET]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
