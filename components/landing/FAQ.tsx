"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is StudyPlus YT?",
    answer: "StudyPlus YT is a distraction-free YouTube player optimized for focused learning. It removes algorithmic recommendations, comments, and sidebars so you can concentrate entirely on the educational content.",
  },
  {
    question: "Is StudyPlus YT really free?",
    answer: "Yes! StudyPlus YT is completely free to use. We believe in providing accessible, high-quality learning tools to everyone without any hidden costs.",
  },
  {
    question: "Do I need an account to use it?",
    answer: "You can use some basic features without an account. However, creating a free account allows you to save videos, create playlists, take timestamped notes, and track your learning progress across sessions.",
  },
  {
    question: "How do timestamped notes work?",
    answer: "While watching a video, you can write notes that automatically link to the exact timestamp of the video you're currently watching. Clicking the timestamp in your notes will instantly jump you back to that specific moment.",
  },
  {
    question: "Is the app available on mobile devices?",
    answer: "StudyPlus YT is built as a progressive web app (PWA), which means it works seamlessly across desktop, tablet, and mobile browsers. You can even install it directly on your home screen for a native-like experience.",
  },
];

export function FAQ() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section ref={ref} id="faq" className="py-20 md:py-28 bg-accent/30">
      <div className="container-wide max-w-4xl">
        <div
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground mx-auto">
            Everything you need to know about StudyPlus YT.
          </p>
        </div>

        <div
          className={`transition-all duration-700 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border px-6 rounded-xl data-[state=open]:shadow-sm transition-all"
              >
                <AccordionTrigger className="text-left text-[16px] font-semibold hover:no-underline hover:text-primary transition-colors py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed text-base pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
