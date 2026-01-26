"use client";

import { User, Bell, Keyboard, Moon, Shield, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/" });
    };

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
                        <Input id="name" defaultValue="Learner" className="mt-1.5" />
                    </div>
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" defaultValue="learner@example.com" className="mt-1.5" disabled />
                        <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                    </div>
                    <Button>Save Changes</Button>
                </div>
            </Card>

            {/* Notifications */}
            <Card className="p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                    <Bell className="w-5 h-5 text-foreground" />
                    <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-foreground">Daily Reminders</p>
                            <p className="text-sm text-muted-foreground">Get reminded to continue learning</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-foreground">Weekly Reports</p>
                            <p className="text-sm text-muted-foreground">Receive your weekly progress summary</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-foreground">New Features</p>
                            <p className="text-sm text-muted-foreground">Be notified about new StudyPlus features</p>
                        </div>
                        <Switch />
                    </div>
                </div>
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
                        <Switch />
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
                    <Button variant="outline" className="w-full justify-start">
                        Export My Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                        Change Password
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
