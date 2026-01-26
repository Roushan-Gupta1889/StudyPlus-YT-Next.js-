"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Smartphone } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
export function CTA() {
  const {
    ref,
    isVisible
  } = useScrollAnimation({
    threshold: 0.2
  });
  return <section ref={ref} className="py-20 md:py-28 relative overflow-hidden">
    {/* Animated background */}
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl transition-all duration-1000 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-50"}`} />

    <div className="container-wide relative">
      <div className={`max-w-3xl mx-auto text-center transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 transition-all duration-500 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"}`} style={{
          transitionDelay: isVisible ? "100ms" : "0ms"
        }}>
          <Sparkles className="w-4 h-4 animate-pulse" />
          Start learning smarter today
        </div>

        <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{
          transitionDelay: isVisible ? "150ms" : "0ms"
        }}>
          Ready for a study-friendly experience?
        </h2>

        <p className={`text-lg text-muted-foreground mb-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{
          transitionDelay: isVisible ? "200ms" : "0ms"
        }}>
          Minimal UI player for focused watching. All your videos in one place.
        </p>

        <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{
          transitionDelay: isVisible ? "250ms" : "0ms"
        }}>
          <Button variant="hero" size="xl" asChild className="group animate-pulse-glow">
            <Link href="/signup">
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button variant="outline" size="xl" asChild className="group">
            <Link href="/install">
              Install App
              <Smartphone className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </Link>
          </Button>
        </div>


      </div>
    </div>
  </section>;
}