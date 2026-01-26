"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, Trash2, Play } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import Image from "next/image";

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

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Video
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add YouTube Video</DialogTitle>
            </DialogHeader>

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
          </DialogContent>
        </Dialog>
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
