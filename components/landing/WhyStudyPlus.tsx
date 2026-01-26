"use client";

import { Play, Layout, Layers, Zap, Shield, Focus } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const benefits = [
  {
    icon: Play,
    title: "Seamless Playback Experience",
    description: "Enjoy uninterrupted video playback without any distractions. Your learning flow stays intact from start to finish.",
  },
  {
    icon: Layout,
    title: "Minimal UI for Focused Watching",
    description: "A clean, clutter-free interface designed to keep your attention on what matters most—the content.",
  },
  {
    icon: Layers,
    title: "All Videos in One Place",
    description: "Organize content from across YouTube into your personal learning library. Find everything exactly where you left it.",
  },
  {
    icon: Shield,
    title: "No Popups, No Redirects",
    description: "Stay focused with a streamlined experience. No unexpected interruptions or distracting links.",
  },
  {
    icon: Focus,
    title: "Study-Friendly YouTube Player",
    description: "Built specifically for learners who want to absorb content without the typical platform chaos.",
  },
  {
    icon: Zap,
    title: "Quick Access & Navigation",
    description: "Jump between videos, playlists, and notes effortlessly. Everything is just one click away.",
  },
];

export function WhyStudyPlus() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section ref={ref} className="py-20 md:py-28 bg-accent/30">
      <div className="container-wide">
        <div
          className={`text-center mb-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Why StudyPlus?
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            A better way to learn from YouTube
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We've reimagined the YouTube watching experience for serious learners. Here's what makes StudyPlus different.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className={`relative p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-card transition-all duration-500 group overflow-hidden ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              style={{
                transitionDelay: isVisible ? `${index * 80}ms` : "0ms",
              }}
            >
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  <benefit.icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
