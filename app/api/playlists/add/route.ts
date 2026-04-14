import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeName } from "@/lib/sanitize";
import { createErrorResponse, ErrorCode, handleYouTubeError, handleDatabaseError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";

// ✅ FIX 1: Rate limiter - 3 playlists per minute (heavy operation)
const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
});

const MAX_VIDEOS_PER_PLAYLIST = 50;

// Extract YouTube playlist ID from various YouTube URL formats
function extractPlaylistId(url: string): string | null {
  const patterns = [
    /[?&]list=([a-zA-Z0-9_-]+)/,
    /youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/,
    /^([a-zA-Z0-9_-]+)$/, // Direct playlist ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// ✅ FIX 2: Use handleYouTubeError properly
async function fetchPlaylistVideos(playlistId: string, pageToken?: string, maxPages = 3) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YouTube API key not configured");
  }

  const videos = [];
  let nextPageToken: string | undefined = pageToken;
  let lastPageToken: string | undefined = undefined;

  for (let page = 0; page < maxPages; page++) {
    const response: Response = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50&pageToken=${nextPageToken || ""}&key=${apiKey}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw handleYouTubeError({ response: { status: response.status, data: errorData } });
    }

    const data: any = await response.json();
    if (!data.items || data.items.length === 0) {
      break;
    }

    for (const item of data.items) {
      videos.push({
        youtubeId: item.contentDetails.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || "",
        channel: item.snippet.channelTitle,
      });
    }

    nextPageToken = data.nextPageToken;
    lastPageToken = data.nextPageToken; // remember the token for next-page after this batch
    if (!nextPageToken) break;
  }

  return { videos, nextPageToken: lastPageToken };
}

// Parse ISO 8601 duration to seconds
function parseDuration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;

  // Explicitly strip unit suffixes for clarity and safety
  const hours = match[1] ? parseInt(match[1].replace("H", ""), 10) * 3600 : 0;
  const minutes = match[2] ? parseInt(match[2].replace("M", ""), 10) * 60 : 0;
  const seconds = match[3] ? parseInt(match[3].replace("S", ""), 10) : 0;

  return hours + minutes + seconds;
}

// ✅ FIX 2: Use handleYouTubeError properly
async function fetchVideoDetails(videoIds: string[]) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YouTube API key not configured");
  }

  const videoDetails: { [key: string]: number } = {};

  // Fetch in chunks of 50 (YouTube API limit)
  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50);
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${chunk.join(",")}&key=${apiKey}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw handleYouTubeError({ response: { status: response.status, data: errorData } });
    }

    const data: any = await response.json();
    if (data.items) {
      for (const item of data.items) {
        videoDetails[item.id] = parseDuration(item.contentDetails.duration);
      }
    }
  }

  return videoDetails;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      const { response, statusCode } = createErrorResponse(
        ErrorCode.UNAUTHORIZED,
        "Unauthorized",
        401
      );
      return NextResponse.json(response, { status: statusCode });
    }

    // ✅ FIX 1: Apply rate limiting (3 playlists per minute - heavy operation)
    try {
      await limiter.check(3, session.user.id);
    } catch {
      const { response, statusCode } = createErrorResponse(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        "Too many playlist imports. Please wait a minute.",
        429
      );
      return NextResponse.json(response, { status: statusCode });
    }

    const { playlistUrl, playlistName, isIITM } = await req.json();

    if (!playlistUrl) {
      const { response, statusCode } = createErrorResponse(
        ErrorCode.MISSING_FIELD,
        "Playlist URL is required",
        400
      );
      return NextResponse.json(response, { status: statusCode });
    }

    // Extract playlist ID
    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      const isVideoPattern = playlistUrl.includes("youtu.be/") || playlistUrl.includes("/watch?v=");
      const errorMessage = isVideoPattern 
        ? "This is a video URL. Please provide a YouTube playlist URL."
        : "Invalid YouTube playlist URL";
        
      const { response, statusCode } = createErrorResponse(
        ErrorCode.INVALID_INPUT,
        errorMessage,
        400
      );
      return NextResponse.json(response, { status: statusCode });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      const { response, statusCode } = createErrorResponse(
        ErrorCode.NOT_FOUND,
        "User not found",
        404
      );
      return NextResponse.json(response, { status: statusCode });
    }

    // Check if playlist is already imported
    const existingPlaylist = await prisma.playlist.findFirst({
      where: {
        userId: user.id,
        youtubePlaylistId: playlistId,
      },
    });

    if (existingPlaylist) {
      const { response, statusCode } = createErrorResponse(
        ErrorCode.INVALID_INPUT,
        "This playlist has already been imported",
        400
      );
      return NextResponse.json(response, { status: statusCode });
    }

    // Fetch playlist videos from YouTube (first batch, up to 1 page = 50 videos)
    const { videos: playlistVideos, nextPageToken: fetchedNextPageToken } = await fetchPlaylistVideos(playlistId, undefined, 1);

    if (playlistVideos.length === 0) {
      const { response, statusCode } = createErrorResponse(
        ErrorCode.NOT_FOUND,
        "Playlist is empty or not accessible",
        400
      );
      return NextResponse.json(response, { status: statusCode });
    }

    // Fetch video durations
    const videoIds = playlistVideos.map((v) => v.youtubeId);
    const videoDetails = await fetchVideoDetails(videoIds);

    // ✅ FIX 3: Check for truncation BEFORE processing
    const totalVideos = playlistVideos.length;
    const willTruncate = totalVideos > MAX_VIDEOS_PER_PLAYLIST;
    const videosToImport = playlistVideos.slice(0, MAX_VIDEOS_PER_PLAYLIST);

    // ✅ FIX 5: Sanitize playlist name
    const safeName = playlistName
      ? sanitizeName(playlistName)
      : `Playlist - ${new Date().toLocaleDateString()}`;

    // ✅ FIX 4: Wrap everything in a transaction (with increased timeout for large playlists)
    const result = await prisma.$transaction(async (tx) => {
      // Create playlist in database
      const playlist = await tx.playlist.create({
        data: {
          userId: user.id,
          name: safeName,
          description: `Imported from YouTube - ${playlistId}`,
          youtubePlaylistId: playlistId,
          nextPageToken: fetchedNextPageToken || null,
          isIITM: isIITM === true,
        },
      });

      // Add videos to playlist
      const videoRecordIds: string[] = [];

      for (let i = 0; i < videosToImport.length; i++) {
        const videoData = videosToImport[i];
        const duration = videoDetails[videoData.youtubeId] || 0;

        // Check if video already exists for this user
        let video = await tx.video.findFirst({
          where: {
            userId: user.id,
            youtubeId: videoData.youtubeId,
          },
        });

        // If not, create it
        if (!video) {
          video = await tx.video.create({
            data: {
              userId: user.id,
              youtubeId: videoData.youtubeId,
              title: videoData.title,
              description: videoData.description,
              thumbnail: videoData.thumbnail,
              channel: videoData.channel,
              duration: duration,
            },
          });
        }

        videoRecordIds.push(video.id);
      }

      // Create playlist video relationships efficiently
      if (videoRecordIds.length > 0) {
        const playlistVideoData = videoRecordIds.map((id, position) => ({
          playlistId: playlist.id,
          videoId: id,
          position: position,
        }));

        await tx.playlistVideo.createMany({
          data: playlistVideoData,
        });
      }

      return {
        playlist,
        videosAdded: videoRecordIds.length,
      };
    }, {
      maxWait: 5000,
      timeout: 30000, // 30 seconds to allow creating up to 50 videos
    });

    // ✅ FIX 3: Return truncation warning in response
    return NextResponse.json(
      {
        ...result,
        truncated: willTruncate,
        totalVideosInPlaylist: totalVideos,
        ...(willTruncate && {
          warning: `Playlist was truncated from ${totalVideos} to ${MAX_VIDEOS_PER_PLAYLIST} videos`,
        }),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error adding playlist:", error);

    // Handle database errors FIRST (Prisma errors also have error.code)
    if (error.code?.startsWith("P")) {
      const appError = handleDatabaseError(error);
      return NextResponse.json(appError.toJSON(), { status: appError.statusCode });
    }

    // Handle known application errors (including YouTube errors)
    if (error.code && error.toJSON) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }

    const { response, statusCode } = createErrorResponse(
      ErrorCode.INTERNAL_ERROR,
      error.message || "Failed to import playlist",
      500
    );
    return NextResponse.json(response, { status: statusCode });
  }
}
