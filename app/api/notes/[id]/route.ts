import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/notes/[id] - Delete a note
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Verify the note belongs to the user before deleting
        const note = await prisma.note.findUnique({
            where: { id },
        });

        if (!note) {
            return NextResponse.json({ error: "Note not found" }, { status: 404 });
        }

        if (note.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await prisma.note.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Note deleted" });
    } catch (error) {
        console.error("[NOTE_DELETE]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
