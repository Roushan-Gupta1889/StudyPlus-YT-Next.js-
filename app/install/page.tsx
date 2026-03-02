"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Smartphone,
    CheckCircle2,
    Share,
    MoreVertical,
    Download,
} from "lucide-react";
import Link from "next/link";
import { useInstallPrompt } from "@/components/providers/InstallProvider";

export default function InstallPage() {
    const { isInstalled, isInstallable, promptInstall } = useInstallPrompt();
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
        setIsIOS(isIOSDevice);
    }, []);

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
                    <h1 className="text-3xl font-bold text-foreground">
                        Install StudyPlus
                    </h1>
                    <p className="text-muted-foreground">
                        Get the full app experience with offline access, push notifications,
                        and faster loading.
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

                {/* Install Instructions */}
                {isInstalled ? (
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                            <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2" />
                            <p className="text-primary font-medium">
                                App installed successfully!
                            </p>
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
                                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                    1
                                </span>
                                <span>
                                    Tap the <Share className="w-4 h-4 inline mx-1" /> Share button
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                    2
                                </span>
                                <span>Tap &quot;Add to Home Screen&quot;</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                    3
                                </span>
                                <span>Tap &quot;Add&quot; to confirm</span>
                            </div>
                        </div>
                    </div>
                ) : isInstallable ? (
                    <div className="space-y-4">
                        <Button
                            onClick={promptInstall}
                            className="w-full gap-2"
                            size="lg"
                        >
                            <Download className="w-5 h-5" />
                            Install App
                        </Button>
                        <p className="text-xs text-muted-foreground">
                            Tap the button above to install.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-muted border border-border text-left space-y-3">
                            <p className="font-medium text-foreground">To install:</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                    1
                                </span>
                                <span>
                                    Tap the <MoreVertical className="w-4 h-4 inline mx-1" /> menu
                                    button
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                    2
                                </span>
                                <span>
                                    Tap &quot;Install app&quot; or &quot;Add to Home Screen&quot;
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Back Link */}
                <Button variant="ghost" asChild>
                    <Link href="/app/dashboard">← Back to home</Link>
                </Button>
            </div>
        </div>
    );
}
