import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const response: Response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch video metadata");
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
}

// Parse ISO 8601 duration to seconds
function parseDuration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;

  const hours = (parseInt(match[1]) || 0) * 3600;
  const minutes = (parseInt(match[2]) || 0) * 60;
  const seconds = parseInt(match[3]) || 0;

  return hours + minutes + seconds;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { videoUrl } = await req.json();

    if (!videoUrl) {
      return NextResponse.json(
        { error: "Video URL is required" },
        { status: 400 }
      );
    }

    // Extract YouTube ID
    const youtubeId = extractYoutubeId(videoUrl);
    if (!youtubeId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if video already exists for this user
    const existingVideo = await prisma.video.findFirst({
      where: {
        userId: user.id,
        youtubeId: youtubeId,
      },
    });

    if (existingVideo) {
      return NextResponse.json(
        { error: "Video already added" },
        { status: 400 }
      );
    }

    // Fetch video metadata
    const metadata = await fetchVideoMetadata(youtubeId);

    // Create video in database
    const video = await prisma.video.create({
      data: {
        userId: user.id,
        youtubeId: youtubeId,
        title: metadata.title,
        description: metadata.description,
        thumbnail: metadata.thumbnail,
        channel: metadata.channel,
        duration: metadata.duration,
      },
    });

    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    console.error("Error adding video:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    );
  }
}
