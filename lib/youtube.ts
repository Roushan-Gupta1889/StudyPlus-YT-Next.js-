/**
 * YouTube API Utility Library
 * 
 * ✅ Phase 1 Compliant:
 * - Uses native fetch (no axios)
 * - Uses handleYouTubeError for consistent error handling
 * - Enforces pagination limits
 * - Never returns null/[] silently - throws on error
 */

import { handleYouTubeError, AppError, ErrorCode } from "@/lib/errors";

const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3";
const MAX_PLAYLIST_PAGES = 3; // Cap at 150 videos (50 per page)
const MAX_SEARCH_RESULTS = 25;

// Lazy API key getter with validation
function getApiKey(): string {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        throw new AppError(
            ErrorCode.INTERNAL_ERROR,
            "YouTube API key not configured",
            500
        );
    }
    return apiKey;
}

// ==========================================
// Interfaces
// ==========================================

export interface YouTubeVideo {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    duration: number; // in seconds
    channel: string;
}

export interface YouTubeChannel {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    subscriberCount?: string;
    videoCount?: string;
}

export interface YouTubePlaylist {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    itemCount: number;
    channel: string;
}

export type SearchType = "video" | "channel" | "playlist";

export type SearchResult = YouTubeVideo | YouTubeChannel | YouTubePlaylist;

// Tagged union for type-safe search results
export interface TaggedSearchResult<T extends SearchType> {
    type: T;
    items: T extends "video" ? YouTubeVideo[] :
    T extends "channel" ? YouTubeChannel[] :
    YouTubePlaylist[];
}

// ==========================================
// URL Extractors (Pure functions - no API)
// ==========================================

export function extractVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    // If it's already just an ID (11 characters)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        return url;
    }

    return null;
}

export function extractPlaylistId(url: string): string | null {
    const patterns = [
        /[?&]list=([^&\n?#]+)/,
        /youtube\.com\/playlist\?list=([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    // If it's already a playlist ID (starts with PL, UU, LL, FL, or RD)
    if (/^(PL|UU|LL|FL|RD)[a-zA-Z0-9_-]+$/.test(url)) {
        return url;
    }

    return null;
}

// ==========================================
// Duration Parser
// ==========================================

function parseDuration(duration: string): number {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;

    // Explicitly strip unit suffixes for clarity and safety
    const hours = match[1] ? parseInt(match[1].replace("H", ""), 10) * 3600 : 0;
    const minutes = match[2] ? parseInt(match[2].replace("M", ""), 10) * 60 : 0;
    const seconds = match[3] ? parseInt(match[3].replace("S", ""), 10) : 0;

    return hours + minutes + seconds;
}

// ==========================================
// API Helper - Consistent fetch wrapper
// ==========================================

async function youtubeApiFetch<T>(
    endpoint: string,
    params: Record<string, string | number>
): Promise<T> {
    const apiKey = getApiKey();
    const searchParams = new URLSearchParams();

    searchParams.set("key", apiKey);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            searchParams.set(key, String(value));
        }
    });

    const url = `${YOUTUBE_API_URL}/${endpoint}?${searchParams.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw handleYouTubeError({
            response: { status: response.status, data: errorData }
        });
    }

    return response.json();
}

// ==========================================
// Core API Functions
// ==========================================

/**
 * Fetch video details from YouTube API
 * @throws AppError on failure (never returns null)
 */
export async function getVideoDetails(videoId: string): Promise<YouTubeVideo> {
    const data = await youtubeApiFetch<any>("videos", {
        part: "snippet,contentDetails",
        id: videoId,
    });

    if (!data.items || data.items.length === 0) {
        throw new AppError(
            ErrorCode.NOT_FOUND,
            "Video not found",
            404
        );
    }

    const item = data.items[0];
    const snippet = item.snippet;
    const contentDetails = item.contentDetails;

    return {
        id: videoId,
        title: snippet.title,
        description: snippet.description,
        thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || "",
        duration: parseDuration(contentDetails.duration),
        channel: snippet.channelTitle,
    };
}

/**
 * Search YouTube with type discrimination
 * @throws AppError on failure (never returns [])
 */
export async function searchYouTube(
    query: string,
    type: SearchType = "video",
    maxResults: number = 10
): Promise<SearchResult[]> {
    // Enforce limit
    const safeMaxResults = Math.min(maxResults, MAX_SEARCH_RESULTS);

    const searchData = await youtubeApiFetch<any>("search", {
        part: "snippet",
        q: query,
        type,
        maxResults: safeMaxResults,
    });

    if (!searchData.items || searchData.items.length === 0) {
        return []; // Empty search is valid, not an error
    }

    const items = searchData.items;

    if (type === "video") {
        const videoIds = items.map((item: any) => item.id.videoId).join(",");

        const detailsData = await youtubeApiFetch<any>("videos", {
            part: "snippet,contentDetails",
            id: videoIds,
        });

        return detailsData.items.map((item: any): YouTubeVideo => ({
            id: item.id,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || "",
            duration: parseDuration(item.contentDetails.duration),
            channel: item.snippet.channelTitle,
        }));
    } else if (type === "channel") {
        const channelIds = items.map((item: any) => item.id.channelId).join(",");

        const detailsData = await youtubeApiFetch<any>("channels", {
            part: "snippet,statistics",
            id: channelIds,
        });

        return detailsData.items.map((item: any): YouTubeChannel => ({
            id: item.id,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || "",
            subscriberCount: item.statistics?.subscriberCount,
            videoCount: item.statistics?.videoCount,
        }));
    } else if (type === "playlist") {
        const playlistIds = items.map((item: any) => item.id.playlistId).join(",");

        const detailsData = await youtubeApiFetch<any>("playlists", {
            part: "snippet,contentDetails",
            id: playlistIds,
        });

        return detailsData.items.map((item: any): YouTubePlaylist => ({
            id: item.id,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || "",
            itemCount: item.contentDetails?.itemCount || 0,
            channel: item.snippet.channelTitle,
        }));
    }

    return [];
}

/**
 * Get videos from a playlist with enforced pagination limit
 * @throws AppError on failure (never returns [])
 */
export async function getPlaylistVideos(
    playlistId: string,
    maxPages: number = MAX_PLAYLIST_PAGES
): Promise<{ videos: YouTubeVideo[]; truncated: boolean; totalFetched: number }> {
    const allVideos: YouTubeVideo[] = [];
    let nextPageToken: string | undefined = undefined;
    let pageCount = 0;
    const safeMaxPages = Math.min(maxPages, MAX_PLAYLIST_PAGES);

    do {
        const playlistData: any = await youtubeApiFetch<any>("playlistItems", {
            part: "snippet,contentDetails",
            playlistId: playlistId,
            maxResults: 50,
            pageToken: nextPageToken || "",
        });

        if (!playlistData.items || playlistData.items.length === 0) {
            break;
        }

        const videoIds = playlistData.items
            .map((item: any) => item.contentDetails?.videoId)
            .filter(Boolean)
            .join(",");

        if (!videoIds) {
            break;
        }

        const videosData = await youtubeApiFetch<any>("videos", {
            part: "snippet,contentDetails",
            id: videoIds,
        });

        const videos = videosData.items.map((item: any): YouTubeVideo => ({
            id: item.id,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || "",
            duration: parseDuration(item.contentDetails.duration),
            channel: item.snippet.channelTitle,
        }));

        allVideos.push(...videos);

        nextPageToken = playlistData.nextPageToken;
        pageCount++;

    } while (nextPageToken && pageCount < safeMaxPages);

    return {
        videos: allVideos,
        truncated: !!nextPageToken, // True if there were more pages
        totalFetched: allVideos.length,
    };
}
