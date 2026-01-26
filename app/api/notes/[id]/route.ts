import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/notes/[id] - Update note
export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { content } = body;

        const note = await prisma.note.findUnique({
            where: {
                id: params.id,
            },
        });

        if (!note || note.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const updatedNote = await prisma.note.update({
            where: {
                id: params.id,
            },
            data: {
                content,
            },
        });

        return NextResponse.json(updatedNote);
    } catch (error) {
        console.error("[NOTE_PATCH]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// DELETE /api/notes/[id] - Delete note
export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const note = await prisma.note.findUnique({
            where: {
                id: params.id,
            },
        });

        if (!note || note.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        await prisma.note.delete({
            where: {
                id: params.id,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[NOTE_DELETE]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
