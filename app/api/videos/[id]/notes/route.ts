import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/videos/[id]/notes - Fetch all notes for a video
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

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
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// POST /api/videos/[id]/notes - Create a new note
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { content, timestamp } = await req.json();

        if (!content?.trim()) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        if (typeof timestamp !== "number" || timestamp < 0) {
            return NextResponse.json({ error: "Valid timestamp is required" }, { status: 400 });
        }

        const note = await prisma.note.create({
            data: {
                content: content.trim(),
                timestamp,
                videoId: id,
                userId: session.user.id,
            },
        });

        return NextResponse.json(note);
    } catch (error) {
        console.error("[NOTES_POST]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
