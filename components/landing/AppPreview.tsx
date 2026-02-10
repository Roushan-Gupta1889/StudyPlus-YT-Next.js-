"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Play, FileText, BarChart3, ListVideo, ChevronLeft, ChevronRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Button } from "@/components/ui/button";

const screenshots = [
  {
    id: 1,
    title: "Minimal Video Player",
    description: "Focus on learning with our distraction-free player",
    icon: Play,
    image: "/assets/feature-player.png",
    gradient: "from-primary/20 to-primary/5",
  },
  {
    id: 2,
    title: "Organized Playlists",
    description: "All your learning videos in one curated place",
    icon: ListVideo,
    image: "/assets/feature-playlists.png",
    gradient: "from-success/20 to-success/5",
  },
  {
    id: 3,
    title: "Timestamped Notes",
    description: "Take notes linked to specific moments in videos",
    icon: FileText,
    image: "/assets/feature-notes.png",
    gradient: "from-accent-foreground/20 to-accent/5",
  },
  {
    id: 4,
    title: "Progress Analytics",
    description: "Track your learning journey with detailed insights",
    icon: BarChart3,
    image: "/assets/feature-analytics.png",
    gradient: "from-destructive/20 to-destructive/5",
  },
];

export function AppPreview() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % screenshots.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrev = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev + 1) % screenshots.length);
  };

  return (
    <section
      ref={ref}
      id="demo"
      className="py-20 md:py-28 bg-accent/30 overflow-hidden"
    >
      <div className="container-wide">
        <div
          className={`text-center mb-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            See it in action
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How StudyPlus works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A quick tour of the features that make learning from YouTube actually productive.
          </p>
        </div>

        <div
          className={`relative max-w-5xl mx-auto transition-all duration-700 delay-200 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
        >
          {/* Main preview container */}
          <div className="relative rounded-2xl overflow-hidden shadow-elevated border border-border bg-card p-2">
            {/* Browser chrome mockup */}
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 rounded-t-xl border-b border-border">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-full bg-background/80 text-xs text-muted-foreground">
                  app.studyplus.com
                </div>
              </div>
            </div>

            {/* Screenshot display */}
            <div className="relative aspect-video bg-muted overflow-hidden">
              {screenshots.map((screen, index) => {
                const isActive = index === activeIndex;
                const offset = index - activeIndex;

                return (
                  <div
                    key={screen.id}
                    className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ease-out ${isActive
                      ? "opacity-100 scale-100 translate-x-0"
                      : offset > 0
                        ? "opacity-0 scale-95 translate-x-full"
                        : "opacity-0 scale-95 -translate-x-full"
                      }`}
                  >
                    <div className="relative w-full h-full">
                      <Image
                        src={screen.image}
                        alt={screen.title}
                        fill
                        className="object-contain" // Use contain to show full UI screenshot without cropping
                        priority={index === 0}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Navigation arrows */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 hover:bg-background shadow-lg opacity-0 hover:opacity-100 transition-opacity md:opacity-70"
                onClick={goToPrev}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 hover:bg-background shadow-lg opacity-0 hover:opacity-100 transition-opacity md:opacity-70"
                onClick={goToNext}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Feature tabs */}
          <div className="flex justify-center gap-3 mt-8 flex-wrap">
            {screenshots.map((screen, index) => {
              const Icon = screen.icon;
              const isActive = index === activeIndex;

              return (
                <button
                  key={screen.id}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setActiveIndex(index);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${isActive
                    ? "bg-primary text-primary-foreground shadow-lg scale-105"
                    : "bg-card border border-border hover:border-primary/30 text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">{screen.title}</span>
                </button>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="flex justify-center mt-6">
            <div className="w-48 h-1 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{
                  width: `${((activeIndex + 1) / screenshots.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
