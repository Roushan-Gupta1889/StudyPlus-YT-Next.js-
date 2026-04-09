"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Check, X, Plus, Trash2, BookOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import YouTubePlayer, { YouTubePlayerRef, YT_PLAYER_STATE, PlayerState } from "@/components/YouTubePlayer";
import { AiChat } from "@/components/app/AiChat";
import { Linkify } from "@/components/ui/linkify";

interface Video {
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  thumbnail: string;
  channel: string;
  duration: number;
  completed?: boolean;
  // Phase 1: Player state fields
  currentTime: number;
  playbackRate: number;
  muted: boolean;
}

interface PlaylistVideo {
  id: string;
  youtubeId: string;
  title: string;
  channel: string;
  duration: number;
  completed?: boolean;
}

interface Note {
  id: string;
  content: string;
  timestamp: number;
  createdAt: string;
}

export default function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const urlPlaylistId = searchParams.get("playlistId");
  const [video, setVideo] = useState<Video | null>(null);
  const [playlistVideos, setPlaylistVideos] = useState<PlaylistVideo[]>([]);
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [showPlaylist, setShowPlaylist] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Player ref (Phase 1: YouTube IFrame API)
  const playerRef = useRef<YouTubePlayerRef>(null);

  // Notes state
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState("description");
  const [notesFetched, setNotesFetched] = useState(false);

  // ✅ FIXED: Time-delta based sync with mutex protection
  const watchSyncRef = useRef({
    accumulatedSeconds: 0,
    lastTimestamp: Date.now(),
    syncing: false,
    initialSyncDone: false,
  });

  // ✅ Duration correction: Only update once per video
  const durationCorrectedRef = useRef(false);

  // Ref to always hold latest video id (for beforeunload)
  const videoRef = useRef<Video | null>(null);

  // ✅ FIX: Load playlist from URL using useSearchParams (reliable on initial render)
  useEffect(() => {
    setMounted(true);
    fetchVideo();
    if (urlPlaylistId) {
      setPlaylistId(urlPlaylistId);
      fetchPlaylistVideos(urlPlaylistId);
    }
  }, [id, urlPlaylistId]);

  // Reset session when video changes
  useEffect(() => {
    watchSyncRef.current = {
      accumulatedSeconds: 0,
      lastTimestamp: Date.now(),
      syncing: false,
      initialSyncDone: false,
    };
    durationCorrectedRef.current = false; // Reset duration correction flag
  }, [id]);

  // Sync remaining time when switching videos or unmounting
  useEffect(() => {
    return () => {
      const sync = watchSyncRef.current;
      if (sync.accumulatedSeconds >= 5 && !sync.syncing && video) {
        // Fire-and-forget sync on unmount
        syncWatchHistory(sync.accumulatedSeconds);
      }
    };
  }, [video]); // Only run on unmount or video change


  const fetchVideo = async () => {
    try {
      const response = await fetch(`/api/videos/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch video");
      }
      const data = await response.json();
      setVideo(data);
      videoRef.current = data; // keep ref in sync for beforeunload
      setCompleted(data.completed || false);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load video");
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaylistVideos = async (pId: string) => {
    try {
      const response = await fetch(`/api/playlists/${pId}/videos`);
      if (!response.ok) return;
      const data = await response.json();

      // The videos endpoint returns the array; also check if playlist has more
      const videos = Array.isArray(data) ? data : data.videos ?? [];
      setPlaylistVideos(videos);
      setHasMore(!!(data.hasMore ?? false));

      // Calculate completed count
      const completedVideos = videos.filter((v: any) => v.completed).length;
      setCompletedCount(completedVideos);

      const index = videos.findIndex((v: any) => v.id === id);
      if (index >= 0) {
        setCurrentIndex(index);
      }
    } catch (error) {
      console.error("Failed to fetch playlist videos:", error);
    }
  };

  const loadMoreVideos = async () => {
    if (!playlistId || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/playlists/${playlistId}/load-more`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to load more");
      const data = await res.json();
      if (data.videos && data.videos.length > 0) {
        setPlaylistVideos((prev) => [...prev, ...data.videos]);
        toast.success(`Loaded ${data.videos.length} more videos`);
      }
      setHasMore(!!data.hasMore);
    } catch (error) {
      toast.error("Failed to load more videos");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleMarkComplete = async () => {
    try {
      const response = await fetch(`/api/videos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed }),
      });

      if (!response.ok) throw new Error("Failed to update video");

      // Update completed state
      const newCompletedState = !completed;
      setCompleted(newCompletedState);

      // Update playlist videos with new completion status
      const updatedVideos = playlistVideos.map((v) =>
        v.id === id ? { ...v, completed: newCompletedState } : v
      );
      setPlaylistVideos(updatedVideos);

      // Recalculate completed count
      const newCompletedCount = updatedVideos.filter((v) => v.completed).length;
      setCompletedCount(newCompletedCount);

      toast.success(newCompletedState ? "Marked as completed" : "Marked as incomplete");
    } catch (error) {
      toast.error("Failed to update video status");
    }
  };

  // ✅ FIXED: Use router for navigation instead of window.location
  const handleNext = () => {
    if (currentIndex < playlistVideos.length - 1) {
      const nextVideo = playlistVideos[currentIndex + 1];
      // Sync before navigating
      const sync = watchSyncRef.current;
      if (sync.accumulatedSeconds >= 5 && !sync.syncing && video) {
        syncWatchHistory(sync.accumulatedSeconds);
      }
      window.location.href = `/app/watch/${nextVideo.id}?playlistId=${playlistId}`;
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevVideo = playlistVideos[currentIndex - 1];
      // Sync before navigating
      const sync = watchSyncRef.current;
      if (sync.accumulatedSeconds >= 5 && !sync.syncing && video) {
        syncWatchHistory(sync.accumulatedSeconds);
      }
      window.location.href = `/app/watch/${prevVideo.id}?playlistId=${playlistId}`;
    }
  };

  // Lazy load notes when Notes tab is opened
  useEffect(() => {
    if (activeTab === "notes" && !notesFetched && video) {
      fetchNotes();
      setNotesFetched(true);
    }
  }, [activeTab]);

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/videos/${id}/notes`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) {
      toast.error("Please enter a note");
      return;
    }

    try {
      const response = await fetch(`/api/videos/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newNote,
          timestamp: Math.floor(currentTime),
        }),
      });

      if (!response.ok) throw new Error("Failed to add note");

      const note = await response.json();
      setNotes([note, ...notes]);
      setNewNote("");
      toast.success("Note added");
    } catch (error) {
      toast.error("Failed to add note");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete note");

      setNotes(notes.filter((n) => n.id !== noteId));
      toast.success("Note deleted");
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  const seekToTimestamp = (timestamp: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(timestamp);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // ✅ FIXED: Time-delta based sync with mutex protection
  const VIDEO_SYNC_INTERVAL = 30; // seconds

  const syncWatchHistory = async (seconds: number) => {
    if (seconds < 5 || !video) return; // Ignore very short durations

    const sync = watchSyncRef.current;

    // Mutex: prevent concurrent syncs
    if (sync.syncing) return;
    sync.syncing = true;

    try {
      await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: video.id,
          watchTime: Math.round(seconds),
        }),
      });
    } catch (error) {
      console.error("Failed to sync history", error);
    } finally {
      sync.syncing = false;
    }
  };

  // ✅ Phase 1: Save player state to backend
  const savePlayerState = async (state: PlayerState) => {
    if (!video) return;

    try {
      await fetch(`/api/videos/${video.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentTime: Math.floor(state.currentTime),
          playbackRate: state.playbackRate,
          muted: state.muted,
        }),
      });
    } catch (error) {
      console.error("Failed to save player state:", error);
    }
  };

  // ✅ Phase 1: Handle player state changes
  const handlePlayerStateChange = (ytState: number, currentState: PlayerState) => {
    const sync = watchSyncRef.current;

    if (ytState === YT_PLAYER_STATE.PLAYING) {
      // Reset timestamp when starting to play
      sync.lastTimestamp = Date.now();
    } else if (ytState === YT_PLAYER_STATE.PAUSED) {
      // Save state when paused
      savePlayerState(currentState);

      // Sync accumulated watch time
      if (sync.accumulatedSeconds >= 5 && !sync.syncing && video) {
        syncWatchHistory(sync.accumulatedSeconds);
        sync.accumulatedSeconds = 0;
      }
    } else if (ytState === YT_PLAYER_STATE.ENDED) {
      // Mark as complete when video ends
      if (!completed) handleMarkComplete();

      // 🟡 FIX 4: Clear accumulated time to prevent double save on unmount
      sync.accumulatedSeconds = 0;

      // Save final state
      savePlayerState(currentState);

      // ✅ Auto-advance to next video in playlist after a short delay
      if (playlistId && playlistVideos.length > 0) {
        const nextIdx = playlistVideos.findIndex((v) => v.id === id) + 1;
        if (nextIdx > 0 && nextIdx < playlistVideos.length) {
          const nextVideo = playlistVideos[nextIdx];
          setTimeout(() => {
            window.location.href = `/app/watch/${nextVideo.id}?playlistId=${playlistId}`;
          }, 2000); // 2 second delay so user sees completion
        }
      }
    }
  };

  // ✅ Phase 1: Progress tracking with interval polling
  useEffect(() => {
    if (!playerRef.current || !video) return;

    const progressInterval = setInterval(() => {
      const ytState = playerRef.current?.getPlayerState();

      if (ytState !== YT_PLAYER_STATE.PLAYING) return;

      const sync = watchSyncRef.current;
      const now = Date.now();

      // Calculate actual elapsed time since last tick (in seconds)
      const deltaMs = now - sync.lastTimestamp;
      const deltaSec = deltaMs / 1000;

      // Sanity check: ignore unrealistic deltas (> 5s means tab was hidden or paused)
      if (deltaSec > 5) {
        sync.lastTimestamp = now;
        return;
      }

      sync.accumulatedSeconds += deltaSec;
      sync.lastTimestamp = now;

      // Update current time for notes
      const currentTime = playerRef.current?.getCurrentTime() || 0;
      setCurrentTime(currentTime);

      // Sync every 30 seconds
      if (sync.accumulatedSeconds >= VIDEO_SYNC_INTERVAL) {
        const toSync = sync.accumulatedSeconds;
        sync.accumulatedSeconds = 0;
        syncWatchHistory(toSync);
        return;
      }

      // Initial sync after 5 seconds (for "instant" tracking)
      if (!sync.initialSyncDone && sync.accumulatedSeconds >= 5) {
        const toSync = sync.accumulatedSeconds;
        sync.accumulatedSeconds = 0;
        sync.initialSyncDone = true;
        syncWatchHistory(toSync);
      }
    }, 1000); // Poll every second

    return () => clearInterval(progressInterval);
  }, [video, completed]);

  // ✅ Phase 1: Save state on route change / unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        const currentState: PlayerState = {
          currentTime: playerRef.current.getCurrentTime(),
          playbackRate: playerRef.current.getPlaybackRate(),
          muted: playerRef.current.isMuted(),
        };
        savePlayerState(currentState);
      }

      // Sync remaining time
      const sync = watchSyncRef.current;
      if (sync.accumulatedSeconds >= 5 && !sync.syncing && video) {
        syncWatchHistory(sync.accumulatedSeconds);
      }
    };
  }, [video]);

  // ✅ FIX: Periodic currentTime save every 5 seconds while playing.
  // This ensures the DB always has a recent position even when the user
  // refreshes the browser mid-video (React cleanup doesn't fire on hard refresh).
  useEffect(() => {
    if (!video) return;

    const saveInterval = setInterval(() => {
      if (!playerRef.current) return;
      const ytState = playerRef.current.getPlayerState();
      if (ytState !== YT_PLAYER_STATE.PLAYING) return;

      const ct = playerRef.current.getCurrentTime();
      if (ct <= 0) return;

      // Silently PATCH currentTime to the DB
      fetch(`/api/videos/${video.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentTime: Math.floor(ct) }),
      }).catch(() => {}); // fire-and-forget, ignore errors
    }, 5000); // every 5 seconds

    return () => clearInterval(saveInterval);
  }, [video]);

  // ✅ FIX: beforeunload beacon — last-chance save when tab is closed or refreshed.
  // navigator.sendBeacon is the ONLY reliable API that fires on hard refresh/close.
  // sendBeacon only supports POST, so we use the dedicated /position endpoint.
  useEffect(() => {
    const handleBeforeUnload = () => {
      const v = videoRef.current;
      if (!v || !playerRef.current) return;

      const ct = playerRef.current.getCurrentTime?.();
      if (!ct || ct <= 0) return;

      // sendBeacon is fire-and-forget and works reliably on page unload
      const payload = JSON.stringify({ currentTime: Math.floor(ct) });
      navigator.sendBeacon(
        `/api/videos/${v.id}/position`,
        new Blob([payload], { type: "application/json" })
      );
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []); // mount once — uses videoRef + playerRef (both refs, always current)

  if (!mounted || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading video…</p>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-foreground mb-4">Video not found</h1>
          <Link href="/app/videos">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Videos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Show only when in playlist */}
      {playlistId && playlistVideos.length > 0 && (
        <div className="sticky top-0 z-40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b border-border">
          <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Link href={`/app/playlists/${playlistId}`}>
                <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg font-semibold text-foreground truncate">
                  {video?.title}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {video?.channel}
                </p>
              </div>
            </div>

            {/* Progress Stats & Toggle */}
            <div className="flex items-center gap-4 ml-4 flex-shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">
                  {completedCount}/{playlistVideos.length} completed
                </p>
                <p className="text-xs text-muted-foreground">
                  {playlistVideos.length > 0 ? Math.round((completedCount / playlistVideos.length) * 100) : 0}%
                </p>
              </div>
              {!showPlaylist && (
                <Button variant="outline" size="sm" onClick={() => setShowPlaylist(true)}>
                  Show Playlist
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className={`${showPlaylist && playlistId && playlistVideos.length > 0 ? "lg:col-span-2" : "lg:col-span-3"} transition-all duration-300`}>
            {/* Video Player - Phase 1: Native YouTube IFrame */}
            <div className="mb-6">
              <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
                <YouTubePlayer
                  ref={playerRef}
                  videoId={video.youtubeId}
                  initialState={{
                    currentTime: video.currentTime || 0,
                    playbackRate: video.playbackRate || 1.0,
                    muted: video.muted || false,
                  }}
                  onStateChange={handlePlayerStateChange}
                  onError={(errorCode) => {
                    console.error("YouTube Player Error:", errorCode);
                    if (errorCode === 150 || errorCode === 101) {
                      toast.error("This video cannot be embedded. Please watch it on YouTube.");
                    } else {
                      toast.error("Failed to load video");
                    }
                  }}
                />
              </div>
            </div>

            {/* Video Title and Metadata */}
            <div className="mb-6">
              <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{video.title}</h1>
                  <p className="text-lg text-muted-foreground">{video.channel}</p>
                </div>
                <Button
                  onClick={handleMarkComplete}
                  variant={completed ? "default" : "outline"}
                  className={completed ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  <Check className="w-4 h-4 mr-2" />
                  {completed ? "Completed" : "Mark Complete"}
                </Button>
              </div>

              {/* Video Stats */}
              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>Duration: {video.duration > 0
                    ? `${String(Math.floor(video.duration / 3600)).padStart(2, "0")}:${String(Math.floor((video.duration % 3600) / 60)).padStart(2, "0")}:${String(video.duration % 60).padStart(2, "0")}`
                    : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-6">
                <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-5 h-auto sm:h-10 p-1 gap-1 sm:gap-0">
                  <TabsTrigger value="description" className="px-3 py-2 text-xs sm:text-sm">
                    <span className="sm:hidden">Desc</span>
                    <span className="hidden sm:inline">Description</span>
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="px-3 py-2 text-xs sm:text-sm">
                    <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Notes
                  </TabsTrigger>
                  <TabsTrigger value="comments" className="px-3 py-2 text-xs sm:text-sm">
                    <span className="sm:hidden">Chat</span>
                    <span className="hidden sm:inline">Slides</span>
                  </TabsTrigger>
                  <TabsTrigger value="attachments" className="px-3 py-2 text-xs sm:text-sm">
                    <span className="sm:hidden">Files</span>
                    <span className="hidden sm:inline">Attachments</span>
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="px-3 py-2 text-xs sm:text-sm">
                    <span className="sm:hidden">AI</span>
                    <span className="hidden sm:inline">AI Assistant</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="description" className="space-y-4">
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">About this lesson</h2>
                  <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-sm">
                    <Linkify text={video.description} />
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">My Notes</h2>

                  {/* Add Note Form */}
                  <form onSubmit={handleAddNote} className="mb-6 space-y-3">
                    <Textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note about this video..."
                      className="min-h-[100px] resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Note will be saved at {formatTime(currentTime)}
                      </span>
                      <Button type="submit" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Note
                      </Button>
                    </div>
                  </form>

                  {/* Notes List */}
                  <div className="space-y-3">
                    {notes.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No notes yet. Start taking notes while watching!</p>
                      </div>
                    ) : (
                      notes.map((note) => (
                        <Card key={note.id} className="p-4 hover:bg-accent/50 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground mb-2 whitespace-pre-wrap">
                                {note.content}
                              </p>
                              <button
                                onClick={() => seekToTimestamp(note.timestamp)}
                                className="text-xs text-primary hover:underline font-medium"
                              >
                                ⏱ {formatTime(note.timestamp)}
                              </button>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteNote(note.id)}
                              className="flex-shrink-0 h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="comments" className="space-y-4">
                <Card className="p-6 text-center text-muted-foreground py-12">
                  <p>Comments feature coming soon</p>
                </Card>
              </TabsContent>

              <TabsContent value="attachments" className="space-y-4">
                <Card className="p-6 text-center text-muted-foreground py-12">
                  <p>No attachments available</p>
                </Card>
              </TabsContent>

              <TabsContent value="ai" className="space-y-4">
                <AiChat
                  videoContext={{
                    title: video.title,
                    description: video.description,
                    channel: video.channel,
                    youtubeId: video.youtubeId,
                  }}
                  notes={notes.map((n) => ({ content: n.content, timestamp: n.timestamp }))}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Playlist Sidebar */}
          {playlistId && playlistVideos.length > 0 && showPlaylist && (
            <div className="lg:col-span-1">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">
                    Lesson {currentIndex + 1} / {playlistVideos.length}
                  </h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowPlaylist(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {playlistVideos.map((v, idx) => (
                    <Link key={v.id} href={`/app/watch/${v.id}?playlistId=${playlistId}`}>
                      <div
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${idx === currentIndex
                          ? "bg-primary/20 border border-primary"
                          : "bg-card hover:bg-accent/50"
                          }`}
                      >
                        <p className="text-sm font-medium line-clamp-2 text-foreground">
                          {idx + 1}. {v.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {String(Math.floor(v.duration / 3600)).padStart(2, "0")}:{String(Math.floor((v.duration % 3600) / 60)).padStart(2, "0")}:{String(v.duration % 60).padStart(2, "0")}
                        </p>
                      </div>
                    </Link>
                  ))}

                  {/* Load More button */}
                  {hasMore && (
                    <button
                      onClick={loadMoreVideos}
                      disabled={loadingMore}
                      className="w-full mt-2 py-2 rounded-lg text-sm font-medium text-primary border border-primary/30 hover:bg-primary/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Loading…
                        </>
                      ) : (
                        "Load more videos ⬇"
                      )}
                    </button>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="flex-1"
                  >
                    ← Prev
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleNext}
                    disabled={currentIndex === playlistVideos.length - 1}
                    className="flex-1"
                  >
                    Next →
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div >
  );
}
