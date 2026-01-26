"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, CheckCircle2, Share, MoreVertical } from "lucide-react";
import Link from "next/link";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPage() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsInstalled(true);
        }

        // Check if iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
        setIsIOS(isIOSDevice);

        // Listen for install prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            setIsInstalled(true);
        }
        setDeferredPrompt(null);
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-8">
                {/* App Icon */}
                <div className="flex justify-center">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-2xl shadow-primary/30">
                        <Smartphone className="w-12 h-12 text-white" />
                    </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-foreground">Install StudyPlus</h1>
                    <p className="text-muted-foreground">
                        Get the full app experience with offline access, push notifications, and faster loading.
                    </p>
                </div>

                {/* Features */}
                <div className="space-y-3 text-left bg-card rounded-2xl p-6 border border-border">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-foreground">Works offline</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-foreground">Faster load times</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-foreground">Home screen access</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-foreground">Full-screen experience</span>
                    </div>
                </div>

                {/* Install Button or Instructions */}
                {isInstalled ? (
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                            <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2" />
                            <p className="text-primary font-medium">App installed successfully!</p>
                        </div>
                        <Button asChild className="w-full" size="lg">
                            <Link href="/app/dashboard">Open App</Link>
                        </Button>
                    </div>
                ) : isIOS ? (
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-muted border border-border text-left space-y-3">
                            <p className="font-medium text-foreground">To install on iOS:</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
                                <span>Tap the <Share className="w-4 h-4 inline mx-1" /> Share button</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
                                <span>Scroll and tap &quot;Add to Home Screen&quot;</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
                                <span>Tap &quot;Add&quot; to confirm</span>
                            </div>
                        </div>
                    </div>
                ) : deferredPrompt ? (
                    <Button onClick={handleInstallClick} className="w-full gap-2" size="lg">
                        <Download className="w-5 h-5" />
                        Install App
                    </Button>
                ) : (
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-muted border border-border text-left space-y-3">
                            <p className="font-medium text-foreground">To install on Android:</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
                                <span>Tap the <MoreVertical className="w-4 h-4 inline mx-1" /> menu button</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
                                <span>Tap &quot;Install app&quot; or &quot;Add to Home Screen&quot;</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Back Link */}
                <Button variant="ghost" asChild>
                    <Link href="/">← Back to home</Link>
                </Button>
            </div>
        </div>
    );
}
