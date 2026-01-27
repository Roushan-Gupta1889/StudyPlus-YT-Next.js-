"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Play, Plus, Loader2, BookOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

// Dynamic import to avoid SSR issues with ReactPlayer
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

interface Video {
    id: string;
    youtubeId: string;
    title: string;
    channel: string | null;
    thumbnail: string | null;
    duration: number | null;
    progress: number;
}

interface Note {
    id: string;
    content: string;
    timestamp: number;
    createdAt: string;
}

export default function WatchPage() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const videoIdFromUrl = searchParams.get("v");

    const [videos, setVideos] = useState<Video[]>([]);
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [notes, setNotes] = useState<Note[]>([]);
    const [newNote, setNewNote] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [playerRef, setPlayerRef] = useState<any>(null);
    const [watchSession, setWatchSession] = useState({ accumulatedTime: 0, lastSync: Date.now(), initialSyncDone: false });

    // Sync watch history every 30 seconds
    const VIDEO_SYNC_INTERVAL = 30; // seconds

    const syncWatchHistory = async (seconds: number) => {
        if (seconds < 5 || !selectedVideo) return; // Ignore very short durations

        try {
            await fetch("/api/history", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    videoId: selectedVideo.id,
                    watchTime: Math.round(seconds),
                }),
            });
        } catch (error) {
            console.error("Failed to sync history", error);
        }
    };

    // Handle progress updates
    const handleProgress = () => {
        if (!isPlaying) return;

        setWatchSession(prev => {
            const now = Date.now();
            // Assuming this is called roughly once per second
            const newAccumulated = prev.accumulatedTime + 1;

            // If accumulated > interval, sync and reset
            if (newAccumulated >= VIDEO_SYNC_INTERVAL) {
                syncWatchHistory(newAccumulated);
                return { accumulatedTime: 0, lastSync: now, initialSyncDone: prev.initialSyncDone };
            }

            // Initial sync for "instant" tracking (e.g. after 5 seconds)
            if (!prev.initialSyncDone && newAccumulated >= 5) {
                syncWatchHistory(newAccumulated);
                return { accumulatedTime: 0, lastSync: now, initialSyncDone: true };
            }

            return { ...prev, accumulatedTime: newAccumulated };
        });
    };

    // Sync remaining time when switching videos or unmounting
    useEffect(() => {
        return () => {
            if (watchSession.accumulatedTime > 0) {
                syncWatchHistory(watchSession.accumulatedTime);
            }
        };
    }, [watchSession.accumulatedTime, selectedVideo]);

    useEffect(() => {
        // Reset session when video changes
        setWatchSession({ accumulatedTime: 0, lastSync: Date.now(), initialSyncDone: false });
    }, [selectedVideo]);

    // Fetch user's videos
    useEffect(() => {
        const fetchVideos = async () => {
            try {
                setIsLoading(true);
                const res = await fetch("/api/videos");
                if (res.ok) {
                    const data = await res.json();
                    setVideos(data);

                    // Handle video selection from URL
                    if (videoIdFromUrl) {
                        const videoInLibrary = data.find((v: Video) => v.id === videoIdFromUrl);

                        if (videoInLibrary) {
                            setSelectedVideo(videoInLibrary);
                        } else {
                            // Video ID in URL but not in library (maybe soft-deleted or from playlist)
                            // Try to fetch it directly
                            try {
                                const singleRes = await fetch(`/api/videos/${videoIdFromUrl}`);
                                if (singleRes.ok) {
                                    const explicitVideo = await singleRes.json();
                                    setSelectedVideo(explicitVideo);

                                    // Auto-restore to library if it exists but was hidden
                                    await fetch("/api/videos", {
                                        method: "POST", // POST logic handles restoration
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                            youtubeId: explicitVideo.youtubeId,
                                            title: explicitVideo.title, // These fields are ignored if exists
                                        })
                                    });

                                    // Refresh library list to include it
                                    const refreshedRes = await fetch("/api/videos");
                                    if (refreshedRes.ok) {
                                        setVideos(await refreshedRes.json());
                                    }
                                }
                            } catch (e) {
                                console.error("Error fetching single video", e);
                            }
                        }
                    } else if (data.length > 0) {
                        setSelectedVideo(data[0]);
                    }
                }
            } catch (error) {
                console.error("Error fetching videos:", error);
                toast.error("Failed to load video library");
            } finally {
                setIsLoading(false);
            }
        };

        if (session) {
            fetchVideos();
        }
    }, [session, videoIdFromUrl]);

    // Fetch notes for selected video
    useEffect(() => {
        const fetchNotes = async () => {
            if (!selectedVideo) return;

            try {
                const res = await fetch(`/api/notes?videoId=${selectedVideo.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setNotes(data);
                }
            } catch (error) {
                console.error("Error fetching notes:", error);
            }
        };

        fetchNotes();
    }, [selectedVideo]);

    const handleAddNote = async () => {
        if (!newNote.trim() || !selectedVideo) return;

        try {
            const res = await fetch("/api/notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    videoId: selectedVideo.id,
                    content: newNote,
                    timestamp: Math.floor(currentTime),
                }),
            });

            if (res.ok) {
                const note = await res.json();
                setNotes([...notes, note]);
                setNewNote("");
                toast.success("Note saved!");
            }
        } catch (error) {
            console.error("Error saving note:", error);
            toast.error("Failed to save note");
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        try {
            const res = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
            if (res.ok) {
                setNotes(notes.filter((n) => n.id !== noteId));
                toast.success("Note deleted");
            }
        } catch (error) {
            console.error("Error deleting note:", error);
            toast.error("Failed to delete note");
        }
    };

    const seekToTimestamp = (timestamp: number) => {
        if (playerRef) {
            playerRef.currentTime = timestamp;
            setIsPlaying(true);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (videos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-8">
                <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">No Videos Yet</h2>
                <p className="text-muted-foreground text-center mb-6">
                    Search for YouTube videos from the dashboard and save them to your library!
                </p>
                <Button asChild>
                    <a href="/app/dashboard">Go to Dashboard</a>
                </Button>
            </div>
        );
    }

    const handleDeleteVideo = async (e: React.MouseEvent, videoId: string) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this video?")) return;

        try {
            const res = await fetch(`/api/videos/${videoId}`, { method: "DELETE" });
            if (res.ok) {
                const newVideos = videos.filter((v) => v.id !== videoId);
                setVideos(newVideos);

                // If deleted video was selected, select the first available video
                if (selectedVideo?.id === videoId) {
                    setSelectedVideo(newVideos.length > 0 ? newVideos[0] : null);
                }
                toast.success("Video deleted");
            } else {
                toast.error("Failed to delete video");
            }
        } catch (error) {
            console.error("Error deleting video:", error);
            toast.error("Failed to delete video");
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="grid lg:grid-cols-[1fr,400px] h-screen">
                {/* Video Player Side */}
                <div className="flex flex-col">
                    {/* Video Player */}
                    <div className="relative bg-black aspect-video lg:h-[60vh]">
                        {selectedVideo ? (
                            <ReactPlayer
                                ref={setPlayerRef}
                                src={`https://www.youtube.com/watch?v=${selectedVideo.youtubeId}`}
                                playing={isPlaying}
                                controls
                                width="100%"
                                height="100%"
                                onTimeUpdate={(e: any) => setCurrentTime(e.currentTarget.currentTime)}
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                onProgress={(state) => {
                                    // Track watch time (approximated by progress interval)
                                    // ReactPlayer fires onProgress roughly every second
                                    // We'll trust the internal timer implicitly for simplicity, 
                                    // or better, just accumulate 1s on every tick if playing?
                                    // Actually, let's use a simpler approach: 
                                    // Just sync valid watch time.
                                    handleProgress();
                                }}
                                config={{
                                    youtube: {
                                        rel: 0
                                    }
                                }}
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-white">
                                <Play className="w-20 h-20 opacity-50" />
                            </div>
                        )}
                    </div>

                    {/* Video Info */}
                    {selectedVideo && (
                        <div className="p-6 border-b border-border">
                            <h1 className="text-2xl font-bold text-foreground mb-2">{selectedVideo.title}</h1>
                            <p className="text-muted-foreground">{selectedVideo.channel}</p>
                        </div>
                    )}

                    {/* Video Library List */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-foreground">Your Video Library</h2>
                            {videos.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-destructive text-xs h-7 px-2"
                                    onClick={async (e) => {
                                        if (!confirm("Remove all videos from your library?")) return;
                                        try {
                                            const res = await fetch("/api/videos?clearAll=true", { method: "DELETE" });
                                            if (res.ok) {
                                                setVideos([]);
                                                setSelectedVideo(null);
                                                toast.success("Library cleared");
                                            }
                                        } catch (e) {
                                            toast.error("Failed to clear library");
                                        }
                                    }}
                                >
                                    Clear All
                                </Button>
                            )}
                        </div>
                        <div className="space-y-3">
                            {videos.map((video) => (
                                <div
                                    key={video.id}
                                    onClick={() => setSelectedVideo(video)}
                                    className={`w-full flex gap-3 p-3 rounded-lg border transition-all cursor-pointer group relative ${selectedVideo?.id === video.id
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                        }`}
                                >
                                    <div className="w-32 h-20 bg-muted rounded flex-shrink-0 overflow-hidden">
                                        {video.thumbnail ? (
                                            <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Play className="w-6 h-6 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-foreground text-sm line-clamp-2 mb-1 pr-6">{video.title}</h3>
                                        <p className="text-xs text-muted-foreground">{video.channel}</p>
                                        {video.progress > 0 && (
                                            <div className="mt-2">
                                                <div className="h-1 bg-muted rounded-full">
                                                    <div className="h-full bg-primary rounded-full" style={{ width: `${video.progress}%` }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-6 w-6 text-muted-foreground hover:text-destructive"
                                        onClick={(e) => handleDeleteVideo(e, video.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Notes Panel */}
                <div className="border-l border-border bg-card flex flex-col max-h-screen">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                        <h2 className="font-semibold text-foreground">Notes</h2>
                        <span className="text-xs text-muted-foreground">{notes.length} notes</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {notes.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-sm text-muted-foreground">No notes yet. Add your first note below!</p>
                            </div>
                        ) : (
                            notes.map((note) => (
                                <Card key={note.id} className="p-4 group relative">
                                    <button
                                        onClick={() => seekToTimestamp(note.timestamp)}
                                        className="flex items-start gap-3 w-full text-left"
                                    >
                                        <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded cursor-pointer hover:bg-primary/20">
                                            {formatTime(note.timestamp)}
                                        </span>
                                        <p className="text-sm text-foreground flex-1">{note.content}</p>
                                    </button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteNote(note.id)}
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-6 w-6"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Add Note Input */}
                    <div className="p-4 border-t border-border">
                        <div className="mb-2 text-xs text-muted-foreground">
                            Current time: {formatTime(currentTime)}
                        </div>
                        <Textarea
                            placeholder="Type your note here..."
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            className="mb-2"
                            rows={3}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && e.ctrlKey) {
                                    handleAddNote();
                                }
                            }}
                        />
                        <Button onClick={handleAddNote} className="w-full gap-2" disabled={!newNote.trim()}>
                            <Plus className="w-4 h-4" />
                            Save Note (Ctrl+Enter)
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
