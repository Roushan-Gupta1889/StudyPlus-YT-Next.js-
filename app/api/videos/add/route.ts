import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createErrorResponse, ErrorCode, handleYouTubeError, handleDatabaseError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";

// Rate limiter: 10 videos per minute
const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
});

// Extract YouTube video ID from various YouTube URL formats
function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Fetch video metadata from YouTube API
async function fetchVideoMetadata(videoId: string) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YouTube API key not configured");
  }

  try {
    const response: Response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw handleYouTubeError({ response: { status: response.status, data: errorData } });
    }

    const data: any = await response.json();
    if (!data.items || data.items.length === 0) {
      throw new Error("Video not found");
    }

    const video = data.items[0];
    const snippet = video.snippet;
    const duration = parseDuration(video.contentDetails.duration);

    return {
      title: snippet.title,
      description: snippet.description,
      thumbnail: snippet.thumbnails.high.url,
      channel: snippet.channelTitle,
      duration: duration,
    };
  } catch (error: any) {
    throw handleYouTubeError(error);
  }
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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // ✅ FIX: Use session.user.id directly — no extra DB lookup needed
    if (!session?.user?.id) {
      const { response, statusCode } = createErrorResponse(
        ErrorCode.UNAUTHORIZED,
        "Unauthorized",
        401
      );
      return NextResponse.json(response, { status: statusCode });
    }

    // Rate limiting - 10 videos per minute
    try {
      await limiter.check(10, session.user.id);
    } catch {
      const { response, statusCode } = createErrorResponse(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        "Too many video additions. Please wait a minute.",
        429
      );
      return NextResponse.json(response, { status: statusCode });
    }

    const { videoUrl } = await req.json();

    if (!videoUrl) {
      const { response, statusCode } = createErrorResponse(
        ErrorCode.MISSING_FIELD,
        "Video URL is required",
        400
      );
      return NextResponse.json(response, { status: statusCode });
    }

    // Extract YouTube ID
    const youtubeId = extractYoutubeId(videoUrl);
    if (!youtubeId) {
      const { response, statusCode } = createErrorResponse(
        ErrorCode.INVALID_INPUT,
        "Invalid YouTube URL",
        400
      );
      return NextResponse.json(response, { status: statusCode });
    }

    // Check if video already exists for this user
    const existingVideo = await prisma.video.findFirst({
      where: {
        userId: session.user.id,
        youtubeId: youtubeId,
      },
    });

    if (existingVideo) {
      const { response, statusCode } = createErrorResponse(
        ErrorCode.ALREADY_EXISTS,
        "Video already added to your library",
        409
      );
      return NextResponse.json(response, { status: statusCode });
    }

    // Fetch video metadata
    const metadata = await fetchVideoMetadata(youtubeId);

    // Create video in database
    const video = await prisma.video.create({
      data: {
        userId: session.user.id,
        youtubeId: youtubeId,
        title: metadata.title,
        description: metadata.description,
        thumbnail: metadata.thumbnail,
        channel: metadata.channel,
        duration: metadata.duration,
      },
    });

    return NextResponse.json(video, { status: 201 });
  } catch (error: any) {
    console.error("Error adding video:", error);

    // Handle database errors FIRST (Prisma errors also have error.code)
    if (error.code?.startsWith("P")) {
      const appError = handleDatabaseError(error);
      return NextResponse.json(appError.toJSON(), { status: appError.statusCode });
    }

    // Handle known application errors
    if (error.code && error.toJSON) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }

    const { response, statusCode } = createErrorResponse(
      ErrorCode.INTERNAL_ERROR,
      error.message || "Failed to add video",
      500
    );
    return NextResponse.json(response, { status: statusCode });
  }
}
