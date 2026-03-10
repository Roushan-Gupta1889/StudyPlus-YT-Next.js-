"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, BookOpen, HelpCircle, ListChecks, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";

// ==========================================
// Types
// ==========================================

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
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
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async (messageText: string) => {
        if (!messageText.trim() || isStreaming) return;

        const userMessage: ChatMessage = { role: "user", content: messageText.trim() };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput("");
        setError(null);
        setIsStreaming(true);

        // Add empty assistant message for streaming
        const assistantMessage: ChatMessage = { role: "assistant", content: "" };
        setMessages([...updatedMessages, assistantMessage]);

        try {
            const response = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: messageText.trim(),
                    history: messages, // Send previous messages (not including the new one)
                    videoContext,
                    notes,
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
            // Remove the empty assistant message on error
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
    };

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
                        <p className="text-xs text-muted-foreground">Powered by Claude</p>
                    </div>
                </div>
                {messages.length > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearChat}
                        className="text-muted-foreground hover:text-destructive"
                    >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Clear
                    </Button>
                )}
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
                            I know what you&apos;re watching. Ask questions, get summaries, or quiz yourself.
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
                        <span className="text-xs">Thinking...</span>
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
                {messages.length > 0 && (
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
                <form onSubmit={handleSubmit} className="flex items-end gap-2">
                    <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about this video..."
                        disabled={isStreaming}
                        className="min-h-[44px] max-h-[120px] resize-none text-sm"
                        rows={1}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!input.trim() || isStreaming}
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
