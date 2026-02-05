"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    Loader2,
    GraduationCap,
    ChevronDown,
    ChevronUp,
    Circle,
    CircleDot,
    CheckCircle2,
    PlayCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Course {
    id: string;
    slug: string;
    title: string;
    youtubePlaylistId: string;
    thumbnail: string | null;
    lessonsCount: number;
    progress: {
        videosWatched: number;
        totalVideos: number;
        completionRate: number;
        lastWatchedAt: string | null;
        isStarted: boolean;
        isCompleted: boolean;
    } | null;
}

interface Category {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    courses: Course[];
    stats: {
        totalCourses: number;
        completedCourses: number;
        startedCourses: number;
        completionRate: number;
    };
}

interface Section {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    icon: string | null;
    categories: Category[];
    stats: {
        totalCourses: number;
        completedCourses: number;
        startedCourses: number;
        completionRate: number;
    };
}

interface CurriculumData {
    sections: Section[];
    overallStats: {
        totalCourses: number;
        completedCourses: number;
        startedCourses: number;
        completionRate: number;
    };
}

export default function IITMCurriculumPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [curriculum, setCurriculum] = useState<CurriculumData | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['foundation']));

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            fetchCurriculum();
        }
    }, [status, router]);

    const fetchCurriculum = async () => {
        try {
            const response = await fetch("/api/iitm/curriculum");
            if (!response.ok) throw new Error("Failed to fetch curriculum");

            const data = await response.json();
            setCurriculum(data);
        } catch (error) {
            console.error("Error fetching curriculum:", error);
            toast.error("Failed to load curriculum");
        } finally {
            setLoading(false);
        }
    };

    const toggleSection = (sectionSlug: string) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sectionSlug)) {
                newSet.delete(sectionSlug);
            } else {
                newSet.add(sectionSlug);
            }
            return newSet;
        });
    };

    const getStatusIcon = (course: Course) => {
        if (course.progress?.isCompleted) {
            return <CheckCircle2 className="w-5 h-5 text-green-500" />;
        } else if (course.progress?.isStarted) {
            return <CircleDot className="w-5 h-5 text-primary animate-pulse" />;
        } else {
            return <Circle className="w-5 h-5 text-muted-foreground" />;
        }
    };

    const handleStartCourse = async (course: Course) => {
        try {
            toast.loading("Preparing course...", { id: "course-load" });

            // FIRST: Check if playlist already exists for this course
            const playlistsRes = await fetch("/api/playlists");
            if (playlistsRes.ok) {
                const playlists = await playlistsRes.json();
                const existingPlaylist = playlists.find((p: any) =>
                    p.name === course.title
                );

                if (existingPlaylist) {
                    // Playlist already exists - use it
                    const detailsRes = await fetch(`/api/playlists/${existingPlaylist.id}`);
                    if (detailsRes.ok) {
                        const details = await detailsRes.json();
                        if (details.videos && details.videos.length > 0) {
                            toast.dismiss("course-load");
                            router.push(`/app/watch/${details.videos[0].video.id}?playlistId=${existingPlaylist.id}`);
                            return;
                        }
                    }
                }
            }

            // SECOND: No existing playlist found - create a new one
            // Update message to inform about playlist import
            toast.loading(
                "Importing course playlist... This may take a moment. Please wait.",
                { id: "course-load" }
            );

            const response = await fetch("/api/playlists", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: course.title,
                    youtubeId: `https://www.youtube.com/playlist?list=${course.youtubePlaylistId}`,
                }),
            });

            if (response.ok) {
                const playlist = await response.json();

                // Fetch the playlist details to get videos
                const playlistDetailsRes = await fetch(`/api/playlists/${playlist.id}`);
                if (playlistDetailsRes.ok) {
                    const playlistDetails = await playlistDetailsRes.json();

                    if (playlistDetails.videos && playlistDetails.videos.length > 0) {
                        // Navigate to first video WITH playlist context
                        toast.success(`Successfully imported ${playlistDetails.videos.length} videos!`, { id: "course-load" });
                        router.push(`/app/watch/${playlistDetails.videos[0].video.id}?playlistId=${playlist.id}`);
                        return;
                    }
                }
            }

            toast.dismiss("course-load");
            toast.error("No videos found in this course");
        } catch (error) {
            console.error("Error starting course:", error);
            toast.error("Failed to load course. Please try again.", { id: "course-load" });
        }
    };



    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!curriculum) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-muted-foreground">Failed to load curriculum</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <GraduationCap className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-bold">IIT Madras BS Degree Programme</h1>
                </div>
                <p className="text-muted-foreground">
                    Your comprehensive curriculum roadmap for the BS degree
                </p>
            </div>

            {/* Overall Progress Card */}
            <Card className="p-6 mb-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-semibold">Overall Progress</h2>
                        <p className="text-sm text-muted-foreground">
                            {curriculum.overallStats.completedCourses} of {curriculum.overallStats.totalCourses} courses completed
                        </p>
                    </div>
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                        {curriculum.overallStats.completionRate}%
                    </Badge>
                </div>
                <Progress value={curriculum.overallStats.completionRate} className="h-3" />
                <div className="flex gap-6 mt-4 text-sm">
                    <div>
                        <span className="text-muted-foreground">Not Started: </span>
                        <span className="font-semibold">
                            {curriculum.overallStats.totalCourses - curriculum.overallStats.startedCourses}
                        </span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">In Progress: </span>
                        <span className="font-semibold text-primary">
                            {curriculum.overallStats.startedCourses - curriculum.overallStats.completedCourses}
                        </span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Completed: </span>
                        <span className="font-semibold text-green-600">
                            {curriculum.overallStats.completedCourses}
                        </span>
                    </div>
                </div>
            </Card>

            {/* Curriculum Sections */}
            <div className="space-y-6">
                {curriculum.sections.map((section) => (
                    <Card key={section.id} className="overflow-hidden">
                        {/* Section Header */}
                        <button
                            onClick={() => toggleSection(section.slug)}
                            className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="text-4xl">
                                    {section.slug === 'foundation' && '📘'}
                                    {section.slug === 'diploma' && '📗'}
                                    {section.slug === 'bsc' && '📙'}
                                    {section.slug === 'bs' && '📕'}
                                    {section.slug === 'qualifier' && '🔑'}
                                    {section.slug === 'supplementary' && '📚'}
                                    {section.slug === 'pg-diploma' && '⭐'}
                                    {section.slug === 'mtech' && '👑'}
                                </div>
                                <div className="text-left">
                                    <h3 className="text-xl font-semibold flex items-center gap-2">
                                        {section.title}
                                        {(section.slug === 'pg-diploma' || section.slug === 'mtech') ? (
                                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                                🚀 Coming Soon
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">
                                                {section.stats.completedCourses}/{section.stats.totalCourses}
                                            </Badge>
                                        )}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">{section.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right mr-4">
                                    <div className="text-2xl font-bold text-primary">
                                        {section.stats.completionRate}%
                                    </div>
                                    <Progress value={section.stats.completionRate} className="w-24 h-2" />
                                </div>
                                {expandedSections.has(section.slug) ? (
                                    <ChevronUp className="w-6 h-6" />
                                ) : (
                                    <ChevronDown className="w-6 h-6" />
                                )}
                            </div>
                        </button>

                        {/* Section Content */}
                        {expandedSections.has(section.slug) && (
                            <div className="border-t p-6 space-y-6">
                                {/* Coming Soon Message */}
                                {(section.slug === 'pg-diploma' || section.slug === 'mtech') && (
                                    <div className="text-center py-12">
                                        <div className="text-6xl mb-4">
                                            {section.slug === 'pg-diploma' ? '⭐' : '👑'}
                                        </div>
                                        <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                            Coming Soon!
                                        </h3>
                                        <p className="text-muted-foreground max-w-md mx-auto">
                                            {section.slug === 'pg-diploma'
                                                ? 'PG Diploma courses (20 credits) will be available soon. Requires CGPA ≥ 8.0 from BS Degree.'
                                                : 'MTech program will be available after PG Diploma completion.'}
                                        </p>
                                    </div>
                                )}

                                {/* Regular course categories */}
                                {section.slug !== 'pg-diploma' && section.slug !== 'mtech' && section.categories.map((category) => (
                                    <div key={category.id}>
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-lg font-semibold">{category.title}</h4>
                                            <Badge variant="secondary">
                                                {category.stats.completedCourses}/{category.stats.totalCourses} completed
                                            </Badge>
                                        </div>

                                        <div className="space-y-3">
                                            {category.courses.map((course) => (
                                                <Card key={course.id} className="p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex items-start gap-4">
                                                        {/* Thumbnail */}
                                                        <div className="relative flex-shrink-0">
                                                            {course.thumbnail ? (
                                                                <img
                                                                    src={course.thumbnail}
                                                                    alt={course.title}
                                                                    className="w-32 h-20 object-cover rounded"
                                                                />
                                                            ) : (
                                                                <div className="w-32 h-20 bg-muted rounded flex items-center justify-center">
                                                                    <PlayCircle className="w-8 h-8 text-muted-foreground" />
                                                                </div>
                                                            )}
                                                            {course.progress && course.progress.completionRate > 0 && (
                                                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/30">
                                                                    <div
                                                                        className="h-full bg-primary"
                                                                        style={{ width: `${course.progress.completionRate}%` }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Course Info */}
                                                        <div className="flex-1">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        {getStatusIcon(course)}
                                                                        <h5 className="font-semibold text-foreground">
                                                                            {course.title}
                                                                        </h5>
                                                                    </div>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {course.lessonsCount} lessons
                                                                        {course.progress?.lastWatchedAt && (
                                                                            <> • Last watched: {new Date(course.progress.lastWatchedAt).toLocaleDateString()}</>
                                                                        )}
                                                                    </p>
                                                                </div>

                                                                {/* Progress Badge */}
                                                                <Badge
                                                                    variant={course.progress?.isCompleted ? "default" : "secondary"}
                                                                    className="ml-4"
                                                                >
                                                                    {course.progress?.completionRate || 0}%
                                                                </Badge>
                                                            </div>

                                                            {/* Action Button */}
                                                            <div className="mt-3">
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleStartCourse(course)}
                                                                >
                                                                    <PlayCircle className="w-4 h-4 mr-2" />
                                                                    {course.progress?.isStarted ? "Continue Learning" : "Start Learning"}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                ))}
            </div>

            {/* Info Banner */}
            <Card className="mt-8 p-6 bg-muted/30 border-dashed">
                <p className="text-sm text-muted-foreground text-center">
                    🔒 This is the official IITM BS curriculum. Course structure and order cannot be modified.
                    Your progress is automatically tracked as you watch videos.
                </p>
            </Card>
        </div>
    );
}
