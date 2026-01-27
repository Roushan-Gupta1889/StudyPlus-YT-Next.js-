"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, Play, BookmarkPlus, Check, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";

interface YouTubeVideo {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: number;
  description: string;
}

interface YouTubeSearchProps {
  onClose?: () => void;
}

export const YouTubeSearch = ({ onClose }: YouTubeSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<"video" | "playlist">("video");
  const [videos, setVideos] = useState<any[]>([]);
  const [savedItems, setSavedItems] = useState<string[]>([]);
  const [importingPlaylistId, setImportingPlaylistId] = useState<string | null>(null);

  // Debounce search query (500ms delay)
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSearch = useCallback(async (query: string, type: string) => {
    if (!query.trim()) {
      setVideos([]);
      return;
    }

    try {
      setIsSearching(true);
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&type=${type}`);

      if (res.status === 429) {
        toast.error("Too many requests. Please slow down.");
        return;
      }

      if (res.status === 503) {
        toast.error("YouTube API quota exceeded. Results may be limited.");
        return;
      }

      if (!res.ok) {
        throw new Error("Search failed");
      }

      const data = await res.json();
      setVideos(data);
    } catch (error) {
      console.error("YouTube search error:", error);
      toast.error("Failed to search YouTube. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Auto-search when debounced query changes or tab changes
  useEffect(() => {
    if (debouncedSearchQuery) {
      handleSearch(debouncedSearchQuery, activeTab);
    }
  }, [debouncedSearchQuery, activeTab, handleSearch]);

  const handleSaveVideo = async (video: any) => {
    try {
      const res = await fetch("/api/videos", {
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

      if (!res.ok) {
        throw new Error("Failed to save video");
      }

      setSavedItems([...savedItems, video.id]);
      toast.success("Video saved to your library!");
    } catch (error) {
      console.error("Save video error:", error);
      toast.error("Failed to save video");
    }
  };

  // Import playlist
  const handleImportPlaylist = async (playlist: any) => {
    try {
      setImportingPlaylistId(playlist.id);
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: playlist.title,
          description: playlist.description,
          youtubeId: playlist.id,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to import playlist");
      }

      toast.success("Playlist imported successfully!");

      // Close search and redirect (optional, or just show success)
      if (onClose) onClose();
      window.location.href = "/app/playlists";

    } catch (error) {
      console.error("Import playlist error:", error);
      toast.error("Failed to import playlist");
    } finally {
      setImportingPlaylistId(null);
    }
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-foreground">Search YouTube</h3>
            {/* Tabs */}
            <div className="flex bg-muted/50 rounded-lg p-1">
              {(["video", "playlist"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === tab
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}s
                </button>
              ))}
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${activeTab}s...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {isSearching && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Searching...
          </p>
        )}
      </div>

      {/* Results */}
      <div className="max-h-96 overflow-auto">
        {!searchQuery ? (
          <div className="p-8 text-center">
            <Search className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Start typing to search YouTube {activeTab}s
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Results are cached for 24 hours to save API quota
            </p>
          </div>
        ) : videos.length === 0 && !isSearching ? (
          <div className="p-8 text-center">
            <Search className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No results found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {videos.map((item) => (
              <div key={item.id} className="p-4 hover:bg-accent/50 transition-colors">
                <div className="flex gap-3">
                  {/* Thumbnail / Avatar */}
                  <div className={`flex-shrink-0 relative overflow-hidden bg-muted w-40 h-24 rounded-lg`}>
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-6 h-6 text-muted-foreground/50" />
                      </div>
                    )}
                    {activeTab === 'video' && (
                      <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                        {formatDuration(item.duration)}
                      </span>
                    )}
                    {activeTab === 'playlist' && (
                      <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                        {item.itemCount} videos
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className="font-medium text-foreground text-sm line-clamp-2 mb-1">
                      {item.title}
                    </h4>
                    {activeTab === 'video' && <p className="text-xs text-muted-foreground mb-1">{item.channel}</p>}
                    {activeTab === 'playlist' && (
                      <p className="text-xs text-muted-foreground">
                        by {item.channel}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0 justify-center">
                    {activeTab === 'video' && (
                      <Button
                        variant={savedItems.includes(item.id) ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => handleSaveVideo(item)}
                        disabled={savedItems.includes(item.id)}
                        className="gap-1.5"
                      >
                        {savedItems.includes(item.id) ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Saved
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="w-3.5 h-3.5" />
                            Save
                          </>
                        )}
                      </Button>
                    )}
                    {activeTab === 'playlist' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleImportPlaylist(item)}
                        disabled={importingPlaylistId === item.id}
                        className="gap-1.5"
                      >
                        {importingPlaylistId === item.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="w-3.5 h-3.5" />
                            Import
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
