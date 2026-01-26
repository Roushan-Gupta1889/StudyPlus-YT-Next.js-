"use client";

import { X, Check } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const youtubeProblems = [
  "Endless recommendations",
  "Autoplay distractions",
  "Comments that derail focus",
  "Ads interrupting flow",
  "No progress tracking",
];

const studyPlusBenefits = [
  "Minimal UI for focused watching",
  "No popups, no redirects",
  "Study-friendly YouTube player",
  "All videos in one place",
  "Seamless playback experience",
];

export function Comparison() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });

  return (
    <section ref={ref} className="py-20 md:py-28 bg-card border-y border-border">
      <div className="container-wide">
        <div
          className={`text-center mb-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            YouTube chaos vs. StudyPlus clarity
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Same great educational content. Completely different learning experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* YouTube Card */}
          <div
            className={`rounded-2xl border border-destructive/20 bg-destructive/5 p-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
              }`}
            style={{ transitionDelay: isVisible ? "200ms" : "0ms" }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <X className="w-5 h-5 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Watching on YouTube</h3>
            </div>
            <ul className="space-y-4">
              {youtubeProblems.map((item, index) => (
                <li
                  key={item}
                  className={`flex items-center gap-3 transition-all duration-500 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                    }`}
                  style={{ transitionDelay: isVisible ? `${300 + index * 80}ms` : "0ms" }}
                >
                  <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <X className="w-3 h-3 text-destructive" />
                  </div>
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* StudyPlus Card */}
          <div
            className={`rounded-2xl border border-success/20 bg-success/5 p-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
              }`}
            style={{ transitionDelay: isVisible ? "200ms" : "0ms" }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <Check className="w-5 h-5 text-success" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Learning on StudyPlus</h3>
            </div>
            <ul className="space-y-4">
              {studyPlusBenefits.map((item, index) => (
                <li
                  key={item}
                  className={`flex items-center gap-3 transition-all duration-500 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                    }`}
                  style={{ transitionDelay: isVisible ? `${300 + index * 80}ms` : "0ms" }}
                >
                  <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-success" />
                  </div>
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
