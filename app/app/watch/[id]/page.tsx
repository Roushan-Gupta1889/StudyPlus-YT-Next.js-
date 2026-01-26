"use client";

import { useState, useEffect, use } from "react";
import { ArrowLeft, Loader2, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Video {
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  thumbnail: string;
  channel: string;
  duration: number;
  completed?: boolean;
}

interface PlaylistVideo {
  id: string;
  youtubeId: string;
  title: string;
  channel: string;
  duration: number;
  completed?: boolean;
}

export default function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [video, setVideo] = useState<Video | null>(null);
  const [playlistVideos, setPlaylistVideos] = useState<PlaylistVideo[]>([]);
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    fetchVideo();
    checkPlaylistContext();
  }, [id]);

  const checkPlaylistContext = async () => {
    // Try to get playlist info from session/url params if available
    const urlParams = new URLSearchParams(window.location.search);
    const pId = urlParams.get("playlistId");
    if (pId) {
      setPlaylistId(pId);
      await fetchPlaylistVideos(pId);
    }
  };

  const fetchVideo = async () => {
    try {
      const response = await fetch(`/api/videos/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch video");
      }
      const data = await response.json();
      setVideo(data);
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
      const videos = await response.json();
      setPlaylistVideos(videos);
      
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

  const handleNext = () => {
    if (currentIndex < playlistVideos.length - 1) {
      const nextVideo = playlistVideos[currentIndex + 1];
      window.location.href = `/app/watch/${nextVideo.id}?playlistId=${playlistId}`;
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevVideo = playlistVideos[currentIndex - 1];
      window.location.href = `/app/watch/${prevVideo.id}?playlistId=${playlistId}`;
    }
  };

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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

            {/* Progress Stats */}
            <div className="flex items-center gap-4 ml-4 flex-shrink-0">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {currentIndex + 1}/{playlistVideos.length} completed
                </p>
                <p className="text-xs text-muted-foreground">
                  {Math.round((currentIndex / playlistVideos.length) * 100)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Video Player */}
          <div className="mb-6">
            <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
                title={video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: "absolute", top: 0, left: 0 }}
              ></iframe>
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
                <span>Duration: {String(Math.floor(video.duration / 3600)).padStart(2, "0")}:{String(Math.floor((video.duration % 3600) / 60)).padStart(2, "0")}:{String(video.duration % 60).padStart(2, "0")}</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="attachments">Attachments</TabsTrigger>
              <TabsTrigger value="ai">AI Assistant</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="space-y-4">
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">About this lesson</h2>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {video.description}
                </p>
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
              <Card className="p-6 text-center text-muted-foreground py-12">
                <p>AI Assistant coming soon</p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Playlist Sidebar */}
        {playlistId && playlistVideos.length > 0 && (
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-4">
                Lesson {currentIndex + 1} / {playlistVideos.length}
              </h3>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {playlistVideos.map((v, idx) => (
                  <Link key={v.id} href={`/app/watch/${v.id}?playlistId=${playlistId}`}>
                    <div
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        idx === currentIndex
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
    </div>
  );
}
