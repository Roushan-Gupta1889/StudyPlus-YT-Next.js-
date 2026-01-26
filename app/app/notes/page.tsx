"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StickyNote, Trash2, Play, Loader2, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Note {
    id: string;
    content: string;
    timestamp: number;
    createdAt: string;
    video: {
        id: string;
        title: string;
        channel: string | null;
        thumbnail: string | null;
    };
}

export default function NotesPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [notes, setNotes] = useState<Note[]>([]);
    const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    useEffect(() => {
        const fetchNotes = async () => {
            try {
                setIsLoading(true);
                const res = await fetch("/api/notes");
                if (res.ok) {
                    const data = await res.json();
                    setNotes(data);
                    setFilteredNotes(data);
                }
            } catch (error) {
                console.error("Error fetching notes:", error);
                toast.error("Failed to load notes");
            } finally {
                setIsLoading(false);
            }
        };

        if (session) {
            fetchNotes();
        }
    }, [session]);

    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = notes.filter(
                (note) =>
                    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    note.video.title.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredNotes(filtered);
        } else {
            setFilteredNotes(notes);
        }
    }, [searchQuery, notes]);

    const handleDeleteNote = async (noteId: string) => {
        if (!confirm("Delete this note?")) return;

        try {
            const res = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
            if (res.ok) {
                setNotes(notes.filter((n) => n.id !== noteId));
                toast.success("Note deleted");
            }
        } catch (error) {
            console.error("Error deleting note:", error);
            toast.error("Failed to delete note");
        }
    };

    const handleNoteClick = (note: Note) => {
        router.push(`/app/watch?v=${note.video.id}&t=${note.timestamp}`);
    };

    // Group notes by video
    const notesByVideo = filteredNotes.reduce((acc, note) => {
        const videoId = note.video.id;
        if (!acc[videoId]) {
            acc[videoId] = {
                video: note.video,
                notes: [],
            };
        }
        acc[videoId].notes.push(note);
        return acc;
    }, {} as Record<string, { video: Note["video"]; notes: Note[] }>);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground mb-1">Your Notes</h1>
                <p className="text-muted-foreground">Browse all notes across your videos</p>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Empty State */}
            {notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <StickyNote className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">No Notes Yet</h2>
                    <p className="text-muted-foreground text-center mb-6 max-w-md">
                        Take notes while watching videos and they'll appear here
                    </p>
                    <Button asChild>
                        <a href="/app/watch">Watch Videos</a>
                    </Button>
                </div>
            ) : filteredNotes.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-muted-foreground">No notes found matching "{searchQuery}"</p>
                </div>
            ) : (
                /* Notes by Video */
                <div className="space-y-8">
                    {Object.values(notesByVideo).map(({ video, notes }) => (
                        <div key={video.id}>
                            {/* Video Header */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-24 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                                    {video.thumbnail ? (
                                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Play className="w-6 h-6 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-foreground line-clamp-1">{video.title}</h3>
                                    <p className="text-sm text-muted-foreground">{video.channel}</p>
                                </div>
                                <span className="text-xs text-muted-foreground">{notes.length} notes</span>
                            </div>

                            {/* Notes Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {notes.map((note) => (
                                    <Card key={note.id} className="p-4 group relative hover:shadow-card transition-all">
                                        <button
                                            onClick={() => handleNoteClick(note)}
                                            className="w-full text-left"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded">
                                                    {formatTime(note.timestamp)}
                                                </span>
                                                <span className="text-xs text-muted-foreground">{formatDate(note.createdAt)}</span>
                                            </div>
                                            <p className="text-sm text-foreground line-clamp-4">{note.content}</p>
                                        </button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteNote(note.id)}
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-6 w-6"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
