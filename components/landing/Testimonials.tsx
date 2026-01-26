"use client";

import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Quote, Star } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const testimonials = [
  {
    quote: "I've tried so many learning apps, but StudyPlus finally helped me actually finish courses instead of just starting them.",
    author: "Sarah M.",
    role: "Graduate Student",
    rating: 5,
    avatar: "SM",
  },
  {
    quote: "The timestamp notes feature is a game changer. I can review my notes and jump right back to the important parts.",
    author: "James K.",
    role: "Software Developer",
    rating: 5,
    avatar: "JK",
  },
  {
    quote: "No more rabbit holes. I set my playlist and actually learn what I intended to learn. Simple but powerful.",
    author: "Priya T.",
    role: "Marketing Manager",
    rating: 5,
    avatar: "PT",
  },
  {
    quote: "Finally, a YouTube player that respects my time. The minimal UI keeps me focused on learning, not clicking around.",
    author: "Michael R.",
    role: "Data Scientist",
    rating: 5,
    avatar: "MR",
  },
  {
    quote: "I've doubled my course completion rate since switching to StudyPlus. The progress tracking is incredibly motivating.",
    author: "Emily C.",
    role: "UX Designer",
    rating: 5,
    avatar: "EC",
  },
];

export function Testimonials() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      ref={ref}
      className="py-20 md:py-28 bg-card border-y border-border overflow-hidden"
    >
      <div className="container-wide">
        <div
          className={`text-center mb-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Loved by focused learners
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands who've transformed their learning habits.
          </p>
        </div>

        <div
          className={`max-w-5xl mx-auto transition-all duration-700 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
        >
          <Carousel
            opts={{
              align: "center",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 4000,
                stopOnInteraction: false,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <div className="h-full p-6 rounded-2xl bg-background border border-border hover:border-primary/30 hover:shadow-card transition-all duration-500 group relative overflow-hidden">
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative">
                      {/* Quote icon */}
                      <Quote className="w-8 h-8 text-primary/20 mb-4 group-hover:text-primary/40 transition-colors" />

                      {/* Rating stars */}
                      <div className="flex gap-1 mb-4">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <Star
                            key={i}
                            className="w-4 h-4 fill-primary text-primary transition-transform duration-300"
                            style={{ transitionDelay: `${i * 50}ms` }}
                          />
                        ))}
                      </div>

                      <blockquote className="text-foreground leading-relaxed mb-6 text-sm">
                        "{testimonial.quote}"
                      </blockquote>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                          {testimonial.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{testimonial.author}</p>
                          <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Carousel indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${index === activeIndex
                    ? "w-8 bg-primary"
                    : "bg-border hover:bg-primary/50"
                  }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
