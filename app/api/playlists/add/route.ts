import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

// Fetch playlist videos from YouTube API
async function fetchPlaylistVideos(playlistId: string) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YouTube API key not configured");
  }

  const videos = [];
  let nextPageToken = undefined;

  // Fetch up to 3 pages (150 videos max)
  for (let page = 0; page < 3; page++) {
    const response: Response = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50&pageToken=${nextPageToken || ""}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch playlist");
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
        thumbnail: item.snippet.thumbnails.high.url,
        channel: item.snippet.channelTitle,
      });
    }

    nextPageToken = data.nextPageToken;
    if (!nextPageToken) break;
  }

  return videos;
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

// Fetch video details including duration
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
      console.error("Failed to fetch video details");
      continue;
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

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { playlistUrl, playlistName } = await req.json();

    if (!playlistUrl) {
      return NextResponse.json(
        { error: "Playlist URL is required" },
        { status: 400 }
      );
    }

    // Extract playlist ID
    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      return NextResponse.json(
        { error: "Invalid YouTube playlist URL" },
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

    // Fetch playlist videos from YouTube
    const playlistVideos = await fetchPlaylistVideos(playlistId);

    if (playlistVideos.length === 0) {
      return NextResponse.json(
        { error: "Playlist is empty or not accessible" },
        { status: 400 }
      );
    }

    // Fetch video durations
    const videoIds = playlistVideos.map((v) => v.youtubeId);
    const videoDetails = await fetchVideoDetails(videoIds);

    // Create playlist in database
    const playlist = await prisma.playlist.create({
      data: {
        userId: user.id,
        name: playlistName || `Playlist - ${new Date().toLocaleDateString()}`,
        description: `Imported from YouTube - ${playlistId}`,
      },
    });

    // Add videos to playlist (limit to 50)
    const videoRecordIds = [];
    for (let i = 0; i < Math.min(playlistVideos.length, 50); i++) {
      const videoData = playlistVideos[i];
      const duration = videoDetails[videoData.youtubeId] || 0;

      // Check if video already exists for this user
      let video = await prisma.video.findFirst({
        where: {
          userId: user.id,
          youtubeId: videoData.youtubeId,
        },
      });

      // If not, create it
      if (!video) {
        video = await prisma.video.create({
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

    // Create playlist video relationships
    for (let position = 0; position < videoRecordIds.length; position++) {
      await prisma.playlistVideo.create({
        data: {
          playlistId: playlist.id,
          videoId: videoRecordIds[position],
          position: position,
        },
      });
    }

    return NextResponse.json(
      {
        playlist,
        videosAdded: videoRecordIds.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding playlist:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    );
  }
}
