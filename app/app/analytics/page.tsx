"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { TrendingUp, Clock, Target, Award, Loader2, BarChart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface AnalyticsData {
    totalWatchTime: number;
    videosCompleted: number;
    currentStreak: number;
    longestStreak: number;
    weeklyActivity: Array<{ date: string; watchTime: number; count: number }>;
}

export default function AnalyticsPage() {
    const { data: session } = useSession();
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [notesCount, setNotesCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setIsLoading(true);

                // Fetch analytics
                const analyticsRes = await fetch("/api/analytics");
                if (analyticsRes.ok) {
                    const data = await analyticsRes.json();
                    setAnalytics(data);
                }

                // Fetch notes count
                const notesRes = await fetch("/api/notes");
                if (notesRes.ok) {
                    const notes = await notesRes.json();
                    setNotesCount(notes.length);
                }
            } catch (error) {
                console.error("Error fetching analytics:", error);
                toast.error("Failed to load analytics");
            } finally {
                setIsLoading(false);
            }
        };

        if (session) {
            fetchAnalytics();
        }
    }, [session]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-8">
                <BarChart className="w-16 h-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">No Analytics Yet</h2>
                <p className="text-muted-foreground text-center">
                    Start watching videos to see your learning analytics
                </p>
            </div>
        );
    }

    const stats = [
        {
            icon: Clock,
            label: "Total Watch Time",
            value: formatTime(analytics.totalWatchTime),
            change: analytics.totalWatchTime > 0 ? "Keep learning!" : "Start watching",
            color: "text-primary",
        },
        {
            icon: Target,
            label: "Videos Completed",
            value: analytics.videosCompleted.toString(),
            change: analytics.videosCompleted > 0 ? `${analytics.videosCompleted} finished` : "Complete your first",
            color: "text-success",
        },
        {
            icon: TrendingUp,
            label: "Current Streak",
            value: `${analytics.currentStreak} day${analytics.currentStreak !== 1 ? 's' : ''}`,
            change: analytics.longestStreak > analytics.currentStreak
                ? `Best: ${analytics.longestStreak} days`
                : "Personal best!",
            color: "text-orange-500",
        },
        {
            icon: Award,
            label: "Notes Created",
            value: notesCount.toString(),
            change: notesCount > 0 ? "Great notes!" : "Add your first note",
            color: "text-purple-500",
        },
    ];

    // Process weekly data for chart
    const weeklyData = analytics.weeklyActivity.map((day) => {
        const date = new Date(day.date);
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return {
            day: dayNames[date.getDay()],
            hours: day.watchTime / 3600, // Convert seconds to hours
            count: day.count,
        };
    });

    const maxHours = weeklyData.length > 0 ? Math.max(...weeklyData.map((d) => d.hours)) : 1;
    const thisWeekTotal = weeklyData.reduce((acc, d) => acc + d.hours, 0);

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground mb-1">Learning Analytics</h1>
                <p className="text-muted-foreground">Track your progress and learning patterns</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat) => (
                    <Card key={stat.label} className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`${stat.color}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <span className="text-sm text-muted-foreground">{stat.label}</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.change}</p>
                    </Card>
                ))}
            </div>

            {/* Weekly Chart */}
            <Card className="p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-foreground">This Week's Activity</h2>
                    <span className="text-sm text-muted-foreground">
                        {formatTime(Math.floor(thisWeekTotal * 3600))} total
                    </span>
                </div>
                {weeklyData.length > 0 ? (
                    <div className="flex items-end justify-between gap-3 h-64">
                        {weeklyData.map((data, idx) => {
                            const heightPercent = maxHours > 0 ? (data.hours / maxHours) * 100 : 0;
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                                    <div className="w-full flex flex-col justify-end h-full">
                                        <div
                                            className="w-full bg-primary rounded-t-lg transition-all hover:bg-primary/80 relative group"
                                            style={{ height: `${Math.max(heightPercent, 2)}%` }}
                                        >
                                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap border border-border">
                                                <div>{data.hours.toFixed(1)}h</div>
                                                <div className="text-[10px] text-muted-foreground">{data.count} videos</div>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground font-medium">{data.day}</span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                        No activity this week - start watching to see your progress!
                    </div>
                )}
            </Card>

            {/* Additional Insights */}
            <div className="grid sm:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="font-semibold text-foreground mb-4">Learning Stats</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Average per day</span>
                            <span className="text-sm font-medium text-foreground">
                                {weeklyData.length > 0
                                    ? formatTime(Math.floor((thisWeekTotal / weeklyData.length) * 3600))
                                    : "0m"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Longest streak</span>
                            <span className="text-sm font-medium text-foreground">
                                {analytics.longestStreak} day{analytics.longestStreak !== 1 ? "s" : ""}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Total videos</span>
                            <span className="text-sm font-medium text-foreground">
                                {analytics.videosCompleted} completed
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Total notes</span>
                            <span className="text-sm font-medium text-foreground">{notesCount} created</span>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="font-semibold text-foreground mb-4">Keep Going! 🚀</h3>
                    <div className="space-y-4">
                        {analytics.currentStreak > 0 && (
                            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-medium text-foreground">Current Streak</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    You've watched videos for {analytics.currentStreak} consecutive days. Keep it up!
                                </p>
                            </div>
                        )}
                        {analytics.videosCompleted >= 10 && (
                            <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <Award className="w-4 h-4 text-success" />
                                    <span className="text-sm font-medium text-foreground">Milestone Achieved</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    You've completed {analytics.videosCompleted} videos! Great progress!
                                </p>
                            </div>
                        )}
                        {thisWeekTotal > 0 && (
                            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <Clock className="w-4 h-4 text-orange-500" />
                                    <span className="text-sm font-medium text-foreground">This Week</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {formatTime(Math.floor(thisWeekTotal * 3600))} of learning time this week!
                                </p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
