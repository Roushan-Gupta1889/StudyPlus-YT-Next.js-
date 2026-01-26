import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Parse ISO 8601 duration to seconds
function parseDuration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;

  const hours = (parseInt(match[1]) || 0) * 3600;
  const minutes = (parseInt(match[2]) || 0) * 60;
  const seconds = parseInt(match[3]) || 0;

  return hours + minutes + seconds;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "YouTube API key not configured" },
        { status: 500 }
      );
    }

    // Find all videos with 0 duration for this user
    const videosWithoutDuration = await prisma.video.findMany({
      where: {
        userId: session.user.id,
        duration: 0,
      },
    });

    if (videosWithoutDuration.length === 0) {
      return NextResponse.json({
        message: "No videos need duration update",
        updated: 0,
      });
    }

    let updated = 0;

    // Fetch durations in chunks of 50
    for (let i = 0; i < videosWithoutDuration.length; i += 50) {
      const chunk = videosWithoutDuration.slice(i, i + 50);
      const videoIds = chunk.map((v) => v.youtubeId);

      try {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds.join(
            ","
          )}&key=${apiKey}`
        );

        if (!response.ok) {
          console.error("Failed to fetch video details from YouTube");
          continue;
        }

        const data: any = await response.json();

        if (data.items) {
          for (const item of data.items) {
            const duration = parseDuration(item.contentDetails.duration);
            const video = chunk.find((v) => v.youtubeId === item.id);

            if (video) {
              await prisma.video.update({
                where: { id: video.id },
                data: { duration },
              });
              updated++;
            }
          }
        }
      } catch (error) {
        console.error("Error fetching chunk of videos:", error);
      }
    }

    return NextResponse.json({
      message: "Duration update complete",
      updated,
      total: videosWithoutDuration.length,
    });
  } catch (error) {
    console.error("[UPDATE_DURATIONS]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
