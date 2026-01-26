"use client";

import { Monitor, ListVideo, FileText, BarChart3 } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const features = [
  {
    icon: Monitor,
    title: "Minimal UI Player",
    description: "A study-friendly YouTube player designed for focused watching. No popups, no redirects.",
  },
  {
    icon: ListVideo,
    title: "All Videos in One Place",
    description: "Organize your learning into playlists with progress tracking and completion goals.",
  },
  {
    icon: FileText,
    title: "Timestamped Notes",
    description: "Take notes linked to specific moments. Click to jump back instantly.",
  },
  {
    icon: BarChart3,
    title: "Seamless Playback",
    description: "Enjoy a seamless playback experience with your learning patterns and progress tracked.",
  },
];

export function Features() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section ref={ref} className="py-20 md:py-28">
      <div className="container-wide">
        <div
          className={`text-center mb-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything you need to learn effectively
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Simple tools that help you focus, retain, and track your progress.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`group p-6 rounded-2xl bg-card border border-border hover:border-primary/20 hover:shadow-card transition-all duration-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              style={{
                transitionDelay: isVisible ? `${index * 100}ms` : "0ms",
              }}
            >
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-5 group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
