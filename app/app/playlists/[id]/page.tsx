"use client";

import { useState, useEffect, use } from "react";
import { ArrowLeft, Loader2, Play, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface PlaylistVideo {
  id: string;
  youtubeId: string;
  title: string;
  thumbnail: string;
  channel: string;
  duration: number;
}

interface Playlist {
  id: string;
  name: string;
  description?: string;
}

export default function PlaylistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [videos, setVideos] = useState<PlaylistVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchPlaylistDetails();
  }, [id]);

  const fetchPlaylistDetails = async () => {
    try {
      // Fetch playlist info
      const playlistRes = await fetch(`/api/playlists/${id}`);
      if (!playlistRes.ok) {
        console.error("Playlist fetch error:", await playlistRes.text());
        throw new Error("Failed to fetch playlist");
      }
      const playlistData = await playlistRes.json();
      setPlaylist(playlistData);

      // Fetch videos in playlist
      const videosRes = await fetch(`/api/playlists/${id}/videos`);
      if (!videosRes.ok) {
        console.error("Videos fetch error:", await videosRes.text());
        throw new Error("Failed to fetch videos");
      }
      const videosData = await videosRes.json();
      console.log("Fetched videos:", videosData);
      setVideos(videosData);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load playlist");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveVideo = async (videoId: string) => {
    if (!confirm("Remove this video from the playlist?")) return;

    try {
      const response = await fetch(`/api/playlists/${id}/videos?videoId=${videoId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to remove video");

      setVideos(videos.filter((v) => v.id !== videoId));
      toast.success("Video removed from playlist");
    } catch (error) {
      toast.error("Failed to remove video");
    }
  };

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-foreground mb-4">Playlist not found</h1>
          <Link href="/app/playlists">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Playlists
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/app/playlists" className="mb-4 inline-block">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Playlists
          </Button>
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">{playlist.name}</h1>
        {playlist.description && (
          <p className="text-muted-foreground">{playlist.description}</p>
        )}
        <p className="text-sm text-muted-foreground mt-4">
          {videos.length} video{videos.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Videos List */}
      {videos.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
            <Play className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No videos in playlist</h3>
          <p className="text-muted-foreground">
            This playlist doesn't have any videos yet
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {videos.map((video, index) => (
            <div key={video.id} className="flex gap-3 sm:gap-4 group cursor-pointer hover:bg-accent/50 p-2 rounded-lg transition-colors">
              {/* Thumbnail with Duration */}
              <Link href={`/app/watch/${video.id}?playlistId=${id}`} className="flex-shrink-0">
                <div className="relative w-32 sm:w-40 h-20 sm:h-24 bg-muted rounded overflow-hidden">
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    fill
                    className="object-cover group-hover:opacity-75 transition-opacity"
                  />
                  {/* Duration Overlay */}
                  <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                    {String(Math.floor(video.duration / 3600)).padStart(2, "0")}:{String(Math.floor((video.duration % 3600) / 60)).padStart(2, "0")}:{String(video.duration % 60).padStart(2, "0")}
                  </div>
                </div>
              </Link>

              {/* Video Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                <div>
                  {/* Number and Title */}
                  <div className="flex items-start gap-2 mb-1">
                    <span className="text-base sm:text-lg font-bold text-muted-foreground min-w-fit">
                      {index + 1}.
                    </span>
                    <Link href={`/app/watch/${video.id}?playlistId=${id}`}>
                      <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {video.title}
                      </h3>
                    </Link>
                  </div>

                  {/* Channel and Metadata */}
                  <div className="flex flex-col gap-0.5 ml-6">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {video.channel}
                    </p>
                  </div>
                </div>
              </div>

              {/* Delete Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveVideo(video.id)}
                className="text-destructive hover:bg-destructive/10 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
