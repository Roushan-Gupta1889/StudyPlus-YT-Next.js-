import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

function getGenAIClient(): GoogleGenerativeAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw { status: 500, message: "GEMINI_API_KEY is not set.", provider: "gemini" };
    }
    if (!genAI) {
        genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI;
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

function buildGeminiSystemPrompt(video: VideoContext, notes: NoteContext[], mode: string, hasImage: boolean): string {
    let prompt = `You are an AI Study Assistant embedded in StudyPlus YT.

## Current Video Context
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

    prompt += `\n\n## Guidelines
- Keep responses concise but thorough
- Use markdown formatting (headers, bold, lists, code blocks) for readability
- When explaining concepts, relate them back to the video content when possible
- If you don't know something specific about the video content, be honest about it`;

    let modePrompt = "";
    if (mode === "smart") {
        modePrompt = `## Response Mode: SMART
- Give deep, step-by-step explanations
- Use examples, analogies, and breakdowns
- Connect concepts to real-world understanding
- Provide structured answers (headings + sections)
- If useful, expand beyond video for better clarity`;
    } else {
        modePrompt = `## Response Mode: AUTO
- If question is short/simple → answer briefly
- If question is complex → explain step-by-step
- If user asks "quiz" → generate questions
- If user asks "summarize" → give structured summary
- Adapt response depth based on user intent`;
    }

    if (hasImage) {
        modePrompt += `\n\n## Vision Instructions
If an image is provided, analyze it carefully and explain clearly. Combine image understanding with the user's question to provide the best possible teaching response.`;
    }

    return prompt + "\n\n" + modePrompt;
}

export async function streamGeminiChat(
    messages: ChatMessage[],
    video: VideoContext,
    notes: NoteContext[],
    mode: string = "auto",
    base64Image?: string,
    mimeType?: string,
    prefixMessage?: string
): Promise<ReadableStream<Uint8Array>> {
    const client = getGenAIClient();
    const hasImage = !!base64Image;
    const systemPrompt = buildGeminiSystemPrompt(video, notes, mode, hasImage);

    const history = messages.slice(0, -1).map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
    }));
    
    const lastMessage = messages[messages.length - 1];

    const model = client.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: systemPrompt
    });

    const chat = model.startChat({ history });

    const parts: any[] = [lastMessage.content];
    if (base64Image && mimeType) {
        parts.push({
            inlineData: { data: base64Image, mimeType: mimeType }
        });
    }

    const encoder = new TextEncoder();
    
    let result: any;
    try {
        result = await withTimeout(chat.sendMessageStream(parts), 10000);
    } catch (error: any) {
        throw { status: error.status || 500, message: error.message || "Gemini connection failed", provider: "gemini" };
    }

    return new ReadableStream({
        async start(controller) {
            try {
                if (prefixMessage) {
                    controller.enqueue(encoder.encode(prefixMessage));
                }
                for await (const chunk of result.stream) {
                    controller.enqueue(encoder.encode(chunk.text()));
                }
            } catch (error: any) {
                console.error("Gemini chunk streaming error:", error);
                controller.enqueue(encoder.encode(`\n\n⚠️ Connection interrupted while streaming.`));
            } finally {
                controller.close();
            }
        }
    });
}
