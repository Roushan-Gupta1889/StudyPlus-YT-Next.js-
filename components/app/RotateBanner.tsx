"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { X, ScreenShareOff } from "lucide-react";

export function RotateBanner() {
    const { data: session } = useSession();
    const [dismissed, setDismissed] = useState(false);
    const [isPortraitMobile, setIsPortraitMobile] = useState(false);

    useEffect(() => {
        // Check if already dismissed this session
        if (sessionStorage.getItem("rotate-banner-dismissed") === "true") {
            setDismissed(true);
        }

        const checkOrientation = () => {
            const isMobile = window.innerWidth < 768;
            const isPortrait = window.innerHeight > window.innerWidth;
            setIsPortraitMobile(isMobile && isPortrait);
        };

        checkOrientation();
        window.addEventListener("resize", checkOrientation);
        window.addEventListener("orientationchange", checkOrientation);

        return () => {
            window.removeEventListener("resize", checkOrientation);
            window.removeEventListener("orientationchange", checkOrientation);
        };
    }, []);

    const handleDismiss = () => {
        setDismissed(true);
        sessionStorage.setItem("rotate-banner-dismissed", "true");
    };

    // Only show if: logged in, on mobile portrait, not dismissed
    if (!session || !isPortraitMobile || dismissed) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
            <div className="mx-3 mb-3 rounded-2xl bg-gradient-to-r from-primary/95 via-primary to-primary/90 backdrop-blur-xl shadow-2xl shadow-primary/25 border border-white/10">
                <div className="flex items-center gap-3 px-4 py-3.5">
                    {/* Rotating phone icon */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center animate-gentle-rotate">
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-white"
                        >
                            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                            <path d="M12 18h.01" />
                        </svg>
                    </div>

                    {/* Message */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white leading-tight">
                            Rotate for Better Experience
                        </p>
                        <p className="text-xs text-white/70 mt-0.5">
                            Landscape mode works best on this app
                        </p>
                    </div>

                    {/* Close button */}
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                        aria-label="Dismiss"
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
}
