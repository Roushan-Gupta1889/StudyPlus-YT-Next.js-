"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import { useInstallPrompt } from "@/components/providers/InstallProvider";

export function InstallPrompt() {
  const { isInstallable, promptInstall, hidePrompt } = useInstallPrompt();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isInstallable) {
      // Check if user previously dismissed the prompt (expires after 7 days)
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (dismissed) {
        const dismissedAt = parseInt(dismissed, 10);
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - dismissedAt < sevenDays) {
          return;
        }
        // Expired — remove old flag
        localStorage.removeItem("pwa-install-dismissed");
      }

      // Show the custom prompt after 3 seconds
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isInstallable]);

  const handleInstall = async () => {
    await promptInstall();
    setIsVisible(false);
  };

  const handleDismiss = () => {
    // Store timestamp so dismissal expires after 7 days
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
    setIsVisible(false);
    // Be careful not to call hidePrompt() here if we want other buttons to still work!
    // But we probably want the banner to go away.
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-[360px] animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="relative bg-[hsl(var(--card))] border border-border/60 rounded-2xl p-5 shadow-2xl backdrop-blur-xl">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-accent"
          aria-label="Dismiss install prompt"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon + Text */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0 ring-1 ring-primary/20">
            <Plus className="w-5 h-5 text-primary" />
          </div>

          <div className="flex-1 pr-4">
            <h3 className="font-semibold text-foreground text-sm">
              Install StudyPlus YT
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Add StudyPlus YT to your home screen for quick access and a better
              learning experience.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            size="sm"
            onClick={handleInstall}
            className="flex-1 rounded-lg font-medium"
          >
            Add to home screen
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDismiss}
            className="rounded-lg font-medium"
          >
            No, thanks
          </Button>
        </div>
      </div>
    </div>
  );
}
