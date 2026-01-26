import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play, ArrowRight, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      <div className="container-wide">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-8 animate-fade-in hover:scale-105 transition-transform cursor-default">
            <Sparkles className="w-4 h-4 text-primary animate-pulse-soft" />
            Now in public beta
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1] tracking-tight mb-6 animate-fade-in-up text-balance">
            Learn from YouTube.
            <br />
            <span className="text-primary relative">
              Without YouTube.
              <svg
                className="absolute -bottom-2 left-0 w-full h-3 text-primary/30"
                viewBox="0 0 200 12"
                fill="none"
              >
                <path
                  d="M2 8.5C50 2 150 2 198 8.5"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="animate-[draw_1s_ease-out_0.5s_forwards]"
                  style={{
                    strokeDasharray: 200,
                    strokeDashoffset: 200,
                    animation: "draw 1s ease-out 0.5s forwards"
                  }}
                />
              </svg>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto animate-fade-in-up text-balance" style={{ animationDelay: "0.1s" }}>
            A study-friendly YouTube player with minimal UI for focused watching. All your videos in one place with progress tracking and timestamped notes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <Button variant="hero" size="xl" asChild className="group">
              <Link href="/signup">
                Start Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-6 animate-fade-in flex items-center justify-center gap-2" style={{ animationDelay: "0.3s" }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            No popups, no redirects · Seamless playback experience
          </p>
        </div>

        {/* Animated Product Preview */}
        <div className="mt-16 md:mt-20 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <div className="relative max-w-5xl mx-auto group">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="relative rounded-2xl overflow-hidden shadow-elevated border border-border bg-card p-2 transition-transform duration-500 group-hover:scale-[1.01]">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 rounded-t-xl border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60 hover:bg-destructive transition-colors cursor-pointer" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60 hover:bg-yellow-500 transition-colors cursor-pointer" />
                  <div className="w-3 h-3 rounded-full bg-success/60 hover:bg-success transition-colors cursor-pointer" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-full bg-background/80 text-xs text-muted-foreground">
                    app.studyplus.com/watch
                  </div>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden bg-muted aspect-video flex items-center justify-center relative">
                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary))_1px,transparent_1px)] bg-[length:24px_24px]" />
                </div>

                <div className="text-center p-8 relative z-10">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500 animate-pulse-glow">
                    <Play className="w-10 h-10 text-primary ml-1" />
                  </div>
                  <p className="text-muted-foreground font-medium">Click to see StudyPlus in action</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Scroll down for features tour</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for draw animation */}
      <style>{`
        @keyframes draw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </section>
  );
}
