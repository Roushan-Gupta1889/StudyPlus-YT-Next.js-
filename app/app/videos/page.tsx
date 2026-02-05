"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, Trash2, Play, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import Image from "next/image";
import { useDebounce } from "@/hooks/useDebounce";

interface Video {
  id: string;
  youtubeId: string;
  title: string;
  thumbnail: string;
  channel: string;
  duration: number;
  createdAt: string;
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [open, setOpen] = useState(false);
  const [addMode, setAddMode] = useState<"url" | "search">("url");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Fetch videos
  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch("/api/videos/list");
      if (!response.ok) throw new Error("Failed to fetch videos");
      const data = await response.json();
      setVideos(data);
    } catch (error) {
      toast.error("Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  // Search YouTube
  useEffect(() => {
    const searchYouTube = async () => {
      if (!debouncedSearchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        setIsSearching(true);
        const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(debouncedSearchQuery)}&type=video`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    };

    searchYouTube();
  }, [debouncedSearchQuery]);

  const handleSaveFromSearch = async (video: any) => {
    try {
      setSubmitting(true);
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtubeId: video.id,
          title: video.title,
          description: video.description,
          thumbnail: video.thumbnail,
          duration: video.duration,
          channel: video.channel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add video");
      }

      setVideos([data, ...videos]);
      setOpen(false);
      toast.success("Video added successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add video");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) {
      toast.error("Please enter a video URL");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/videos/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add video");
      }

      setVideos([data, ...videos]);
      setVideoUrl("");
      setOpen(false);
      toast.success("Video added successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add video");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return;

    try {
      const response = await fetch(`/api/videos/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: videoId }),
      });

      if (!response.ok) throw new Error("Failed to delete video");

      setVideos(videos.filter((v) => v.id !== videoId));
      toast.success("Video deleted");
    } catch (error) {
      toast.error("Failed to delete video");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Videos</h1>
          <p className="text-muted-foreground">
            {videos.length} video{videos.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {videos.length > 0 && (
            <Button
              variant="destructive"
              onClick={async () => {
                if (!confirm("Remove all videos from your library?")) return;
                try {
                  console.log("[CLEAR_ALL] Attempting to clear all videos...");
                  const res = await fetch("/api/videos?clearAll=true", { method: "DELETE" });
                  const data = await res.json();

                  console.log("[CLEAR_ALL] API Response:", data);

                  if (res.ok) {
                    setVideos([]);
                    toast.success(`Library cleared! Deleted ${data.deletedCount || 0} videos.`);
                  } else {
                    console.error("[CLEAR_ALL] API Error:", data);
                    toast.error(data.details || "Failed to clear library");
                  }
                } catch (e) {
                  console.error("[CLEAR_ALL] Exception:", e);
                  toast.error("Failed to clear library");
                }
              }}
            >
              Clear All
            </Button>
          )}

          <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) { setAddMode("url"); setSearchQuery(""); setSearchResults([]); } }}>
            <DialogTrigger asChild suppressHydrationWarning>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Video
              </Button>
            </DialogTrigger>
            <DialogContent suppressHydrationWarning className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Add YouTube Video</DialogTitle>
              </DialogHeader>

              {/* Tabs */}
              <div className="flex bg-muted rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setAddMode("url")}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${addMode === "url" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Paste URL
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode("search")}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${addMode === "search" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Search YouTube
                </button>
              </div>

              {/* URL Input Mode */}
              {addMode === "url" && (
                <form onSubmit={handleAddVideo} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">
                      YouTube URL or Video ID
                    </label>
                    <Input
                      placeholder="https://youtube.com/watch?v=... or paste video ID"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      disabled={submitting}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Paste the full YouTube URL or just the video ID
                    </p>
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {submitting ? "Adding..." : "Add Video"}
                  </Button>
                </form>
              )}

              {/* Search Mode */}
              {addMode === "search" && (
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search YouTube videos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="flex-1 overflow-auto min-h-0">
                    {!searchQuery ? (
                      <div className="p-8 text-center">
                        <Search className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Start typing to search YouTube</p>
                      </div>
                    ) : searchResults.length === 0 && !isSearching ? (
                      <div className="p-8 text-center">
                        <p className="text-sm text-muted-foreground">No results found</p>
                      </div>
                    ) : isSearching ? (
                      <div className="p-8 text-center">
                        <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {searchResults.map((video) => (
                          <div key={video.id} className="p-3 border rounded-lg hover:bg-accent transition-colors">
                            <div className="flex gap-3">
                              <img src={video.thumbnail} alt={video.title} className="w-32 h-20 object-cover rounded" />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm line-clamp-2 mb-1">{video.title}</h4>
                                <p className="text-xs text-muted-foreground">{video.channel}</p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleSaveFromSearch(video)}
                                disabled={submitting}
                              >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : videos.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
            <Play className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No videos yet</h3>
          <p className="text-muted-foreground mb-6">
            Add your first YouTube video to get started
          </p>
          <Button onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Video
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <Link key={video.id} href={`/app/watch/${video.id}`}>
              <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col">
                {/* Thumbnail Section */}
                <div
                  className="flex-1 relative group bg-muted"
                  style={{
                    backgroundImage: `url(${video.thumbnail})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    minHeight: "180px",
                  }}
                >
                  {/* Delete Button */}
                  <div className="absolute top-2 right-2 z-10">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteVideo(video.id);
                      }}
                      className="text-destructive hover:bg-destructive/10 bg-white/80 hover:bg-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Duration Badge */}
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                    {String(Math.floor(video.duration / 3600)).padStart(2, "0")}:{String(Math.floor((video.duration % 3600) / 60)).padStart(2, "0")}:{String(video.duration % 60).padStart(2, "0")}
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Play className="w-12 h-12 text-white" />
                  </div>
                </div>

                {/* Info Section - Below Thumbnail */}
                <div className="p-4 bg-card">
                  <h3 className="font-semibold text-foreground line-clamp-2 mb-2">
                    {video.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {video.channel}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
