import OpenAI from "openai";

let client: OpenAI | null = null;

function getClient(): OpenAI {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
        throw { status: 500, message: "NVIDIA_API_KEY is not set.", provider: "nvidia" };
    }
    if (!client) {
        client = new OpenAI({
            apiKey: apiKey,
            baseURL: "https://integrate.api.nvidia.com/v1",
        });
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

function buildNvidiaSystemPrompt(video: VideoContext, notes: NoteContext[]): string {
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

    prompt += `\n\n## Response Mode: BALANCED
- Give clear and moderately detailed answers
- Use bullet points and simple structure
- Explain concepts with 1 example if helpful
- Keep response medium length`;

    return prompt;
}

export async function streamNvidiaChat(
    messages: ChatMessage[],
    video: VideoContext,
    notes: NoteContext[],
    prefixMessage?: string
): Promise<ReadableStream<Uint8Array>> {
    const openai = getClient();
    const systemPrompt = buildNvidiaSystemPrompt(video, notes);
    const encoder = new TextEncoder();

    const modelsToTry = [
        "meta/llama-4-maverick-17b-128e-instruct",
        "deepseek-ai/deepseek-r1",
        "meta/llama-3.1-70b-instruct"
    ];
    let stream: any = null;
    let lastError: any = null;

    for (const model of modelsToTry) {
        try {
            stream = await withTimeout(
                openai.chat.completions.create({
                    messages: [
                        { role: "system", content: systemPrompt },
                        ...messages.map((m) => ({
                            role: m.role as "user" | "assistant",
                            content: m.content,
                        })),
                    ],
                    model: model,
                    stream: true,
                    max_tokens: 1024,
                }),
                10000
            );
            break; 
        } catch (error: any) {
            // Log fallback attempt silently
            lastError = { status: error.status || 500, message: error.message, provider: "nvidia" };
            stream = null;
        }
    }

    if (!stream) {
        // If all 3 nested fallbacks fail, throw standardized error upward to unified router
        throw lastError || { status: 500, message: "NVIDIA API unavailable", provider: "nvidia" };
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
                console.error("NVIDIA chunk streaming error:", error);
                controller.enqueue(encoder.encode(`\n\n⚠️ Connection interrupted while streaming.`));
            } finally {
                controller.close();
            }
        },
    });
}
