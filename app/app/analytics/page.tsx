"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { TrendingUp, Clock, Target, Award, Loader2, BarChart2, Flame, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface AnalyticsData {
    totalWatchTime: number;
    videosCompleted: number;
    currentStreak: number;
    longestStreak: number;
    weeklyActivity: Array<{ date: string; watchTime: number; count: number }>;
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

interface BarData {
    day: string;
    hours: number;
    count: number;
    isToday: boolean;
}

function ActivityBar({
    data,
    maxHours,
    index,
}: {
    data: BarData;
    maxHours: number;
    index: number;
}) {
    const [animated, setAnimated] = useState(false);
    const hasActivity = data.hours > 0;
    const heightPercent = maxHours > 0 ? (data.hours / maxHours) * 100 : 0;
    const finalHeight = hasActivity ? Math.max(heightPercent, 4) : 0;

    useEffect(() => {
        const t = setTimeout(() => setAnimated(true), 100 + index * 80);
        return () => clearTimeout(t);
    }, [index]);

    const isToday = data.isToday;

    const barGradient = isToday
        ? "linear-gradient(to top, hsl(234 85% 42%), hsl(270 70% 62%))"
        : "linear-gradient(to top, hsl(234 75% 52%), hsl(234 65% 68%))";

    const glowColor = isToday
        ? "0 4px 20px 2px hsl(260 70% 55% / 0.45)"
        : "0 4px 12px 1px hsl(234 85% 60% / 0.25)";

    return (
        <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
            {/* Always-visible hour label above bar */}
            <div className="h-6 flex items-end justify-center">
                <span
                    className={`text-[11px] font-semibold leading-none transition-all duration-500 ${animated && hasActivity
                        ? isToday ? "text-primary opacity-100" : "text-foreground/80 opacity-100"
                        : "opacity-0"
                        }`}
                >
                    {hasActivity
                        ? data.hours < 1
                            ? `${Math.round(data.hours * 60)}m`
                            : `${data.hours.toFixed(1)}h`
                        : ""}
                </span>
            </div>

            {/* Bar column */}
            <div className="w-full flex flex-col justify-end flex-1 relative">
                {/* Zero-activity placeholder */}
                {!hasActivity && (
                    <div className="w-full h-1.5 rounded-full border-2 border-dashed border-border/50" />
                )}

                {/* The bar */}
                {hasActivity && (
                    <div
                        className="w-full rounded-t-xl relative overflow-hidden"
                        style={{
                            height: animated ? `${finalHeight}%` : "0%",
                            background: barGradient,
                            boxShadow: animated ? glowColor : "none",
                            transitionProperty: "height, box-shadow",
                            transitionDuration: "0.65s",
                            transitionTimingFunction: "cubic-bezier(0.34, 1.4, 0.64, 1)",
                        }}
                    >
                        {/* Sheen */}
                        <div
                            className="absolute inset-0"
                            style={{
                                background: "linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent)",
                            }}
                        />
                        {/* Today pulse dot */}
                        {isToday && animated && (
                            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/90 shadow-md animate-pulse" />
                        )}
                    </div>
                )}
            </div>

            {/* Day name */}
            <span
                className={`text-[11px] font-semibold leading-tight ${isToday ? "text-primary" : "text-muted-foreground"
                    }`}
            >
                {data.day}
            </span>

            {/* Video count or Today pill */}
            {isToday ? (
                <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary/15 text-primary leading-none">
                    Today
                </span>
            ) : (
                <span className="text-[10px] text-muted-foreground/60 leading-none">
                    {hasActivity ? `${data.count}v` : "—"}
                </span>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
    const { data: session } = useSession();
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [notesCount, setNotesCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setIsLoading(true);
                const analyticsRes = await fetch("/api/analytics");
                if (analyticsRes.ok) {
                    const data = await analyticsRes.json();
                    setAnalytics(data);
                }
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

        if (session) fetchAnalytics();
    }, [session]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse">Loading your stats…</p>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-6">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <BarChart2 className="w-10 h-10 text-primary" />
                </div>
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-foreground mb-2">No Analytics Yet</h2>
                    <p className="text-muted-foreground">Start watching videos to see your learning analytics</p>
                </div>
            </div>
        );
    }

    // ── Stats ──────────────────────────────────────────────────────────────────

    const stats = [
        {
            icon: Clock,
            label: "Total Watch Time",
            value: formatTime(analytics.totalWatchTime),
            sub: analytics.totalWatchTime > 0 ? "Keep learning!" : "Start watching",
            iconBg: "bg-primary/10",
            iconColor: "text-primary",
            accentColor: "border-primary/30",
        },
        {
            icon: Target,
            label: "Videos Completed",
            value: analytics.videosCompleted.toString(),
            sub: analytics.videosCompleted > 0 ? `${analytics.videosCompleted} finished` : "Complete your first",
            iconBg: "bg-emerald-500/10",
            iconColor: "text-emerald-500",
            accentColor: "border-emerald-500/30",
        },
        {
            icon: Flame,
            label: "Current Streak",
            value: `${analytics.currentStreak}d`,
            sub:
                analytics.longestStreak > analytics.currentStreak
                    ? `Best: ${analytics.longestStreak} days`
                    : "Personal best! 🔥",
            iconBg: "bg-orange-500/10",
            iconColor: "text-orange-500",
            accentColor: "border-orange-500/30",
        },
        {
            icon: BookOpen,
            label: "Notes Created",
            value: notesCount.toString(),
            sub: notesCount > 0 ? "Great notes!" : "Add your first note",
            iconBg: "bg-purple-500/10",
            iconColor: "text-purple-500",
            accentColor: "border-purple-500/30",
        },
    ];

    // ── Chart data ─────────────────────────────────────────────────────────────

    const todayStr = new Date().toDateString();

    // Build a full 7-day grid for the current week (Mon → Sun)
    // so all 7 bars are always visible, even with no activity
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun … 6=Sat
    // Start from Monday of the current week
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    const shortDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Index the API data by date string for fast lookup
    const activityMap = new Map<string, { watchTime: number; count: number }>();
    analytics.weeklyActivity.forEach((d) => {
        activityMap.set(new Date(d.date).toDateString(), {
            watchTime: d.watchTime,
            count: d.count,
        });
    });

    const weeklyData: BarData[] = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        const key = date.toDateString();
        const activity = activityMap.get(key) ?? { watchTime: 0, count: 0 };
        return {
            day: shortDay[date.getDay()],
            hours: activity.watchTime / 3600,
            count: activity.count,
            isToday: key === todayStr,
        };
    });

    const maxHours = Math.max(...weeklyData.map((d) => d.hours), 0.1);
    const thisWeekTotal = weeklyData.reduce((acc, d) => acc + d.hours, 0);

    // Y-axis labels (0 → maxHours in 4 steps)
    const ySteps = 4;
    const yLabels = Array.from({ length: ySteps + 1 }, (_, i) =>
        parseFloat(((maxHours / ySteps) * (ySteps - i)).toFixed(1))
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="mb-8 animate-fade-in-up">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">Learning Analytics</h1>
                <p className="text-muted-foreground">Track your progress and learning patterns</p>
            </div>

            {/* ── Stat Cards ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
                {stats.map((stat, i) => (
                    <div
                        key={stat.label}
                        className={`bg-card rounded-2xl border ${stat.accentColor} p-4 sm:p-5 flex flex-col
                                   hover:shadow-card transition-all duration-300 hover:scale-[1.02]
                                   animate-fade-in-up`}
                        style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
                    >
                        <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center mb-3`}>
                            <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                        </div>
                        <p className="text-xs text-muted-foreground mb-1 font-medium">{stat.label}</p>
                        <p className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                    </div>
                ))}
            </div>

            {/* ── Weekly Activity Chart ───────────────────────────────────────── */}
            <div
                className="bg-card rounded-2xl border border-border p-5 sm:p-6 mb-6 animate-fade-in-up"
                style={{ animationDelay: "320ms", animationFillMode: "both" }}
            >
                {/* Chart header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">This Week&apos;s Activity</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">Daily learning hours</p>
                    </div>
                    <div className="text-right">
                        <span className="text-lg font-bold text-foreground">
                            {formatTime(Math.floor(thisWeekTotal * 3600))}
                        </span>
                        <p className="text-xs text-muted-foreground">this week</p>
                    </div>
                </div>

                {weeklyData.length > 0 ? (
                    <div className="flex gap-4">
                        {/* Y-axis */}
                        <div className="flex flex-col justify-between pb-7 text-right w-9 flex-shrink-0">
                            {yLabels.map((label, i) => (
                                <span key={i} className="text-[10px] text-muted-foreground leading-none">
                                    {label > 0 ? `${label}h` : ""}
                                </span>
                            ))}
                        </div>

                        {/* Chart area */}
                        <div className="flex-1 relative">
                            {/* Guide lines */}
                            <div className="absolute inset-0 pb-7 flex flex-col justify-between pointer-events-none">
                                {yLabels.map((label, i) => (
                                    <div
                                        key={i}
                                        className="w-full border-t border-dashed border-border/50"
                                        style={{ opacity: i === yLabels.length - 1 ? 1 : 0.6 }}
                                    />
                                ))}
                            </div>

                            {/* Bars */}
                            <div className="flex items-stretch justify-between gap-1.5 sm:gap-2 h-64 relative z-10">
                                {weeklyData.map((data, idx) => (
                                    <ActivityBar
                                        key={idx}
                                        data={data}
                                        maxHours={maxHours}
                                        index={idx}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-56 gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                            <BarChart2 className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground text-center">
                            No activity this week — start watching to see your progress!
                        </p>
                    </div>
                )}
            </div>

            {/* ── Bottom Insights ─────────────────────────────────────────────── */}
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Learning Stats */}
                <div
                    className="bg-card rounded-2xl border border-border p-5 sm:p-6 animate-fade-in-up"
                    style={{ animationDelay: "400ms", animationFillMode: "both" }}
                >
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Learning Stats
                    </h3>
                    <div className="space-y-3">
                        {[
                            {
                                label: "Average per day",
                                value:
                                    weeklyData.length > 0
                                        ? formatTime(Math.floor((thisWeekTotal / weeklyData.length) * 3600))
                                        : "0m",
                                dot: "bg-primary",
                            },
                            {
                                label: "Longest streak",
                                value: `${analytics.longestStreak} day${analytics.longestStreak !== 1 ? "s" : ""}`,
                                dot: "bg-orange-500",
                            },
                            {
                                label: "Total videos",
                                value: `${analytics.videosCompleted} completed`,
                                dot: "bg-emerald-500",
                            },
                            {
                                label: "Total notes",
                                value: `${notesCount} created`,
                                dot: "bg-purple-500",
                            },
                        ].map((row, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${row.dot}`} />
                                    <span className="text-sm text-muted-foreground">{row.label}</span>
                                </div>
                                <span className="text-sm font-semibold text-foreground">{row.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Keep Going */}
                <div
                    className="bg-card rounded-2xl border border-border p-5 sm:p-6 animate-fade-in-up"
                    style={{ animationDelay: "480ms", animationFillMode: "both" }}
                >
                    <h3 className="font-semibold text-foreground mb-4">Keep Going! 🚀</h3>
                    <div className="space-y-3">
                        {analytics.currentStreak > 0 && (
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-500/8 border border-orange-500/20">
                                <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Flame className="w-4 h-4 text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        {analytics.currentStreak}-Day Streak 🔥
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        You&apos;ve watched videos for {analytics.currentStreak} consecutive days!
                                    </p>
                                </div>
                            </div>
                        )}
                        {analytics.videosCompleted >= 10 && (
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Award className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Milestone Unlocked 🏆</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {analytics.videosCompleted} videos completed — great progress!
                                    </p>
                                </div>
                            </div>
                        )}
                        {thisWeekTotal > 0 && (
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/8 border border-primary/20">
                                <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Clock className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Active This Week ⚡</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {formatTime(Math.floor(thisWeekTotal * 3600))} of focused learning time!
                                    </p>
                                </div>
                            </div>
                        )}
                        {analytics.currentStreak === 0 && analytics.videosCompleted < 10 && thisWeekTotal === 0 && (
                            <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Start your journey!</p>
                                    <p className="text-xs text-muted-foreground mt-1">Watch videos to earn achievements</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
