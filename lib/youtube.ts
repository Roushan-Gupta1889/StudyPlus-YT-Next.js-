import axios from "axios";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3";

export interface YouTubeVideo {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    duration: number; // in seconds
    channel: string;
}

// Extract video ID from different YouTube URL formats
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

    // If it's already just an ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        return url;
    }

    return null;
}

// Convert ISO 8601 duration to seconds
function parseDuration(duration: string): number {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;

    return hours * 3600 + minutes * 60 + seconds;
}

// Fetch video details from YouTube API
export async function getVideoDetails(videoId: string): Promise<YouTubeVideo | null> {
    try {
        const response = await axios.get(`${YOUTUBE_API_URL}/videos`, {
            params: {
                part: "snippet,contentDetails",
                id: videoId,
                key: YOUTUBE_API_KEY,
            },
        });

        if (!response.data.items || response.data.items.length === 0) {
            return null;
        }

        const item = response.data.items[0];
        const snippet = item.snippet;
        const contentDetails = item.contentDetails;

        return {
            id: videoId,
            title: snippet.title,
            description: snippet.description,
            thumbnail: snippet.thumbnails.high?.url || snippet.thumbnails.default.url,
            duration: parseDuration(contentDetails.duration),
            channel: snippet.channelTitle,
        };
    } catch (error) {
        console.error("[YOUTUBE_GET_VIDEO]", error);
        return null;
    }
}

// Search YouTube videos
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

// Search YouTube
export async function searchYouTube(
    query: string,
    type: SearchType = "video",
    maxResults: number = 10
): Promise<(YouTubeVideo | YouTubeChannel | YouTubePlaylist)[]> {
    try {
        const response = await axios.get(`${YOUTUBE_API_URL}/search`, {
            params: {
                part: "snippet",
                q: query,
                type,
                maxResults,
                key: YOUTUBE_API_KEY,
            },
        });

        if (!response.data.items) {
            return [];
        }

        const items = response.data.items;

        if (type === "video") {
            // Get full details for each video (including duration)
            const videoIds = items.map((item: any) => item.id.videoId).join(",");

            const detailsResponse = await axios.get(`${YOUTUBE_API_URL}/videos`, {
                params: {
                    part: "snippet,contentDetails",
                    id: videoIds,
                    key: YOUTUBE_API_KEY,
                },
            });

            return detailsResponse.data.items.map((item: any) => ({
                id: item.id,
                title: item.snippet.title,
                description: item.snippet.description,
                thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
                duration: parseDuration(item.contentDetails.duration),
                channel: item.snippet.channelTitle,
            }));
        } else if (type === "channel") {
            // Get channel details (subscriber count)
            const channelIds = items.map((item: any) => item.id.channelId).join(",");

            const detailsResponse = await axios.get(`${YOUTUBE_API_URL}/channels`, {
                params: {
                    part: "snippet,statistics",
                    id: channelIds,
                    key: YOUTUBE_API_KEY,
                },
            });

            return detailsResponse.data.items.map((item: any) => ({
                id: item.id,
                title: item.snippet.title,
                description: item.snippet.description,
                thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
                subscriberCount: item.statistics.subscriberCount,
                videoCount: item.statistics.videoCount,
            }));
        } else if (type === "playlist") {
            // Get playlist details (item count)
            const playlistIds = items.map((item: any) => item.id.playlistId).join(",");

            const detailsResponse = await axios.get(`${YOUTUBE_API_URL}/playlists`, {
                params: {
                    part: "snippet,contentDetails",
                    id: playlistIds,
                    key: YOUTUBE_API_KEY,
                },
            });

            return detailsResponse.data.items.map((item: any) => ({
                id: item.id,
                title: item.snippet.title,
                description: item.snippet.description,
                thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
                itemCount: item.contentDetails.itemCount,
                channel: item.snippet.channelTitle,
            }));
        }

        return [];
    } catch (error) {
        console.error("[YOUTUBE_SEARCH]", error);
        return [];
    }
}

// Get videos from a playlist
export async function getPlaylistVideos(playlistId: string, maxResults: number = 50): Promise<YouTubeVideo[]> {
    try {
        // 1. Get playlist items (video IDs)
        const playlistResponse = await axios.get(`${YOUTUBE_API_URL}/playlistItems`, {
            params: {
                part: "snippet,contentDetails",
                playlistId: playlistId,
                maxResults: maxResults, // Max allowed by API per page is 50
                key: YOUTUBE_API_KEY,
            },
        });

        if (!playlistResponse.data.items || playlistResponse.data.items.length === 0) {
            return [];
        }

        const videoIds = playlistResponse.data.items.map((item: any) => item.contentDetails.videoId).join(",");

        // 2. Get video details (duration is needed)
        const videosResponse = await axios.get(`${YOUTUBE_API_URL}/videos`, {
            params: {
                part: "snippet,contentDetails",
                id: videoIds,
                key: YOUTUBE_API_KEY,
            },
        });

        return videosResponse.data.items.map((item: any) => ({
            id: item.id,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
            duration: parseDuration(item.contentDetails.duration),
            channel: item.snippet.channelTitle,
        }));
    } catch (error) {
        console.error("[YOUTUBE_GET_PLAYLIST_VIDEOS]", error);
        return [];
    }
}
