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
    notes: NoteContext[],
    mode: string = "auto"
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
- If you don't know something specific about the video content, be honest about it and provide general knowledge on the topic instead`;

    let modePrompt = "";
    if (mode === "fast") {
        modePrompt = `## Response Mode: FAST\n- Give short and quick answers\n- Avoid long explanations\n- Use 3-5 bullet points max\n- Focus only on key idea\n- Do NOT go deep unless asked`;
    } else if (mode === "balanced") {
        modePrompt = `## Response Mode: BALANCED\n- Give clear and moderately detailed answers\n- Use bullet points and simple structure\n- Explain concepts with 1 example if helpful\n- Keep response medium length`;
    } else if (mode === "smart") {
        modePrompt = `## Response Mode: SMART\n- Give deep, step-by-step explanations\n- Use examples, analogies, and breakdowns\n- Connect concepts to real-world understanding\n- Provide structured answers (headings + sections)\n- If useful, expand beyond video for better clarity`;
    } else {
        modePrompt = `## Response Mode: AUTO\n- If question is short/simple → answer briefly\n- If question is complex → explain step-by-step\n- If user asks "quiz" → generate questions\n- If user asks "summarize" → give structured summary\n- Adapt response depth based on user intent`;
    }

    return prompt + "\n\n" + modePrompt;
}

// ==========================================
// Streaming Chat
// ==========================================

export async function streamChat(
    messages: ChatMessage[],
    video: VideoContext,
    notes: NoteContext[],
    mode: string = "auto"
): Promise<ReadableStream<Uint8Array>> {
    const anthropic = getClient();
    const systemPrompt = buildSystemPrompt(video, notes, mode);

    const encoder = new TextEncoder();

    return new ReadableStream({
        async start(controller) {
            try {
                const stream = anthropic.messages.stream({
                    model: "claude-3-5-sonnet-20240620",
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
