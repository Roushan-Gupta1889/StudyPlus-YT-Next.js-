"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, BookOpen, HelpCircle, ListChecks, Trash2, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import ReactMarkdown from "react-markdown";

// ==========================================
// Types
// ==========================================

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    imageUrl?: string;
}

interface VideoContext {
    title: string;
    description: string;
    channel: string;
    youtubeId: string;
}

interface NoteContext {
    content: string;
    timestamp: number;
}

interface AiChatProps {
    videoContext: VideoContext;
    notes: NoteContext[];
}

// ==========================================
// Quick Action Buttons
// ==========================================

const QUICK_ACTIONS = [
    {
        label: "Summarize",
        icon: ListChecks,
        prompt: "Please provide a clear, structured summary of this video with key takeaways and main concepts covered.",
    },
    {
        label: "Quiz Me",
        icon: HelpCircle,
        prompt: "Create a quiz with 5 questions based on the topic of this video. Include a mix of multiple choice and short answer questions. Show the answers at the end.",
    },
    {
        label: "Explain Simply",
        icon: BookOpen,
        prompt: "Explain the main concepts from this video in the simplest way possible, as if I'm a complete beginner. Use analogies and real-world examples.",
    },
];

// ==========================================
// Component
// ==========================================

export function AiChat({ videoContext, notes }: AiChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState("auto");
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Please select a valid image file (PNG, JPG, WEBP).");
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setError("Image size must be less than 2MB.");
            return;
        }

        setSelectedImage(file);
        setImagePreview(URL.createObjectURL(file));
        setError(null);
        // refocus the textarea to continue typing
        setTimeout(() => textareaRef.current?.focus(), 0);
    };

    const removeImage = () => {
        setSelectedImage(null);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const sendMessage = async (messageText: string) => {
        if (!messageText.trim() && !selectedImage || isStreaming) return;

        // Base64 conversion if an image is selected
        let base64Image: string | undefined = undefined;
        if (selectedImage) {
            try {
                base64Image = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(selectedImage);
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = (error) => reject(error);
                });
            } catch (e) {
                setError("Failed to process image.");
                return;
            }
        }

        const userMessage: ChatMessage = { 
            role: "user", 
            content: messageText.trim() || (selectedImage ? "Please analyze this image." : ""),
            imageUrl: imagePreview || undefined
        };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput("");
        setError(null);
        setIsStreaming(true);

        const currentPreview = imagePreview; // to be revoked later if needed

        // Add empty assistant message for streaming
        const assistantMessage: ChatMessage = { role: "assistant", content: "" };
        setMessages([...updatedMessages, assistantMessage]);

        // Cleanup local form state
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';

        try {
            // Strip out object URLs to avoid huge payloads
            const apiHistory = messages.map(m => ({ role: m.role, content: m.content }));

            const response = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage.content,
                    history: apiHistory,
                    videoContext,
                    notes,
                    mode: currentPreview ? "smart" : mode, // Force smart mode if image exists
                    ...(base64Image ? { image: base64Image } : {}) 
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Request failed (${response.status})`);
            }

            // Read streaming response
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new Error("No response stream");

            let fullContent = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullContent += chunk;

                // Update the assistant message with accumulated content
                setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                        role: "assistant",
                        content: fullContent,
                    };
                    return updated;
                });
            }
        } catch (err: any) {
            console.error("AI chat error:", err);
            setError(err.message || "Failed to get AI response");
            // Revert empty assistant message on failure
            setMessages(updatedMessages);
        } finally {
            setIsStreaming(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    const clearChat = () => {
        setMessages([]);
        setError(null);
        removeImage();
    };

    const currentModeLabel = selectedImage ? "🧠 Vision" : (mode === "fast" ? "⚡ Fast" : mode === "balanced" ? "⚖️ Balanced" : mode === "smart" ? "🧠 Smart" : "🤖 Auto");

    return (
        <Card className="flex flex-col h-[600px] border-border/40 shadow-xl overflow-hidden bg-background">


            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 scroll-smooth">
                {messages.length === 0 ? (
                    /* Premium Empty State */
                    <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-600/10 border border-violet-500/20 flex items-center justify-center mb-5 animate-pulse">
                            <Sparkles className="w-8 h-8 text-violet-500" />
                        </div>
                        <h3 className="text-xl font-bold tracking-tight text-foreground mb-2">
                            How can I help you study?
                        </h3>
                        <p className="text-sm text-muted-foreground mb-8 max-w-sm leading-relaxed">
                            Upload a screenshot of the video, ask questions, get instant summaries, or generate a quiz.
                        </p>

                        {/* Glossy Quick Action Buttons */}
                        <div className="flex flex-wrap gap-3 justify-center max-w-md">
                            {QUICK_ACTIONS.map((action) => (
                                <button
                                    key={action.label}
                                    onClick={() => sendMessage(action.prompt)}
                                    disabled={isStreaming}
                                    className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-full border border-border/50 bg-secondary/20 text-foreground hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-violet-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-sm"
                                >
                                    <action.icon className="w-4 h-4" />
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Chat Messages */
                    messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                        >
                            <div
                                className={`max-w-[85%] px-5 py-4 shadow-sm ${
                                    msg.role === "user"
                                        ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-2xl rounded-tr-sm"
                                        : "bg-secondary/40 border border-border/50 text-foreground rounded-2xl rounded-tl-sm backdrop-blur-sm"
                                    }`}
                            >
                                {msg.imageUrl && (
                                    <div className="mb-3 max-w-sm rounded-lg overflow-hidden shadow-md">
                                        <img src={msg.imageUrl} alt="Uploaded attachment" className="rounded-lg object-contain w-full bg-background/50 backdrop-blur-sm" />
                                    </div>
                                )}
                                {msg.role === "assistant" ? (
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed tracking-wide [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 prose-p:leading-relaxed prose-pre:bg-background/80 prose-pre:border prose-pre:border-border/50">
                                        <ReactMarkdown>{msg.content || "..."}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                )}
                            </div>
                        </div>
                    ))
                )}

                {/* Loading State */}
                {isStreaming && (
                    <div className="flex justify-start animate-in fade-in duration-300">
                       <div className="bg-secondary/40 border border-border/50 text-foreground rounded-2xl rounded-tl-sm px-5 py-4 backdrop-blur-sm shadow-sm flex items-center gap-3">
                            <div className="flex gap-1.5 items-center">
                                <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                                <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                                <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground animate-pulse">
                                {messages[messages.length-1]?.imageUrl ? "Analyzing visual data..." : "Synthesizing response..."}
                            </span>
                        </div>
                    </div>
                )}

                {/* Error Bubble */}
                {error && (
                    <div className="flex justify-center animate-in zoom-in-95 duration-300">
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium rounded-xl px-5 py-3 flex items-center gap-2 shadow-sm">
                            <X className="w-4 h-4" />
                            {error}
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} className="h-1" />
            </div>

            {/* Premium Input Dock */}
            <div className="p-4 bg-background/80 backdrop-blur-md border-t border-border/40">
                {/* Dock Top Bar (Quick Actions & Clear Chat) */}
                {messages.length > 0 && (
                    <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex flex-wrap gap-2">
                            {!imagePreview && QUICK_ACTIONS.map((action) => (
                                <button
                                    key={action.label}
                                    onClick={() => sendMessage(action.prompt)}
                                    disabled={isStreaming}
                                    className="text-[11px] font-medium px-3 py-1.5 rounded-full border border-border/50 bg-secondary/30 text-muted-foreground hover:bg-violet-500/10 hover:text-violet-500 hover:border-violet-500/30 transition-all duration-300 disabled:opacity-50 shadow-sm"
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                        
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearChat}
                            className="text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-7 px-2.5 rounded-full transition-colors flex-shrink-0"
                            title="Clear Chat"
                        >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Clear Chat
                        </Button>
                    </div>
                )}
                
                {/* Image Preview Overlay */}
                {imagePreview && (
                    <div className="mb-3 px-1 relative inline-block transition-all animate-in fade-in slide-in-from-bottom-2">
                        <div className="relative group">
                            <img src={imagePreview} alt="Preview" className="h-[80px] rounded-xl border border-border/50 shadow-md object-cover bg-secondary/30" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                                <button 
                                    type="button"
                                    onClick={removeImage}
                                    className="bg-destructive text-white rounded-full p-1.5 shadow-xl hover:scale-110 transition-transform"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="absolute -bottom-2 -left-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-semibold shadow-md flex items-center gap-1 border border-white/10">
                            <span>🧠 Vision Active</span>
                        </div>
                    </div>
                )}

                {/* Input Pill Container */}
                <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-secondary/30 border border-border/60 rounded-[24px] p-1.5 shadow-sm transition-all duration-300 focus-within:ring-2 focus-within:ring-violet-500/30 focus-within:bg-secondary/50 focus-within:shadow-md">
                    <input 
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        disabled={isStreaming || !!imagePreview}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isStreaming || !!imagePreview}
                        className="h-10 w-10 shrink-0 rounded-full hover:bg-background/80 text-muted-foreground transition-colors"
                    >
                        <Paperclip className="w-5 h-5" />
                    </Button>

                    <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={imagePreview ? "Ask about this image..." : "Ask what you want to learn..."}
                        disabled={isStreaming}
                        className="min-h-[40px] max-h-[150px] resize-none text-[15px] pt-2.5 pb-2.5 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-2 placeholder:text-muted-foreground/70"
                        rows={1}
                    />
                    
                    <div className="flex items-center gap-1.5 shrink-0 pb-1 pr-1">
                        <Select value={selectedImage ? "smart" : mode} onValueChange={setMode} disabled={isStreaming || !!selectedImage}>
                            <SelectTrigger className="h-8 text-[11px] font-medium w-[120px] bg-secondary/50 hover:bg-secondary/80 border-transparent transition-colors rounded-full px-3 focus:ring-0 focus:ring-offset-0">
                                <SelectValue placeholder="Mode" />
                            </SelectTrigger>
                            <SelectContent className="w-[150px] rounded-xl shadow-xl border-border/40" side="top">
                                <SelectItem value="fast" className="rounded-lg text-xs cursor-pointer">⚡ Fast (Groq)</SelectItem>
                                <SelectItem value="balanced" className="rounded-lg text-xs cursor-pointer">⚖️ Balanced (NVIDIA)</SelectItem>
                                <SelectItem value="smart" className="rounded-lg text-xs cursor-pointer">🧠 Smart (Gemini)</SelectItem>
                                <SelectItem value="auto" className="rounded-lg text-xs cursor-pointer">🤖 Auto (Gemini)</SelectItem>
                                <SelectItem value="claude" disabled className="rounded-lg text-xs">✨ Claude (Soon)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        type="submit"
                        size="icon"
                        disabled={(!input.trim() && !imagePreview) || isStreaming}
                        className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {isStreaming ? (
                            <Loader2 className="w-4 h-4 animate-spin text-white/80" />
                        ) : (
                            <Send className="w-4 h-4 ml-0.5" />
                        )}
                    </Button>
                </form>
            </div>
        </Card>
    );
}
