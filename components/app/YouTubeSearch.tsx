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
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [savedItems, setSavedItems] = useState<string[]>([]);

  // Debounce search query (500ms delay)
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setVideos([]);
      return;
    }

    try {
      setIsSearching(true);
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);

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

  // Auto-search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery) {
      handleSearch(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, handleSearch]);

  const handleSaveVideo = async (video: YouTubeVideo) => {
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

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Search YouTube</h3>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search videos... (auto-searches as you type)"
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
              Start typing to search YouTube videos
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
            {videos.map((video) => (
              <div key={video.id} className="p-4 hover:bg-accent/50 transition-colors">
                <div className="flex gap-3">
                  <div className="w-40 h-24 bg-muted rounded-lg flex-shrink-0 overflow-hidden relative">
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-6 h-6 text-muted-foreground/50" />
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                      {formatDuration(video.duration)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground text-sm line-clamp-2 mb-1">
                      {video.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-1">{video.channel}</p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Button
                      variant={savedItems.includes(video.id) ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => handleSaveVideo(video)}
                      disabled={savedItems.includes(video.id)}
                      className="gap-1.5"
                    >
                      {savedItems.includes(video.id) ? (
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
