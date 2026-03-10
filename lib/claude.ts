/**
 * Claude AI Client Library
 * 
 * Provides streaming chat completions via Anthropic's Claude API.
 * Used by the AI Study Assistant on the watch page.
 */

import Anthropic from "@anthropic-ai/sdk";

// Lazy client initialization
let client: Anthropic | null = null;

function getClient(): Anthropic {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        throw new Error(
            "ANTHROPIC_API_KEY is not set. Please add it to your .env file to enable AI features."
        );
    }
    if (!client) {
        client = new Anthropic({ apiKey });
    }
    return client;
}

// ==========================================
// Types
// ==========================================

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

export interface VideoContext {
    title: string;
    description: string;
    channel: string;
    youtubeId: string;
}

export interface NoteContext {
    content: string;
    timestamp: number;
}

// ==========================================
// System Prompt Builder
// ==========================================

function buildSystemPrompt(
    video: VideoContext,
    notes: NoteContext[]
): string {
    let prompt = `You are an AI Study Assistant embedded in StudyPlus YT, a focused learning platform. You are helping a student who is currently watching a YouTube video.

## Your Role
- Help the student understand concepts from the video
- Answer questions about the topic
- Provide explanations, examples, and analogies
- Generate quizzes and practice questions when asked
- Summarize content clearly and concisely
- Be encouraging and supportive

## Current Video Context
- **Title:** ${video.title}
- **Channel:** ${video.channel}
- **Description:** ${video.description || "No description available"}`;

    if (notes.length > 0) {
        prompt += `\n\n## Student's Notes on This Video`;
        for (const note of notes) {
            const mins = Math.floor(note.timestamp / 60);
            const secs = note.timestamp % 60;
            const time = `${mins}:${String(secs).padStart(2, "0")}`;
            prompt += `\n- [${time}] ${note.content}`;
        }
    }

    prompt += `\n\n## Guidelines
- Keep responses concise but thorough
- Use markdown formatting (headers, bold, lists, code blocks) for readability
- When explaining concepts, relate them back to the video content when possible
- If asked to quiz, create 3-5 multiple choice or short answer questions
- If asked to summarize, provide a structured summary with key takeaways
- If you don't know something specific about the video content, be honest about it and provide general knowledge on the topic instead`;

    return prompt;
}

// ==========================================
// Streaming Chat
// ==========================================

/**
 * Create a streaming chat completion with Claude.
 * Returns a ReadableStream that emits text chunks.
 */
export async function streamChat(
    messages: ChatMessage[],
    video: VideoContext,
    notes: NoteContext[]
): Promise<ReadableStream<Uint8Array>> {
    const anthropic = getClient();
    const systemPrompt = buildSystemPrompt(video, notes);

    const encoder = new TextEncoder();

    return new ReadableStream({
        async start(controller) {
            try {
                const stream = anthropic.messages.stream({
                    model: "claude-sonnet-4-20250514",
                    max_tokens: 2048,
                    system: systemPrompt,
                    messages: messages.map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                });

                for await (const event of stream) {
                    if (
                        event.type === "content_block_delta" &&
                        event.delta.type === "text_delta"
                    ) {
                        const chunk = encoder.encode(event.delta.text);
                        controller.enqueue(chunk);
                    }
                }

                controller.close();
            } catch (error: any) {
                console.error("Claude streaming error:", error);

                // Send error message as text
                const errorMsg =
                    error?.status === 401
                        ? "Invalid API key. Please check your ANTHROPIC_API_KEY."
                        : error?.status === 429
                            ? "Rate limit exceeded. Please wait a moment and try again."
                            : error?.status === 529
                                ? "Claude is currently overloaded. Please try again shortly."
                                : "An error occurred while generating a response. Please try again.";

                controller.enqueue(encoder.encode(`\n\n⚠️ ${errorMsg}`));
                controller.close();
            }
        },
    });
}
