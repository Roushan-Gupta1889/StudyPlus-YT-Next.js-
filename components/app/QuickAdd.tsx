"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Youtube, ListVideo, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

export function QuickAdd() {
    const router = useRouter();
    const [url, setUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"video" | "playlist">("video");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!url.trim()) {
            toast.error("Please enter a URL");
            return;
        }

        setIsLoading(true);

        try {
            const endpoint = activeTab === "video" ? "/api/videos" : "/api/playlists/add";

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(
                    activeTab === "video"
                        ? { youtubeId: url }
                        : { playlistUrl: url }
                ),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.error?.message || data?.error || "Failed to add content");
            }

            toast.success(`${activeTab === "video" ? "Video" : "Playlist"} added successfully!`);
            setUrl("");
            router.refresh(); // Refresh dashboard data

            // Redirect to respective page
            router.push(activeTab === "video" ? "/app/videos" : "/app/playlists");
        } catch (error) {
            console.error("Quick Add Error:", error);
            toast.error(error instanceof Error ? error.message : "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-card rounded-2xl border border-border p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Plus className="w-5 h-5 text-primary" />
                        Quick Add
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Paste a URL to instantly add it to your library
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full md:w-auto">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="video" className="gap-2">
                            <Youtube className="w-4 h-4" /> Video
                        </TabsTrigger>
                        <TabsTrigger value="playlist" className="gap-2">
                            <ListVideo className="w-4 h-4" /> Playlist
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <form onSubmit={handleSubmit} className="flex gap-3">
                <Input
                    placeholder={`Paste YouTube ${activeTab} URL here...`}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1"
                    disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading} className="gap-2 min-w-[100px]">
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>Add {activeTab === "video" ? "Video" : "Playlist"}</>
                    )}
                </Button>
            </form>
        </div>
    );
}
