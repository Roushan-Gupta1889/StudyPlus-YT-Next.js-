import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { streamGroqChat } from "@/lib/groq";
import { streamNvidiaChat } from "@/lib/nvidia";
import { streamGeminiChat } from "@/lib/gemini";
import crypto from "crypto";
import { LRUCache } from "lru-cache";
import { rateLimit } from "@/lib/rate-limit";

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

// Rate limiting and Hash Cache for images
const userImageLimiter = rateLimit({
    interval: 60 * 60 * 1000, // 1 hour
    uniqueTokenPerInterval: 500,
});

let globalImageCount = 0;
let globalResetTime = Date.now() + 60 * 60 * 1000;

const imageHashCache = new LRUCache({
    max: 1000,
    ttl: 24 * 60 * 60 * 1000, // 24 hours
});

type Provider = "groq" | "nvidia" | "gemini";

export type ProviderError = {
    status: number;
    message: string;
    provider: Provider;
};

// Simple module-level usage cache for runtime diagnostics
const usageStats: Record<Provider, number> = {
    groq: 0,
    nvidia: 0,
    gemini: 0
};

async function attemptStream(
    providersToTry: Provider[],
    messages: ChatMessage[],
    videoContext: VideoContext,
    notes: NoteContext[],
    base64Data: string,
    mimeType: string,
    mode: string
): Promise<ReadableStream<Uint8Array>> {
    let lastError: any = null;

    for (let i = 0; i < providersToTry.length; i++) {
        const provider = providersToTry[i];
        
        if (provider === "groq" && process.env.DISABLE_GROQ === "true") {
            console.log(`[Switchboard] Skipping Groq (Global Killswitch Active)`);
            continue;
        }
        if (provider === "nvidia" && process.env.DISABLE_NVIDIA === "true") {
            console.log(`[Switchboard] Skipping NVIDIA (Global Killswitch Active)`);
            continue;
        }
        if (provider === "gemini" && process.env.DISABLE_GEMINI === "true") {
            console.log(`[Switchboard] Skipping Gemini (Global Killswitch Active)`);
            continue;
        }

        let attempts = 0;
        const maxAttempts = 2; // 1 initial + 1 retry

        while (attempts < maxAttempts) {
            attempts++;
            try {
                const isFallback = i > 0;
                let prefixTag = "";

                console.log("[Switchboard] Initiating Stream...", {
                    provider,
                    mode,
                    isFallback,
                    attempt: attempts,
                });

                if (provider === "groq") {
                    if (!process.env.GROQ_API_KEY) throw { status: 500, message: "GROQ_API_KEY missing" };
                    prefixTag = isFallback ? "AI • ⚡ Fast (fallback)\n\n" : "AI • ⚡ Fast\n\n";
                    
                    const res = await streamGroqChat(messages, videoContext, notes, prefixTag);
                    usageStats.groq++; 
                    console.log("[Switchboard] Success | Usage Stats:", usageStats);
                    return res;
                } else if (provider === "nvidia") {
                    if (!process.env.NVIDIA_API_KEY) throw { status: 500, message: "NVIDIA_API_KEY missing" };
                    prefixTag = isFallback ? "AI • ⚖️ Balanced (fallback)\n\n" : "AI • ⚖️ Balanced\n\n";
                    
                    const res = await streamNvidiaChat(messages, videoContext, notes, prefixTag);
                    usageStats.nvidia++;
                    console.log("[Switchboard] Success | Usage Stats:", usageStats);
                    return res;
                } else if (provider === "gemini") {
                    if (!process.env.GEMINI_API_KEY) throw { status: 500, message: "GEMINI_API_KEY missing" };
                    prefixTag = isFallback ? "AI • 🧠 Smart (fallback)\n\n" : "AI • 🧠 Smart\n\n";
                    
                    const res = await streamGeminiChat(messages, videoContext, notes, mode, base64Data, mimeType, prefixTag);
                    usageStats.gemini++;
                    console.log("[Switchboard] Success | Usage Stats:", usageStats);
                    return res;
                }
            } catch (error: any) {
                const status = error.status || 500;
                lastError = error;
                const isFallback = i > 0;

                console.log("[Switchboard] Stream Failure Detected", {
                    provider,
                    mode,
                    isFallback,
                    errorStatus: status
                });

                if (status === 401 || status === 403) {
                    throw new Error(`Authentication failed for ${provider} API. Please check your keys.`);
                }

                if (status === 429) {
                    console.warn(`[${provider}] Rate limited (429). Falling back...`);
                    break; // Move to next provider
                }

                if (attempts < maxAttempts) {
                    console.warn(`[${provider}] Connection failed (${status}). Retrying once...`);
                    continue; // Retry exact provider again
                } else {
                    console.warn(`[${provider}] Retry failed. Falling back to next provider...`);
                    break; // Exhausted retries, move to next provider
                }
            }
        }
    }

    throw new Error(`All providers failed. Last error: ${lastError?.message}`);
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { message, history, videoContext, notes, mode, image } = body as {
            message: string;
            history: ChatMessage[];
            videoContext: VideoContext;
            notes: NoteContext[];
            mode?: string;
            image?: string;
        };

        if (!message?.trim() && !image) {
            return NextResponse.json({ error: "Message or Image is required" }, { status: 400 });
        }

        if (!videoContext?.title) {
            return NextResponse.json({ error: "Video context is required" }, { status: 400 });
        }

        const messages: ChatMessage[] = [
            ...(history || []),
            { role: "user", content: message.trim() },
        ];

        let stream: ReadableStream<Uint8Array>;
        let isVisionRequest = false;
        let base64Data = "";
        let mimeType = "";

        const selectedMode = mode || "auto";

        if (image) {
            const matches = image.match(/^data:(image\/\w+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
                return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
            }
            mimeType = matches[1];
            base64Data = matches[2];
            
            if (base64Data.length > 2800000) {
                return NextResponse.json({ error: "Image size exceeds 2MB limit" }, { status: 400 });
            }
            
            if (Date.now() > globalResetTime) {
                globalImageCount = 0;
                globalResetTime = Date.now() + 60 * 60 * 1000;
            }
            if (globalImageCount >= 100) {
                return NextResponse.json({ error: "⚠️ Server busy. Try later." }, { status: 429 });
            }
            
            try {
                await userImageLimiter.check(5, session.user.id);
            } catch {
                return NextResponse.json({ error: "⚠️ Image limit reached. Max 5 per hour." }, { status: 429 });
            }
            
            const hash = crypto.createHash("sha256").update(base64Data).digest("hex");
            if (imageHashCache.has(hash)) {
                return NextResponse.json({ error: "This exact image was recently analyzed." }, { status: 400 });
            }
            imageHashCache.set(hash, true);
            
            globalImageCount++;
            isVisionRequest = true;
        }

        let providersToTry: Provider[] = [];

        if (isVisionRequest) {
            providersToTry = ["gemini"]; // Must use Gemini for Vision currently
        } else {
            if (selectedMode === "fast") {
                providersToTry = ["groq", "nvidia"];
            } else if (selectedMode === "balanced") {
                providersToTry = ["nvidia", "groq"];
            } else if (selectedMode === "smart") {
                providersToTry = ["gemini", "nvidia", "groq"];
            } else if (selectedMode === "auto") {
                const isComplex = message.length > 200 || /summarIZE|summary|quiz|explain|detail|why|how/i.test(message);
                if (isComplex) {
                    providersToTry = ["gemini", "nvidia", "groq"];
                } else {
                    providersToTry = ["nvidia", "groq", "gemini"];
                }
            }
        }

        stream = await attemptStream(
            providersToTry,
            messages,
            videoContext,
            notes || [],
            base64Data,
            mimeType,
            selectedMode
        );

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache",
                "Transfer-Encoding": "chunked",
            },
        });
    } catch (error: any) {
        console.error("AI Chat API Switchboard Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error connecting to AI provider." },
            { status: 500 }
        );
    }
}
