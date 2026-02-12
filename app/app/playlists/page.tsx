"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, Trash2, Play, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";

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
  const [addMode, setAddMode] = useState<"url" | "search">("url");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Fetch playlists
  useEffect(() => {
    fetchPlaylists();
  }, []);



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

  // Search YouTube for playlists
  useEffect(() => {
    const searchYouTube = async () => {
      if (!debouncedSearchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        setIsSearching(true);
        const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(debouncedSearchQuery)}&type=playlist`);
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

  const handleImportFromSearch = async (playlist: any) => {
    try {
      setSubmitting(true);
      const response = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: playlist.title,
          description: playlist.description,
          youtubeId: `https://www.youtube.com/playlist?list=${playlist.id}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to import playlist");
      }

      await fetchPlaylists();
      setOpen(false);
      toast.success("Playlist imported successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to import playlist");
    } finally {
      setSubmitting(false);
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

      const data = await response.json(); // ✅ PARSE FIRST

      if (!response.ok) {
        throw new Error(
          data?.error?.message ||
          data?.message ||
          "Failed to add playlist"
        );
      }

      await fetchPlaylists();

      setPlaylistUrl("");
      setPlaylistName("");
      setOpen(false);

      toast.success(`Playlist added with ${data.videosAdded} videos!`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add playlist"
      );
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

  const handleClearAll = async () => {
    if (playlists.length === 0) {
      toast.error("No playlists to clear");
      return;
    }

    if (!confirm(`Are you sure you want to delete ALL ${playlists.length} playlists? This cannot be undone.`)) return;

    try {
      // Delete all playlists in parallel
      const deletePromises = playlists.map(playlist =>
        fetch(`/api/playlists/delete`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: playlist.id }),
        })
      );

      await Promise.all(deletePromises);

      setPlaylists([]);
      toast.success("All playlists cleared successfully");
    } catch (error) {
      toast.error("Failed to clear all playlists");
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
          {playlists.length > 0 && (
            <Button
              variant="outline"
              onClick={handleClearAll}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}

          <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) { setAddMode("url"); setSearchQuery(""); setSearchResults([]); } }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Playlist
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Add YouTube Playlist</DialogTitle>
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

              {/* URL Mode */}
              {addMode === "url" && (
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
              )}

              {/* Search Mode */}
              {addMode === "search" && (
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search YouTube playlists..."
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
                        {searchResults.map((playlist) => (
                          <div key={playlist.id} className="p-3 border rounded-lg hover:bg-accent transition-colors">
                            <div className="flex gap-3">
                              <img src={playlist.thumbnail} alt={playlist.title} className="w-32 h-20 object-cover rounded" />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm line-clamp-2 mb-1">{playlist.title}</h4>
                                <p className="text-xs text-muted-foreground">{playlist.channel} • {playlist.itemCount} videos</p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleImportFromSearch(playlist)}
                                disabled={submitting}
                              >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Import"}
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
