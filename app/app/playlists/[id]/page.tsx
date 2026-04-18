"use client";

import { useState, useEffect, use } from "react";
import { ArrowLeft, Loader2, Play, Trash2, RefreshCcw } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Linkify } from "@/components/ui/linkify";

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
  youtubePlaylistId?: string | null;
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
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchPlaylistDetails();
  }, [id]);

  const handleSyncMetadata = async (playlistId: string) => {
    if (syncing) return;
    setSyncing(true);
    try {
      const res = await fetch(`/api/playlists/${playlistId}/sync`, { method: "POST" });
      if (res.ok) {
        const updated = await res.json();
        setPlaylist(prev => prev ? { ...prev, description: updated.description } : prev);
      }
    } catch (error) {
      console.error("Failed to sync metadata", error);
    } finally {
      setSyncing(false);
    }
  };

  const fetchPlaylistDetails = async () => {
    try {
      // Fetch playlist info
      const playlistRes = await fetch(`/api/playlists/${id}`);
      const playlistData = await playlistRes.json(); // ✅ parse FIRST

      if (!playlistRes.ok) {
        throw new Error(
          playlistData?.error?.message ||
          playlistData?.message ||
          "Failed to fetch playlist"
        );
      }

      setPlaylist(playlistData);

      // Auto-sync if description is legacy placeholder
      if (playlistData.description?.startsWith("Imported from YouTube") && playlistData.youtubePlaylistId) {
          handleSyncMetadata(playlistData.id);
      }

      // Fetch videos in playlist
      const videosRes = await fetch(`/api/playlists/${id}/videos`);
      const videosData = await videosRes.json();

      if (!videosRes.ok) {
        throw new Error(
          videosData?.error?.message ||
          videosData?.message ||
          "Failed to fetch videos"
        );
      }

      setVideos(Array.isArray(videosData) ? videosData : videosData.videos ?? []);
      setHasMore(!!(videosData.hasMore ?? false));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load playlist"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveVideo = async (videoId: string) => {
    if (!confirm("Remove this video from the playlist?")) return;

    try {
      const response = await fetch(
        `/api/playlists/${id}/videos?videoId=${videoId}`,
        { method: "DELETE" }
      );

      const data = await response.json(); // ✅ parse FIRST

      if (!response.ok) {
        throw new Error(
          data?.error?.message ||
          data?.message ||
          "Failed to remove video"
        );
      }

      setVideos(videos.filter((v) => v.id !== videoId));
      toast.success("Video removed from playlist");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove video"
      );
    }

  };

  const loadMoreVideos = async () => {
    if (!id || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/playlists/${id}/load-more`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to load more");
      const data = await res.json();
      if (data.videos && data.videos.length > 0) {
        setVideos((prev) => [...prev, ...data.videos]);
        toast.success(`Loaded ${data.videos.length} more videos`);
      }
      setHasMore(!!data.hasMore);
    } catch (error) {
      toast.error("Failed to load more videos");
    } finally {
      setLoadingMore(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading playlist…</p>
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

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2">
           <div>
             <h1 className="text-3xl font-bold text-foreground mb-2">{playlist.name}</h1>
           </div>
           {playlist.youtubePlaylistId && (
             <Button 
               variant="outline" 
               size="sm" 
               onClick={() => handleSyncMetadata(playlist.id)}
               disabled={syncing}
             >
               <RefreshCcw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
               {syncing ? 'Syncing...' : 'Sync Info'}
             </Button>
           )}
        </div>

        {playlist.description && !playlist.description.startsWith("Imported from YouTube") ? (
          <div className="text-sm text-muted-foreground whitespace-pre-wrap max-w-3xl border-l-2 border-primary/20 pl-4 py-1 my-4">
            <Linkify text={playlist.description} />
          </div>
        ) : playlist.description?.startsWith("Imported from YouTube") && (
          <p className="text-sm text-muted-foreground italic mt-2">
             No description available. (Syncing...)
          </p>
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
                  {video.thumbnail ? (
                    <Image
                      src={video.thumbnail}
                      alt={video.title}
                      fill
                      className="object-cover group-hover:opacity-75 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">
                      <Play className="w-6 h-6 opacity-30" />
                    </div>
                  )}
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

      {/* Load More button */}
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button
            onClick={loadMoreVideos}
            disabled={loadingMore}
            variant="outline"
            className="gap-2 min-w-[200px]"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading…
              </>
            ) : (
              "Load more videos"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
