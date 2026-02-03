import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/iitm/curriculum - Get complete IITM curriculum structure
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch complete curriculum with all sections, categories, and courses
        const sections = await prisma.iITMCurriculumSection.findMany({
            orderBy: { order: 'asc' },
            include: {
                categories: {
                    orderBy: { order: 'asc' },
                    include: {
                        courses: {
                            orderBy: { order: 'asc' },
                            include: {
                                userProgress: {
                                    where: { userId: session.user.id },
                                    select: {
                                        videosWatched: true,
                                        totalVideos: true,
                                        completionRate: true,
                                        lastWatchedAt: true,
                                        isStarted: true,
                                        isCompleted: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        // Calculate section and category progress
        const sectionsWithProgress = sections.map(section => {
            let sectionTotalCourses = 0;
            let sectionCompletedCourses = 0;
            let sectionStartedCourses = 0;

            const categoriesWithProgress = section.categories.map(category => {
                const totalCourses = category.courses.length;
                const completedCourses = category.courses.filter(c =>
                    c.userProgress[0]?.isCompleted
                ).length;
                const startedCourses = category.courses.filter(c =>
                    c.userProgress[0]?.isStarted
                ).length;

                sectionTotalCourses += totalCourses;
                sectionCompletedCourses += completedCourses;
                sectionStartedCourses += startedCourses;

                return {
                    ...category,
                    stats: {
                        totalCourses,
                        completedCourses,
                        startedCourses,
                        completionRate: totalCourses > 0
                            ? Math.round((completedCourses / totalCourses) * 100)
                            : 0,
                    },
                    courses: category.courses.map(course => ({
                        ...course,
                        progress: course.userProgress[0] || null,
                        userProgress: undefined, // Remove array, use flattened progress
                    })),
                };
            });

            return {
                ...section,
                stats: {
                    totalCourses: sectionTotalCourses,
                    completedCourses: sectionCompletedCourses,
                    startedCourses: sectionStartedCourses,
                    completionRate: sectionTotalCourses > 0
                        ? Math.round((sectionCompletedCourses / sectionTotalCourses) * 100)
                        : 0,
                },
                categories: categoriesWithProgress,
            };
        });

        // Overall statistics
        const totalCourses = sections.reduce(
            (acc, s) => acc + s.categories.reduce((a, c) => a + c.courses.length, 0),
            0
        );
        const completedCourses = sections.reduce(
            (acc, s) => acc + s.categories.reduce(
                (a, c) => a + c.courses.filter(course => course.userProgress[0]?.isCompleted).length,
                0
            ),
            0
        );
        const startedCourses = sections.reduce(
            (acc, s) => acc + s.categories.reduce(
                (a, c) => a + c.courses.filter(course => course.userProgress[0]?.isStarted).length,
                0
            ),
            0
        );

        return NextResponse.json({
            sections: sectionsWithProgress,
            overallStats: {
                totalCourses,
                completedCourses,
                startedCourses,
                completionRate: totalCourses > 0
                    ? Math.round((completedCourses / totalCourses) * 100)
                    : 0,
            },
        });
    } catch (error) {
        console.error("[IITM_CURRICULUM_GET]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
