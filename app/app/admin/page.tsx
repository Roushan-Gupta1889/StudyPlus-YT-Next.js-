"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
    Users,
    Video,
    FileText,
    Clock,
    TrendingUp,
    GraduationCap,
    Loader2,
    BarChart2,
    ListVideo,
    UserPlus,
} from "lucide-react";
import Link from "next/link";

interface OverviewData {
    totalUsers: number;
    iitmUsers: number;
    totalVideos: number;
    totalNotes: number;
    totalPlaylists: number;
    totalWatchTime: number;
    newUsersThisWeek: number;
    videosCompleted: number;
    signupsChart: Array<{ date: string; count: number }>;
    avgVideosPerUser: number;
    iitmPercentage: number;
}

// ─── Signup Chart Bar ─────────────────────────────────────────────────────────

function SignupBar({
    count,
    maxCount,
    date,
    index,
}: {
    count: number;
    maxCount: number;
    date: string;
    index: number;
}) {
    const [animated, setAnimated] = useState(false);
    const heightPercent = maxCount > 0 ? (count / maxCount) * 100 : 0;
    const finalHeight = count > 0 ? Math.max(heightPercent, 4) : 0;

    useEffect(() => {
        const t = setTimeout(() => setAnimated(true), 50 + index * 20);
        return () => clearTimeout(t);
    }, [index]);

    const d = new Date(date);
    const dayNum = d.getDate();
    const isToday = new Date().toISOString().split("T")[0] === date;

    return (
        <div className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
            {/* Count label */}
            <div className="h-5 flex items-end justify-center">
                <span
                    className={`text-[9px] font-semibold leading-none transition-all duration-500 ${animated && count > 0
                            ? isToday
                                ? "text-primary opacity-100"
                                : "text-foreground/70 opacity-100"
                            : "opacity-0"
                        }`}
                >
                    {count > 0 ? count : ""}
                </span>
            </div>

            {/* Bar */}
            <div className="w-full flex flex-col justify-end flex-1 relative">
                {!count && (
                    <div className="w-full h-0.5 rounded-full bg-border/40" />
                )}
                {count > 0 && (
                    <div
                        className="w-full rounded-t-md relative overflow-hidden"
                        style={{
                            height: animated ? `${finalHeight}%` : "0%",
                            background: isToday
                                ? "linear-gradient(to top, hsl(234 85% 42%), hsl(270 70% 62%))"
                                : "linear-gradient(to top, hsl(234 75% 52%), hsl(234 65% 68%))",
                            boxShadow: animated
                                ? isToday
                                    ? "0 4px 20px 2px hsl(260 70% 55% / 0.45)"
                                    : "0 2px 8px 1px hsl(234 85% 60% / 0.2)"
                                : "none",
                            transitionProperty: "height, box-shadow",
                            transitionDuration: "0.5s",
                            transitionTimingFunction: "cubic-bezier(0.34, 1.4, 0.64, 1)",
                        }}
                    >
                        <div
                            className="absolute inset-0"
                            style={{
                                background:
                                    "linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent)",
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Date label — show every 5th day */}
            {(index % 5 === 0 || isToday) && (
                <span
                    className={`text-[8px] leading-none mt-0.5 ${isToday
                            ? "text-primary font-bold"
                            : "text-muted-foreground"
                        }`}
                >
                    {d.toLocaleDateString("en", { month: "short", day: "numeric" })}
                </span>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminOverviewPage() {
    const { data: session } = useSession();
    const [data, setData] = useState<OverviewData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    useEffect(() => {
        const fetchOverview = async () => {
            try {
                setIsLoading(true);
                const res = await fetch("/api/admin/overview");
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (error) {
                console.error("Error fetching admin overview:", error);
            } finally {
                setIsLoading(false);
            }
        };
        if (session) fetchOverview();
    }, [session]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse">Loading admin dashboard…</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-6">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <BarChart2 className="w-10 h-10 text-primary" />
                </div>
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-foreground mb-2">No Data Available</h2>
                    <p className="text-muted-foreground">Unable to load admin overview data.</p>
                </div>
            </div>
        );
    }

    // ── Stats ──────────────────────────────────────────────────────────────

    const stats = [
        {
            icon: Users,
            label: "Total Users",
            value: data.totalUsers.toString(),
            sub: `${data.newUsersThisWeek} new this week`,
            iconBg: "bg-primary/10",
            iconColor: "text-primary",
            accentColor: "border-primary/30",
        },
        {
            icon: Video,
            label: "Total Videos",
            value: data.totalVideos.toString(),
            sub: `${data.videosCompleted} completed`,
            iconBg: "bg-emerald-500/10",
            iconColor: "text-emerald-500",
            accentColor: "border-emerald-500/30",
        },
        {
            icon: Clock,
            label: "Total Watch Time",
            value: formatTime(data.totalWatchTime),
            sub: `${data.avgVideosPerUser} avg videos/user`,
            iconBg: "bg-orange-500/10",
            iconColor: "text-orange-500",
            accentColor: "border-orange-500/30",
        },
        {
            icon: FileText,
            label: "Total Notes",
            value: data.totalNotes.toString(),
            sub: `${data.totalPlaylists} playlists`,
            iconBg: "bg-purple-500/10",
            iconColor: "text-purple-500",
            accentColor: "border-purple-500/30",
        },
    ];

    // ── Signup Chart ───────────────────────────────────────────────────────

    const maxSignups = Math.max(...data.signupsChart.map((d) => d.count), 1);

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="mb-8 animate-fade-in-up">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <BarChart2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Admin Overview</h1>
                        <p className="text-muted-foreground text-sm">Platform-wide stats and insights</p>
                    </div>
                </div>
            </div>

            {/* ── Stat Cards ───────────────────────────────────────────────── */}
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

            {/* ── Signups Chart (Last 30 Days) ─────────────────────────────── */}
            <div
                className="bg-card rounded-2xl border border-border p-5 sm:p-6 mb-6 animate-fade-in-up"
                style={{ animationDelay: "320ms", animationFillMode: "both" }}
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">New Signups</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">Last 30 days</p>
                    </div>
                    <div className="text-right">
                        <span className="text-lg font-bold text-foreground">
                            {data.signupsChart.reduce((s, d) => s + d.count, 0)}
                        </span>
                        <p className="text-xs text-muted-foreground">total signups</p>
                    </div>
                </div>

                <div className="flex items-stretch gap-0.5 h-48">
                    {data.signupsChart.map((d, idx) => (
                        <SignupBar
                            key={d.date}
                            count={d.count}
                            maxCount={maxSignups}
                            date={d.date}
                            index={idx}
                        />
                    ))}
                </div>
            </div>

            {/* ── Quick Insights ────────────────────────────────────────────── */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* IITM Breakdown */}
                <div
                    className="bg-card rounded-2xl border border-border p-5 sm:p-6 animate-fade-in-up"
                    style={{ animationDelay: "400ms", animationFillMode: "both" }}
                >
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-primary" />
                        IITM Users
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between py-2 border-b border-border">
                            <span className="text-sm text-muted-foreground">IITM Students</span>
                            <span className="text-sm font-semibold text-foreground">{data.iitmUsers}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-border">
                            <span className="text-sm text-muted-foreground">Non-IITM Users</span>
                            <span className="text-sm font-semibold text-foreground">{data.totalUsers - data.iitmUsers}</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-sm text-muted-foreground">IITM Percentage</span>
                            <span className="text-sm font-semibold text-primary">{data.iitmPercentage}%</span>
                        </div>
                        {/* Progress bar */}
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-700"
                                style={{ width: `${data.iitmPercentage}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Platform Activity */}
                <div
                    className="bg-card rounded-2xl border border-border p-5 sm:p-6 animate-fade-in-up"
                    style={{ animationDelay: "480ms", animationFillMode: "both" }}
                >
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        Platform Activity
                    </h3>
                    <div className="space-y-3">
                        {[
                            { label: "Avg videos per user", value: data.avgVideosPerUser.toString(), dot: "bg-emerald-500" },
                            { label: "Videos completed", value: data.videosCompleted.toString(), dot: "bg-primary" },
                            { label: "Total playlists", value: data.totalPlaylists.toString(), dot: "bg-orange-500" },
                            { label: "Total notes", value: data.totalNotes.toString(), dot: "bg-purple-500" },
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

                {/* Quick Actions */}
                <div
                    className="bg-card rounded-2xl border border-border p-5 sm:p-6 animate-fade-in-up"
                    style={{ animationDelay: "560ms", animationFillMode: "both" }}
                >
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-primary" />
                        Quick Actions
                    </h3>
                    <div className="space-y-3">
                        <Link
                            href="/app/admin/users"
                            className="flex items-center gap-3 p-3 rounded-xl bg-primary/8 border border-primary/20 hover:bg-primary/15 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                                <Users className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">Manage Users</p>
                                <p className="text-xs text-muted-foreground">View and search all users</p>
                            </div>
                        </Link>
                        <Link
                            href="/app/analytics"
                            className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                                <BarChart2 className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">Your Analytics</p>
                                <p className="text-xs text-muted-foreground">View personal learning stats</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
