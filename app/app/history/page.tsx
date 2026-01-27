"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Calendar, Clock, Play, Loader2, History } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

interface WatchHistoryItem {
    id: string;
    watchedAt: string;
    watchTime: number;
    video: {
        id: string;
        title: string;
        channel: string | null;
        thumbnail: string | null;
        duration: number | null;
        progress: number;
    };
}

export default function HistoryPage() {
    const { data: session } = useSession();
    const [history, setHistory] = useState<WatchHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const formatRelativeTime = (date: string) => {
        const now = new Date();
        const watchedDate = new Date(date);
        const diffMs = now.getTime() - watchedDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays} days ago`;
        return watchedDate.toLocaleDateString();
    };

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setIsLoading(true);
                const res = await fetch("/api/history");
                if (res.ok) {
                    const data = await res.json();
                    setHistory(data);
                }
            } catch (error) {
                console.error("Error fetching history:", error);
                toast.error("Failed to load watch history");
            } finally {
                setIsLoading(false);
            }
        };

        if (session) {
            fetchHistory();
        }
    }, [session]);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const res = await fetch(`/api/history?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                setHistory(history.filter(item => item.id !== id));
                toast.success("Item deleted from history");
            } else {
                toast.error("Failed to delete item");
            }
        } catch (error) {
            console.error("Error deleting history item:", error);
            toast.error("Failed to delete item");
        }
    };

    const handleClearAll = async () => {
        if (!confirm("Are you sure you want to clear your entire watch history?")) return;

        try {
            const res = await fetch("/api/history?clearAll=true", { method: "DELETE" });
            if (res.ok) {
                setHistory([]);
                toast.success("Watch history cleared");
            } else {
                toast.error("Failed to clear history");
            }
        } catch (error) {
            console.error("Error clearing history:", error);
            toast.error("Failed to clear history");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-foreground mb-1">Watch History</h1>
                    <p className="text-muted-foreground">Track all the videos you've watched</p>
                </div>
                {history.length > 0 && (
                    <Button variant="destructive" onClick={handleClearAll}>
                        Clear All History
                    </Button>
                )}
            </div>

            {/* Empty State */}
            {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <History className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">No Watch History</h2>
                    <p className="text-muted-foreground text-center mb-6 max-w-md">
                        Start watching videos and they'll appear here
                    </p>
                    <Button asChild>
                        <Link href="/app/watch">Browse Videos</Link>
                    </Button>
                </div>
            ) : (
                /* History List */
                <div className="space-y-3">
                    {history.map((item) => (
                        <Card key={item.id} className="overflow-hidden hover:shadow-card transition-all group relative">
                            <Link href={`/app/watch?v=${item.video.id}`} className="flex flex-col sm:flex-row gap-4 p-4">
                                {/* Thumbnail */}
                                <div className="w-full sm:w-48 aspect-video bg-muted rounded-lg relative flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    {item.video.thumbnail ? (
                                        <img
                                            src={item.video.thumbnail}
                                            alt={item.video.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Play className="w-10 h-10 text-muted-foreground/30" />
                                    )}
                                    {item.video.progress < 100 && item.video.progress > 0 && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                                            <div className="h-full bg-primary" style={{ width: `${item.video.progress}%` }} />
                                        </div>
                                    )}
                                    {item.video.duration && (
                                        <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-0.5 rounded text-xs">
                                            {formatTime(item.video.duration)}
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-foreground mb-1 line-clamp-2">{item.video.title}</h3>
                                    <p className="text-sm text-muted-foreground mb-3">{item.video.channel}</p>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {formatRelativeTime(item.watchedAt)}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {item.video.progress === 100
                                                ? "Completed"
                                                : item.video.progress > 0
                                                    ? `${item.video.progress}% watched`
                                                    : "Started"}
                                        </div>
                                        {item.watchTime > 0 && (
                                            <div className="flex items-center gap-1.5">
                                                <Play className="w-3.5 h-3.5" />
                                                Watched {formatTime(item.watchTime)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>

                            {/* Delete Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => handleDelete(e, item.id)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                            </Button>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
