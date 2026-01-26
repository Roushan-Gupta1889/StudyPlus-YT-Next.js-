"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import Link from "next/link";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if already dismissed
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      return;
    }

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Show prompt after 15 seconds on both mobile and desktop
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 15000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
    setIsVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-install-dismissed", "true");
    setIsVisible(false);
  };

  if (!isVisible || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-[320px] animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="bg-card border border-border rounded-xl p-4 shadow-xl">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Plus className="w-5 h-5 text-primary" />
          </div>

          <div className="flex-1 pr-4">
            <h3 className="font-semibold text-foreground text-sm">Install StudyPlus</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Add to your home screen for quick access and a better learning experience.
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          {deferredPrompt ? (
            <Button size="sm" onClick={handleInstall} className="flex-1">
              Add to home screen
            </Button>
          ) : (
            <Button size="sm" asChild className="flex-1">
              <Link href="/install">Add to home screen</Link>
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={handleDismiss}>
            No, thanks
          </Button>
        </div>
      </div>
    </div>
  );
}
