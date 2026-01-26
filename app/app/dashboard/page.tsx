"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Flame, Clock, Play, TrendingUp, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { YouTubeSearch } from "@/components/app/YouTubeSearch";
import { toast } from "sonner";

interface AnalyticsData {
    currentStreak: number;
    totalWatchTime: number;
    weeklyActivity: Array<{ date: string; watchTime: number; count: number }>;
}

interface Video {
    id: string;
    title: string;
    channel: string | null;
    progress: number;
    duration: number | null;
    thumbnail: string | null;
}

interface Playlist {
    id: string;
    name: string;
    totalVideos: number;
    completedVideos: number;
    totalDuration: number;
}

export default function DashboardPage() {
    const { data: session } = useSession();
    const [showSearch, setShowSearch] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [videos, setVideos] = useState<Video[]>([]);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);

    // Format seconds to hours and minutes
    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    // Fetch dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setIsLoading(true);

                // Fetch analytics
                const analyticsRes = await fetch("/api/analytics");
                if (analyticsRes.ok) {
                    const analyticsData = await analyticsRes.json();
                    setAnalytics(analyticsData);
                }

                // Fetch videos
                const videosRes = await fetch("/api/videos");
                if (videosRes.ok) {
                    const videosData = await fetch("/api/videos");
                    if (videosRes.ok) {
                        const videosData = await videosRes.json();
                        // Filter videos with progress > 0 and < 100
                        const inProgress = videosData.filter(
                            (v: Video) => v.progress > 0 && v.progress < 100
                        );
                        setVideos(inProgress.slice(0, 2)); // Top 2
                    }
                }

                // Fetch playlists
                const playlistsRes = await fetch("/api/playlists");
                if (playlistsRes.ok) {
                    const playlistsData = await playlistsRes.json();
                    setPlaylists(playlistsData.slice(0, 3)); // Top 3
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                toast.error("Failed to load dashboard data");
            } finally {
                setIsLoading(false);
            }
        };

        if (session) {
            fetchDashboardData();
        }
    }, [session]);

    // Calculate today's watch time (last 24 hours)
    const todayWatchTime = analytics?.weeklyActivity
        ? analytics.weeklyActivity
            .filter((day) => {
                const dayDate = new Date(day.date);
                const today = new Date();
                return dayDate.toDateString() === today.toDateString();
            })
            .reduce((acc, day) => acc + day.watchTime, 0)
        : 0;

    // Calculate this week's watch time
    const weekWatchTime = analytics?.weeklyActivity
        ? analytics.weeklyActivity.reduce((acc, day) => acc + day.watchTime, 0)
        : 0;

    const stats = [
        {
            icon: Flame,
            label: "Day Streak",
            value: analytics?.currentStreak?.toString() || "0",
            color: "text-orange-500",
        },
        {
            icon: Clock,
            label: "Today",
            value: formatTime(todayWatchTime),
            color: "text-primary",
        },
        {
            icon: TrendingUp,
            label: "This Week",
            value: formatTime(weekWatchTime),
            color: "text-success",
        },
    ];

    if (isLoading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 sm:mb-8">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                        Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},{" "}
                        {session?.user?.name || "Learner"} 👋
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Ready to continue your learning journey?
                    </p>
                </div>
                <Button onClick={() => setShowSearch(!showSearch)} className="gap-2 w-full sm:w-auto">
                    <Search className="w-4 h-4" />
                    Search YouTube
                </Button>
            </div>

            {/* YouTube Search */}
            {showSearch && (
                <div className="mb-6 sm:mb-8">
                    <YouTubeSearch onClose={() => setShowSearch(false)} />
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-10">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-card rounded-2xl border border-border p-4 sm:p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            <span className="text-sm text-muted-foreground">{stat.label}</span>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Continue Watching */}
            <section className="mb-8 sm:mb-10">
                <div className="flex items-center justify-between mb-4 sm:mb-5">
                    <h2 className="text-base sm:text-lg font-semibold text-foreground">Continue Watching</h2>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/app/watch">View all</Link>
                    </Button>
                </div>
                {videos.length === 0 ? (
                    <div className="bg-card rounded-2xl border border-border p-8 text-center">
                        <p className="text-muted-foreground">No videos in progress. Start watching to see them here!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {videos.map((video) => (
                            <Link
                                key={video.id}
                                href={`/app/watch?v=${video.id}`}
                                className="group bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/20 hover:shadow-card transition-all"
                            >
                                <div className="aspect-video bg-muted relative flex items-center justify-center">
                                    {video.thumbnail ? (
                                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                                            <Play className="w-10 sm:w-12 h-10 sm:h-12 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                                        </>
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                                        <div className="h-full bg-primary" style={{ width: `${video.progress}%` }} />
                                    </div>
                                </div>
                                <div className="p-3 sm:p-4">
                                    <h3 className="font-medium text-foreground mb-1 line-clamp-1 text-sm sm:text-base">
                                        {video.title}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-muted-foreground">
                                        {video.channel} {video.duration && `· ${formatTime(video.duration)}`}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* Active Playlists */}
            <section>
                <div className="flex items-center justify-between mb-4 sm:mb-5">
                    <h2 className="text-base sm:text-lg font-semibold text-foreground">Your Playlists</h2>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/app/playlists">View all</Link>
                    </Button>
                </div>
                {playlists.length === 0 ? (
                    <div className="bg-card rounded-2xl border border-border p-8 text-center">
                        <p className="text-muted-foreground">No playlists yet. Create one to organize your videos!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {playlists.map((playlist) => {
                            const progress = playlist.totalVideos > 0
                                ? Math.round((playlist.completedVideos / playlist.totalVideos) * 100)
                                : 0;
                            const isComplete = progress === 100;
                            return (
                                <Link
                                    key={playlist.id}
                                    href="/app/playlists"
                                    className="bg-card rounded-2xl border border-border p-4 sm:p-5 hover:border-primary/20 hover:shadow-card transition-all"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-foreground mb-1 truncate">{playlist.name}</h3>
                                            <p className="text-xs sm:text-sm text-muted-foreground">
                                                {playlist.completedVideos}/{playlist.totalVideos} videos · {formatTime(playlist.totalDuration)}
                                            </p>
                                        </div>
                                        {/* Progress Ring */}
                                        <div className="relative w-10 h-10 sm:w-12 sm:h-12 ml-3 flex-shrink-0">
                                            <svg className="w-10 h-10 sm:w-12 sm:h-12 -rotate-90">
                                                <circle cx="50%" cy="50%" r="35%" className="fill-none stroke-muted stroke-[3]" />
                                                <circle
                                                    cx="50%"
                                                    cy="50%"
                                                    r="35%"
                                                    className={`fill-none stroke-[3] transition-all ${isComplete ? "stroke-success" : "stroke-primary"
                                                        }`}
                                                    strokeDasharray={`${progress * 1.256} 125.6`}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <span className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-medium text-foreground">
                                                {progress}%
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
