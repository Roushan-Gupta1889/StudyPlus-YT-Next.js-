"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { User, Bell, Keyboard, Moon, Shield, LogOut, Loader2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface UserPreferences {
    dailyReminders: boolean;
    weeklyReports: boolean;
    newFeatures: boolean;
}

export default function SettingsPage() {
    const { data: session, update: updateSession } = useSession();
    const { theme, setTheme } = useTheme();

    // Profile state
    const [name, setName] = useState("");
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Preferences state
    const [preferences, setPreferences] = useState<UserPreferences>({
        dailyReminders: true,
        weeklyReports: true,
        newFeatures: false,
    });
    const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);

    // Theme mounted state (avoid hydration mismatch)
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Load user name from session
    useEffect(() => {
        if (session?.user?.name) {
            setName(session.user.name);
        }
    }, [session]);

    // Load user preferences
    useEffect(() => {
        const fetchPreferences = async () => {
            try {
                const res = await fetch("/api/user/preferences");
                if (res.ok) {
                    const data = await res.json();
                    setPreferences({
                        dailyReminders: data.dailyReminders,
                        weeklyReports: data.weeklyReports,
                        newFeatures: data.newFeatures,
                    });
                }
            } catch (error) {
                console.error("Failed to load preferences:", error);
            } finally {
                setIsLoadingPreferences(false);
            }
        };

        if (session) {
            fetchPreferences();
        }
    }, [session]);

    const handleSaveProfile = async () => {
        if (!name.trim()) {
            toast.error("Name cannot be empty");
            return;
        }

        setIsSavingProfile(true);
        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim() }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update profile");
            }

            // Update session with new name
            await updateSession({ name: name.trim() });
            toast.success("Profile updated successfully!");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update profile");
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handlePreferenceChange = async (key: keyof UserPreferences, value: boolean) => {
        // Optimistic update
        setPreferences(prev => ({ ...prev, [key]: value }));

        try {
            const res = await fetch("/api/user/preferences", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [key]: value }),
            });

            if (!res.ok) {
                // Revert on error
                setPreferences(prev => ({ ...prev, [key]: !value }));
                throw new Error("Failed to update preference");
            }

            toast.success("Preference updated");
        } catch (error) {
            toast.error("Failed to update preference");
        }
    };

    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/" });
    };

    if (!session) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground mb-1">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your account and preferences
                </p>
            </div>

            {/* Profile Section */}
            <Card className="p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                    <User className="w-5 h-5 text-foreground" />
                    <h2 className="text-lg font-semibold text-foreground">Profile</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="name">Display Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1.5"
                            placeholder="Enter your name"
                        />
                    </div>
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={session.user.email || ""}
                            className="mt-1.5"
                            disabled
                        />
                        <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                    </div>
                    {session.user.isIITMUser && (
                        <div className="flex items-center gap-2 text-sm text-primary">
                            <Shield className="w-4 h-4" />
                            <span>IITM Verified Account</span>
                        </div>
                    )}
                    <Button
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile || name === session.user.name}
                    >
                        {isSavingProfile ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </div>
            </Card>

            {/* Notifications */}
            <Card className="p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                    <Bell className="w-5 h-5 text-foreground" />
                    <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
                </div>

                {isLoadingPreferences ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-foreground">Daily Reminders</p>
                                <p className="text-sm text-muted-foreground">Get reminded to continue learning</p>
                            </div>
                            <Switch
                                checked={preferences.dailyReminders}
                                onCheckedChange={(checked) => handlePreferenceChange("dailyReminders", checked)}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-foreground">Weekly Reports</p>
                                <p className="text-sm text-muted-foreground">Receive your weekly progress summary</p>
                            </div>
                            <Switch
                                checked={preferences.weeklyReports}
                                onCheckedChange={(checked) => handlePreferenceChange("weeklyReports", checked)}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-foreground">New Features</p>
                                <p className="text-sm text-muted-foreground">Be notified about new StudyPlus features</p>
                            </div>
                            <Switch
                                checked={preferences.newFeatures}
                                onCheckedChange={(checked) => handlePreferenceChange("newFeatures", checked)}
                            />
                        </div>
                    </div>
                )}
            </Card>

            {/* Appearance */}
            <Card className="p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                    <Moon className="w-5 h-5 text-foreground" />
                    <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-foreground">Dark Mode</p>
                            <p className="text-sm text-muted-foreground">Toggle between light and dark themes</p>
                        </div>
                        {mounted && (
                            <Switch
                                checked={theme === "dark"}
                                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                            />
                        )}
                    </div>
                </div>
            </Card>

            {/* Keyboard Shortcuts */}
            <Card className="p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                    <Keyboard className="w-5 h-5 text-foreground" />
                    <h2 className="text-lg font-semibold text-foreground">Keyboard Shortcuts</h2>
                </div>

                <div className="space-y-3 text-sm">
                    {[
                        { keys: ["Space"], action: "Play/Pause video" },
                        { keys: ["→"], action: "Skip forward 5s" },
                        { keys: ["←"], action: "Skip backward 5s" },
                        { keys: ["Ctrl", "N"], action: "Add timestamp note" },
                        { keys: ["Ctrl", "K"], action: "Search videos" },
                    ].map((shortcut, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <span className="text-foreground">{shortcut.action}</span>
                            <div className="flex items-center gap-1">
                                {shortcut.keys.map((key, j) => (
                                    <kbd
                                        key={j}
                                        className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs font-mono"
                                    >
                                        {key}
                                    </kbd>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Privacy & Security */}
            <Card className="p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                    <Shield className="w-5 h-5 text-foreground" />
                    <h2 className="text-lg font-semibold text-foreground">Privacy & Security</h2>
                </div>

                <div className="space-y-3">
                    <Button
                        variant="outline"
                        className="w-full justify-start"
                        disabled
                    >
                        Export My Data
                        <span className="ml-auto text-xs text-muted-foreground">Coming soon</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full justify-start"
                        disabled
                    >
                        Change Password
                        <span className="ml-auto text-xs text-muted-foreground">Coming soon</span>
                    </Button>
                    <Button
                        variant="destructive"
                        className="w-full justify-start"
                        onClick={handleSignOut}
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                    </Button>
                </div>
            </Card>
        </div>
    );
}
