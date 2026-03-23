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
        <Card className="flex flex-col h-[500px]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">AI Study Assistant</h3>
                        <p className="text-xs text-muted-foreground">Powered by Claude & Gemini</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <Select value={selectedImage ? "smart" : mode} onValueChange={setMode} disabled={isStreaming || !!selectedImage}>
                        <SelectTrigger className="h-7 text-xs w-[140px] bg-transparent border-border">
                            <SelectValue placeholder="Mode" />
                        </SelectTrigger>
                        <SelectContent className="w-[180px]">
                            <SelectItem value="fast">⚡ Fast (Groq)</SelectItem>
                            <SelectItem value="balanced">⚖️ Balanced (NVIDIA)</SelectItem>
                            <SelectItem value="smart">🧠 Smart (Gemini)</SelectItem>
                            <SelectItem value="auto">🤖 Auto (Gemini)</SelectItem>
                            <SelectItem value="claude" disabled>✨ Claude (Coming Soon)</SelectItem>
                        </SelectContent>
                    </Select>

                    {messages.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearChat}
                            className="text-muted-foreground hover:text-destructive h-7 px-2"
                        >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {messages.length === 0 ? (
                    /* Empty State with Quick Actions */
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-600/20 flex items-center justify-center mb-4">
                            <Sparkles className="w-7 h-7 text-violet-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                            Ask me anything
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                            Drop a screenshot, ask questions, get summaries, or quiz yourself.
                        </p>

                        {/* Quick Action Buttons */}
                        <div className="flex flex-wrap gap-2 justify-center">
                            {QUICK_ACTIONS.map((action) => (
                                <Button
                                    key={action.label}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => sendMessage(action.prompt)}
                                    disabled={isStreaming}
                                    className="gap-1.5 text-xs"
                                >
                                    <action.icon className="w-3.5 h-3.5" />
                                    {action.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Chat Messages */
                    messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === "user"
                                        ? "bg-primary text-primary-foreground rounded-br-md"
                                        : "bg-muted text-foreground rounded-bl-md"
                                    }`}
                            >
                                {msg.imageUrl && (
                                    <div className="mb-2 max-w-sm rounded overflow-hidden">
                                        <img src={msg.imageUrl} alt="Uploaded attachment" className="rounded border border-primary-foreground/20 object-contain w-full" />
                                    </div>
                                )}
                                {msg.role === "assistant" ? (
                                    <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                                        <ReactMarkdown>{msg.content || "..."}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                )}
                            </div>
                        </div>
                    ))
                )}

                {/* Streaming indicator */}
                {isStreaming && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span className="text-xs">
                            {messages[messages.length-1]?.imageUrl ? "🧠 Analyzing image..." : "Thinking..."}
                        </span>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-3">
                        ⚠️ {error}
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-border p-4">
                {messages.length > 0 && !imagePreview && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {QUICK_ACTIONS.map((action) => (
                            <button
                                key={action.label}
                                onClick={() => sendMessage(action.prompt)}
                                disabled={isStreaming}
                                className="text-[11px] px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}
                
                {imagePreview && (
                    <div className="mb-3 relative inline-block transition-all animate-in fade-in slide-in-from-bottom-2">
                        <img src={imagePreview} alt="Preview" className="h-[72px] rounded-lg border shadow-sm object-cover bg-background" />
                        <button 
                            type="button"
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow-md hover:scale-105 transition-transform"
                        >
                            <X className="w-3 h-3" />
                        </button>
                        <div className="absolute -bottom-2 -left-2 bg-violet-600 border-border text-white text-[10px] px-2 py-0.5 rounded-full font-medium shadow-sm flex items-center gap-1">
                            <span>🧠 Vision Mode</span>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex items-end gap-2 relative">
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
                        variant="outline"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isStreaming || !!imagePreview}
                        className="h-[44px] w-[44px] flex-shrink-0 bg-transparent"
                    >
                        <Paperclip className="w-4 h-4 text-muted-foreground" />
                    </Button>

                    <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={imagePreview ? "Ask about this image..." : "Ask about this video..."}
                        disabled={isStreaming}
                        className="min-h-[44px] max-h-[120px] resize-none text-sm py-3"
                        rows={1}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={(!input.trim() && !imagePreview) || isStreaming}
                        className="h-[44px] w-[44px] flex-shrink-0"
                    >
                        {isStreaming ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </form>
            </div>
        </Card>
    );
}
