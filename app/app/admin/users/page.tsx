"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
    Users,
    Search,
    Loader2,
    ChevronLeft,
    ChevronRight,
    GraduationCap,
    Shield,
    Video,
    FileText,
    ListVideo,
    ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface UserRow {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    isIITMUser: boolean;
    role: string;
    createdAt: string;
    videosCount: number;
    notesCount: number;
    playlistsCount: number;
}

interface UsersResponse {
    users: UserRow[];
    totalCount: number;
    page: number;
    totalPages: number;
}

const FILTERS = [
    { key: "all", label: "All Users" },
    { key: "iitm", label: "IITM" },
    { key: "admin", label: "Admins" },
] as const;

export default function AdminUsersPage() {
    const { data: session } = useSession();
    const [data, setData] = useState<UsersResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<string>("all");
    const [page, setPage] = useState(1);

    const fetchUsers = useCallback(async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                search,
                filter,
            });
            const res = await fetch(`/api/admin/users?${params}`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, search, filter]);

    useEffect(() => {
        if (session) fetchUsers();
    }, [session, fetchUsers]);

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            setPage(1);
            setSearch(searchInput);
        }
    };

    const handleFilterChange = (f: string) => {
        setPage(1);
        setFilter(f);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="mb-6 animate-fade-in-up">
                <Link
                    href="/app/admin"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Overview
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">User Management</h1>
                        <p className="text-muted-foreground text-sm">
                            {data ? `${data.totalCount} total users` : "Loading..."}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Search & Filters ──────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-fade-in-up" style={{ animationDelay: "80ms", animationFillMode: "both" }}>
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        placeholder="Search by name or email... (press Enter)"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                    />
                </div>

                {/* Filter Tabs */}
                <div className="flex rounded-xl border border-border overflow-hidden bg-card flex-shrink-0">
                    {FILTERS.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => handleFilterChange(f.key)}
                            className={`px-4 py-2.5 text-sm font-medium transition-colors ${filter === f.key
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Users Table ──────────────────────────────────────────────── */}
            <div
                className="bg-card rounded-2xl border border-border overflow-hidden animate-fade-in-up"
                style={{ animationDelay: "160ms", animationFillMode: "both" }}
            >
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading users…</p>
                    </div>
                ) : !data || data.users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                            <Users className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {search ? `No users found for "${search}"` : "No users found"}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30">
                                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Joined</th>
                                        <th className="text-center px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Videos</th>
                                        <th className="text-center px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</th>
                                        <th className="text-center px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Playlists</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {data.users.map((user) => (
                                        <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                        {user.image ? (
                                                            <img src={user.image} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-sm font-semibold text-primary">
                                                                {(user.name || user.email)[0]?.toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-foreground truncate">
                                                            {user.name || "Unnamed User"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    {user.role === "ADMIN" && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-600 border border-orange-500/20">
                                                            <Shield className="w-3 h-3" />
                                                            Admin
                                                        </span>
                                                    )}
                                                    {user.isIITMUser && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                                            <GraduationCap className="w-3 h-3" />
                                                            IITM
                                                        </span>
                                                    )}
                                                    {user.role !== "ADMIN" && !user.isIITMUser && (
                                                        <span className="text-xs text-muted-foreground">User</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-muted-foreground">{formatDate(user.createdAt)}</td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="inline-flex items-center gap-1 text-sm text-foreground">
                                                    <Video className="w-3.5 h-3.5 text-muted-foreground" />
                                                    {user.videosCount}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="inline-flex items-center gap-1 text-sm text-foreground">
                                                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                                                    {user.notesCount}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="inline-flex items-center gap-1 text-sm text-foreground">
                                                    <ListVideo className="w-3.5 h-3.5 text-muted-foreground" />
                                                    {user.playlistsCount}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden divide-y divide-border">
                            {data.users.map((user) => (
                                <div key={user.id} className="p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            {user.image ? (
                                                <img src={user.image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-sm font-semibold text-primary">
                                                    {(user.name || user.email)[0]?.toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {user.name || "Unnamed User"}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        {user.role === "ADMIN" && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-600 border border-orange-500/20">
                                                <Shield className="w-3 h-3" /> Admin
                                            </span>
                                        )}
                                        {user.isIITMUser && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                                <GraduationCap className="w-3 h-3" /> IITM
                                            </span>
                                        )}
                                        <span className="text-xs text-muted-foreground ml-auto">{formatDate(user.createdAt)}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span className="inline-flex items-center gap-1"><Video className="w-3 h-3" /> {user.videosCount} videos</span>
                                        <span className="inline-flex items-center gap-1"><FileText className="w-3 h-3" /> {user.notesCount} notes</span>
                                        <span className="inline-flex items-center gap-1"><ListVideo className="w-3 h-3" /> {user.playlistsCount} playlists</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {data.totalPages > 1 && (
                            <div className="flex items-center justify-between px-5 py-4 border-t border-border">
                                <p className="text-sm text-muted-foreground">
                                    Page {data.page} of {data.totalPages} ({data.totalCount} users)
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page <= 1}
                                        className="p-2 rounded-lg border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                                        disabled={page >= data.totalPages}
                                        className="p-2 rounded-lg border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
