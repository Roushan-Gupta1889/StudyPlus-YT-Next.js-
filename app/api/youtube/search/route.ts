import { NextRequest, NextResponse } from "next/server";
import { searchVideos } from "@/lib/youtube";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

// Cache duration: 24 hours
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

// Rate limiter: 10 requests per minute per IP
const limiter = rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500, // Max 500 users per interval
});

// GET /api/youtube/search?q=query
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");

        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        // Rate limiting
        const ip = request.ip ?? request.headers.get("x-forwarded-for") ?? "anonymous";
        try {
            await limiter.check(10, ip); // 10 requests per minute
        } catch {
            return NextResponse.json(
                { error: "Rate limit exceeded. Please try again later." },
                { status: 429 }
            );
        }

        // Check database cache first
        const cachedSearch = await prisma.videoSearch.findUnique({
            where: { query: query.toLowerCase().trim() },
        });

        const now = new Date();

        // Return cached results if still valid
        if (cachedSearch && cachedSearch.expiresAt > now) {
            console.log("[YOUTUBE_SEARCH] Cache hit for:", query);
            return NextResponse.json(cachedSearch.results);
        }

        // Cache miss or expired - fetch from YouTube API
        console.log("[YOUTUBE_SEARCH] Cache miss, fetching from YouTube:", query);
        const videos = await searchVideos(query, 10);

        // Store in database cache
        const expiresAt = new Date(now.getTime() + CACHE_DURATION_MS);

        await prisma.videoSearch.upsert({
            where: { query: query.toLowerCase().trim() },
            create: {
                query: query.toLowerCase().trim(),
                results: videos as any,
                expiresAt,
            },
            update: {
                results: videos as any,
                expiresAt,
                updatedAt: now,
            },
        });

        return NextResponse.json(videos);
    } catch (error: any) {
        console.error("[YOUTUBE_SEARCH]", error);

        // Handle YouTube API quota errors specifically
        if (error.message?.includes("quota")) {
            return NextResponse.json(
                { error: "YouTube API quota exceeded. Please try again later." },
                { status: 503 }
            );
        }

        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}

// DELETE endpoint to clear expired cache (can be called by cron job)
export async function DELETE() {
    try {
        const result = await prisma.videoSearch.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        });

        return NextResponse.json({
            message: "Expired cache cleared",
            count: result.count
        });
    } catch (error) {
        console.error("[YOUTUBE_SEARCH_CLEANUP]", error);
        return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
    }
}
