import Groq from "groq-sdk";

let client: Groq | null = null;

function getClient(): Groq {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw { status: 500, message: "GROQ_API_KEY is not set.", provider: "groq" };
    }
    if (!client) {
        client = new Groq({ apiKey });
    }
    return client;
}

function withTimeout<T>(promise: Promise<T>, ms: number = 10000): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject({ status: 408, message: "Timeout" }), ms)
        )
    ]);
}

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

export interface VideoContext {
    title: string;
    description: string;
    channel: string;
}

export interface NoteContext {
    content: string;
    timestamp: number;
}

function buildGroqSystemPrompt(video: VideoContext, notes: NoteContext[]): string {
    let prompt = `You are an AI Study Assistant embedded in StudyPlus YT.

## Current Video
- **Title:** ${video.title}
- **Channel:** ${video.channel}
- **Description:** ${video.description || "N/A"}`;

    if (notes.length > 0) {
        prompt += `\n\n## Student's Notes`;
        for (const note of notes) {
            const time = `${Math.floor(note.timestamp / 60)}:${String(note.timestamp % 60).padStart(2, "0")}`;
            prompt += `\n- [${time}] ${note.content}`;
        }
    }

    prompt += `\n\n## Response Mode: FAST
- Give short and quick answers
- Avoid long explanations
- Use 3-5 bullet points max
- Focus only on key idea
- Do NOT go deep unless asked`;

    return prompt;
}

export async function streamGroqChat(
    messages: ChatMessage[],
    video: VideoContext,
    notes: NoteContext[],
    prefixMessage?: string
): Promise<ReadableStream<Uint8Array>> {
    const groq = getClient();
    const systemPrompt = buildGroqSystemPrompt(video, notes);
    const encoder = new TextEncoder();

    let stream: any;
    try {
        stream = await withTimeout(
            groq.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    ...messages.map((m) => ({
                        role: m.role as "user" | "assistant",
                        content: m.content,
                    })),
                ],
                model: "llama-3.1-8b-instant",
                stream: true,
            }),
            10000
        );
    } catch (error: any) {
        throw { status: error.status || 500, message: error.message || "Groq connection failed", provider: "groq" };
    }

    return new ReadableStream({
        async start(controller) {
            try {
                if (prefixMessage) {
                    controller.enqueue(encoder.encode(prefixMessage));
                }
                for await (const chunk of stream) {
                    const content = chunk.choices[0]?.delta?.content || "";
                    if (content) {
                        controller.enqueue(encoder.encode(content));
                    }
                }
            } catch (error: any) {
                console.error("Groq chunk streaming error:", error);
                controller.enqueue(encoder.encode(`\n\n⚠️ Connection interrupted while streaming.`));
            } finally {
                controller.close();
            }
        },
    });
}
