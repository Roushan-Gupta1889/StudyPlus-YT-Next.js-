import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { streamChat, ChatMessage, VideoContext, NoteContext } from "@/lib/claude";

export async function POST(request: Request) {
    try {
        // Auth check
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check API key availability
        if (!process.env.ANTHROPIC_API_KEY) {
            return NextResponse.json(
                { error: "AI features are not configured. Please add ANTHROPIC_API_KEY to your environment." },
                { status: 503 }
            );
        }

        const body = await request.json();
        const { message, history, videoContext, notes } = body as {
            message: string;
            history: ChatMessage[];
            videoContext: VideoContext;
            notes: NoteContext[];
        };

        // Validate required fields
        if (!message?.trim()) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        if (!videoContext?.title) {
            return NextResponse.json({ error: "Video context is required" }, { status: 400 });
        }

        // Build messages array: history + new user message
        const messages: ChatMessage[] = [
            ...(history || []),
            { role: "user", content: message.trim() },
        ];

        // Get streaming response from Claude
        const stream = await streamChat(messages, videoContext, notes || []);

        // Return as streaming response
        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache",
                "Transfer-Encoding": "chunked",
            },
        });
    } catch (error: any) {
        console.error("AI Chat API error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
