import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BATCH_SIZE = 25;

interface RawVideo {
  youtubeId: string;
  title: string;
  description: string;
  thumbnail: string;
  channel: string;
}

function parseDuration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;
  const hours = match[1] ? parseInt(match[1].replace("H", ""), 10) * 3600 : 0;
  const minutes = match[2] ? parseInt(match[2].replace("M", ""), 10) * 60 : 0;
  const seconds = match[3] ? parseInt(match[3].replace("S", ""), 10) : 0;
  return hours + minutes + seconds;
}

async function fetchNextBatch(youtubePlaylistId: string, pageToken: string) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YouTube API key not configured");

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${youtubePlaylistId}&maxResults=${BATCH_SIZE}&pageToken=${pageToken}&key=${apiKey}`
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`YouTube API error ${response.status}: ${JSON.stringify(err)}`);
  }

  const data: any = await response.json();
  const videos = (data.items || []).map((item: any) => ({
    youtubeId: item.contentDetails.videoId,
    title: item.snippet.title,
    description: item.snippet.description || "",
    thumbnail:
      item.snippet.thumbnails?.high?.url ||
      item.snippet.thumbnails?.default?.url ||
      "",
    channel: item.snippet.channelTitle,
  }));

  return { videos, nextPageToken: data.nextPageToken as string | undefined };
}

async function fetchVideoDetails(videoIds: string[]) {
  const apiKey = process.env.YOUTUBE_API_KEY!;
  const durations: Record<string, number> = {};

  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50);
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${chunk.join(",")}&key=${apiKey}`
    );
    if (!res.ok) continue;
    const data: any = await res.json();
    for (const item of data.items || []) {
      durations[item.id] = parseDuration(item.contentDetails.duration);
    }
  }

  return durations;
}

// POST /api/playlists/[id]/load-more
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: playlistId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the playlist (must belong to the user)
    const playlist = await prisma.playlist.findFirst({
      where: { id: playlistId, userId: session.user.id },
      include: {
        videos: { select: { video: { select: { youtubeId: true } } } },
      },
    });

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    if (!playlist.youtubePlaylistId || !playlist.nextPageToken) {
      return NextResponse.json(
        { error: "No more videos to load", hasMore: false },
        { status: 200 }
      );
    }

    // Get current max position in the playlist
    const maxPositionRow = await prisma.playlistVideo.aggregate({
      where: { playlistId },
      _max: { position: true },
    });
    let nextPosition = (maxPositionRow._max.position ?? -1) + 1;

    // Existing YouTube IDs already in this playlist (to avoid dupes)
    const existingYoutubeIds = new Set(
      playlist.videos.map((pv: any) => pv.video.youtubeId)
    );

    // Fetch next batch from YouTube
    const { videos: rawVideos, nextPageToken: newNextPageToken } =
      await fetchNextBatch(playlist.youtubePlaylistId, playlist.nextPageToken);

    // Filter out already-imported videos
    const newVideos = rawVideos.filter(
      (v: RawVideo) => !existingYoutubeIds.has(v.youtubeId)
    );

    if (newVideos.length === 0) {
      // Update the token even if all were dupes
      await prisma.playlist.update({
        where: { id: playlistId },
        data: { nextPageToken: newNextPageToken || null },
      });
      return NextResponse.json({
        addedCount: 0,
        hasMore: !!newNextPageToken,
        videos: [],
      });
    }

    // Fetch durations
    const videoIds = newVideos.map((v: RawVideo) => v.youtubeId);
    const durations = await fetchVideoDetails(videoIds);

    // Upsert videos and link to playlist in a transaction
    const addedVideos = await prisma.$transaction(
      async (tx) => {
        const results = [];

        for (const videoData of newVideos) {
          // Find or create the Video record for this user
          let video = await tx.video.findFirst({
            where: { userId: session.user.id, youtubeId: videoData.youtubeId },
          });

          if (!video) {
            video = await tx.video.create({
              data: {
                userId: session.user.id,
                youtubeId: videoData.youtubeId,
                title: videoData.title,
                description: videoData.description,
                thumbnail: videoData.thumbnail,
                channel: videoData.channel,
                duration: durations[videoData.youtubeId] || 0,
              },
            });
          }

          // Link to playlist (skip if already linked)
          const existing = await tx.playlistVideo.findUnique({
            where: { playlistId_videoId: { playlistId, videoId: video.id } },
          });

          if (!existing) {
            await tx.playlistVideo.create({
              data: { playlistId, videoId: video.id, position: nextPosition++ },
            });
            results.push({
              id: video.id,
              youtubeId: video.youtubeId,
              title: video.title,
              duration: video.duration ?? 0,
              completed: video.completed,
              channel: video.channel ?? "",
            });
          }
        }

        // Update the playlist's nextPageToken
        await tx.playlist.update({
          where: { id: playlistId },
          data: { nextPageToken: newNextPageToken || null },
        });

        return results;
      },
      { maxWait: 5000, timeout: 30000 }
    );

    return NextResponse.json({
      addedCount: addedVideos.length,
      hasMore: !!newNextPageToken,
      videos: addedVideos,
    });
  } catch (error: any) {
    console.error("[PLAYLIST_LOAD_MORE]", error);
    return NextResponse.json(
      { error: error.message || "Failed to load more videos" },
      { status: 500 }
    );
  }
}
