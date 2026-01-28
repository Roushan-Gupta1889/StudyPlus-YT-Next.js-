"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, Trash2, Play } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Playlist {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  thumbnail?: string | null;
  _count?: {
    videos: number;
  };
}

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [playlistName, setPlaylistName] = useState("");
  const [open, setOpen] = useState(false);

  // Fetch playlists
  useEffect(() => {
    fetchPlaylists();
    updateMissingDurations();
  }, []);

  const updateMissingDurations = async () => {
    try {
      await fetch("/api/videos/update-durations", {
        method: "POST",
      });
      // Silently update, don't show toast
    } catch (error) {
      console.error("Silent duration update failed:", error);
    }
  };

  const fetchPlaylists = async () => {
    try {
      const response = await fetch("/api/playlists/list");
      if (!response.ok) throw new Error("Failed to fetch playlists");
      const data = await response.json();
      setPlaylists(data);
    } catch (error) {
      toast.error("Failed to load playlists");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDurations = async () => {
    setUpdating(true);
    try {
      const response = await fetch("/api/videos/update-durations", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update durations");
      }

      toast.success(`Updated ${data.updated} video durations!`);

      // Refresh playlists to show updated durations
      await fetchPlaylists();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update durations");
    } finally {
      setUpdating(false);
    }
  };

  const handleAddPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistUrl.trim()) {
      toast.error("Please enter a playlist URL");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/playlists/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistUrl,
          playlistName: playlistName || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add playlist");
      }

      // Add playlist stats for immediate display
      const newPlaylistWithStats = {
        ...data.playlist,
        totalVideos: data.videosAdded || 0,
        completedVideos: 0,
        totalDuration: 0,
      };

      setPlaylists([newPlaylistWithStats, ...playlists]);
      setPlaylistUrl("");
      setPlaylistName("");
      setOpen(false);
      toast.success(`Playlist added with ${data.videosAdded} videos! Open it to view`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add playlist");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm("Are you sure? All videos in this playlist will be removed.")) return;

    try {
      const response = await fetch(`/api/playlists/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: playlistId }),
      });

      if (!response.ok) throw new Error("Failed to delete playlist");

      setPlaylists(playlists.filter((p) => p.id !== playlistId));
      toast.success("Playlist deleted");
    } catch (error) {
      toast.error("Failed to delete playlist");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Playlists</h1>
          <p className="text-muted-foreground">
            {playlists.length} playlist{playlists.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex gap-2">


          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Playlist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add YouTube Playlist</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleAddPlaylist} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Playlist URL
                  </label>
                  <Input
                    placeholder="https://youtube.com/playlist?list=..."
                    value={playlistUrl}
                    onChange={(e) => setPlaylistUrl(e.target.value)}
                    disabled={submitting}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Paste the full YouTube playlist URL
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Playlist Name (Optional)
                  </label>
                  <Input
                    placeholder="e.g., React Tutorial"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {submitting ? "Adding..." : "Add Playlist"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : playlists.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
            <Play className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No playlists yet</h3>
          <p className="text-muted-foreground mb-6">
            Add your first YouTube playlist to get started
          </p>
          <Button onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Playlist
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map((playlist) => (
            <Link key={playlist.id} href={`/app/playlists/${playlist.id}`}>
              <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col">
                {/* Thumbnail Section */}
                <div
                  className="flex-1 relative group bg-muted"
                  style={{
                    backgroundImage: playlist.thumbnail ? `url(${playlist.thumbnail})` : undefined,
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
                        handleDeletePlaylist(playlist.id);
                      }}
                      className="text-destructive hover:bg-destructive/10 bg-white/80 hover:bg-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                </div>

                {/* Info Section - Below Thumbnail */}
                <div className="p-4 bg-card">
                  <h3 className="font-semibold text-foreground line-clamp-2 mb-2">
                    {playlist.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {playlist._count?.videos || 0} video{(playlist._count?.videos || 0) !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {playlist.description}
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
