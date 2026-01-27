import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlaylistVideos } from "@/lib/youtube";

// GET /api/playlists - Fetch user's playlists
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const playlists = await prisma.playlist.findMany({
            where: {
                userId: session.user.id,
            },
            include: {
                videos: {
                    include: {
                        video: true,
                    },
                    orderBy: {
                        position: "asc",
                    },
                },
            },
            orderBy: {
                updatedAt: "desc",
            },
        });

        // Calculate stats for each playlist
        const playlistsWithStats = playlists.map((playlist) => ({
            ...playlist,
            totalVideos: playlist.videos.length,
            completedVideos: playlist.videos.filter((pv: any) => pv.video.completed).length,
            totalDuration: playlist.videos.reduce((acc: number, pv: any) => acc + (pv.video.duration || 0), 0),
        }));

        return NextResponse.json(playlistsWithStats);
    } catch (error) {
        console.error("[PLAYLISTS_GET]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// POST /api/playlists - Create a playlist
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, youtubeId } = body;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        let newPlaylist;

        if (youtubeId) {
            // Import from YouTube
            const videos = await getPlaylistVideos(youtubeId);

            newPlaylist = await prisma.playlist.create({
                data: {
                    userId: session.user.id,
                    name,
                    description,
                },
            });

            // Add videos to database and playlist
            for (let i = 0; i < videos.length; i++) {
                const videoData: any = videos[i];

                // Upsert video (create if not exists)
                const video = await prisma.video.upsert({
                    where: {
                        userId_youtubeId: {
                            userId: session.user.id,
                            youtubeId: videoData.id,
                        },
                    },
                    create: {
                        userId: session.user.id,
                        youtubeId: videoData.id,
                        title: videoData.title,
                        description: videoData.description,
                        thumbnail: videoData.thumbnail,
                        duration: videoData.duration,
                        channel: videoData.channel,
                        inLibrary: true, // Auto-add to library
                    },
                    update: {}, // Don't update if exists
                });

                // Add to playlist
                await prisma.playlistVideo.create({
                    data: {
                        playlistId: newPlaylist.id,
                        videoId: video.id,
                        position: i,
                    },
                });
            }
        } else {
            // Create empty playlist
            newPlaylist = await prisma.playlist.create({
                data: {
                    userId: session.user.id,
                    name,
                    description,
                },
            });
        }

        // Return playlist with zero stats (initially) or calculated stats
        return NextResponse.json({
            ...newPlaylist,
            totalVideos: youtubeId ? 50 : 0, // Approx
            completedVideos: 0,
            totalDuration: 0,
        }, { status: 201 });
    } catch (error) {
        console.error("[PLAYLISTS_POST]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
