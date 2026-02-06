import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeNote } from "@/lib/sanitize";
import { createErrorResponse, ErrorCode } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";

// Rate limiter: 20 requests per minute per user for POST, 60 for GET
const limiter = rateLimit({
    interval: 60 * 1000,
    uniqueTokenPerInterval: 500,
});

// GET /api/videos/[id]/notes - Fetch all notes for a video
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        // ✅ FIXED: Use session.user.id instead of email for consistency
        if (!session?.user?.id) {
            const { response, statusCode } = createErrorResponse(
                ErrorCode.UNAUTHORIZED,
                "Unauthorized",
                401
            );
            return NextResponse.json(response, { status: statusCode });
        }

        // Rate limit GET requests (higher limit than POST)
        try {
            await limiter.check(60, session.user.id);
        } catch {
            const { response, statusCode } = createErrorResponse(
                ErrorCode.RATE_LIMIT_EXCEEDED,
                "Too many requests. Please slow down.",
                429
            );
            return NextResponse.json(response, { status: statusCode });
        }

        const { id } = await params;

        // ✅ ADDED: Verify video exists and belongs to user
        const video = await prisma.video.findUnique({
            where: { id },
        });

        if (!video || video.userId !== session.user.id) {
            const { response, statusCode } = createErrorResponse(
                ErrorCode.NOT_FOUND,
                "Video not found",
                404
            );
            return NextResponse.json(response, { status: statusCode });
        }

        const notes = await prisma.note.findMany({
            where: {
                videoId: id,
                userId: session.user.id,
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(notes);
    } catch (error) {
        console.error("[NOTES_GET]", error);
        const { response, statusCode } = createErrorResponse(
            ErrorCode.INTERNAL_ERROR,
            "Failed to fetch notes",
            500
        );
        return NextResponse.json(response, { status: statusCode });
    }
}

// POST /api/videos/[id]/notes - Create a new note
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        // ✅ FIXED: Use session.user.id instead of email for consistency
        if (!session?.user?.id) {
            const { response, statusCode } = createErrorResponse(
                ErrorCode.UNAUTHORIZED,
                "Unauthorized",
                401
            );
            return NextResponse.json(response, { status: statusCode });
        }

        // Rate limiting - 20 req/min for POST
        try {
            await limiter.check(20, session.user.id);
        } catch {
            const { response, statusCode } = createErrorResponse(
                ErrorCode.RATE_LIMIT_EXCEEDED,
                "Too many requests. Please slow down.",
                429
            );
            return NextResponse.json(response, { status: statusCode });
        }

        const { id } = await params;
        const { content, timestamp } = await req.json();

        // ✅ ADDED: Verify video exists and belongs to user
        const video = await prisma.video.findUnique({
            where: { id },
        });

        if (!video || video.userId !== session.user.id) {
            const { response, statusCode } = createErrorResponse(
                ErrorCode.NOT_FOUND,
                "Video not found",
                404
            );
            return NextResponse.json(response, { status: statusCode });
        }

        // Validate and sanitize content
        let sanitizedContent: string;
        try {
            sanitizedContent = sanitizeNote(content);
        } catch (error: any) {
            const { response, statusCode } = createErrorResponse(
                ErrorCode.INVALID_INPUT,
                error.message || "Invalid note content",
                400
            );
            return NextResponse.json(response, { status: statusCode });
        }

        // Validate timestamp
        if (typeof timestamp !== "number" || timestamp < 0) {
            const { response, statusCode } = createErrorResponse(
                ErrorCode.INVALID_INPUT,
                "Valid timestamp is required",
                400
            );
            return NextResponse.json(response, { status: statusCode });
        }

        const note = await prisma.note.create({
            data: {
                content: sanitizedContent,
                timestamp: Math.floor(timestamp),
                videoId: id,
                userId: session.user.id,
            },
        });

        return NextResponse.json(note);
    } catch (error) {
        console.error("[NOTES_POST]", error);
        const { response, statusCode } = createErrorResponse(
            ErrorCode.INTERNAL_ERROR,
            "Failed to create note",
            500
        );
        return NextResponse.json(response, { status: statusCode });
    }
}
