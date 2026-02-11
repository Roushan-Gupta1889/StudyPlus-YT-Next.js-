"use client";

import { motion } from "framer-motion";
import { Sparkles, Smartphone } from "lucide-react";

export function MobilePromoMarquee() {
    const content = (
        <>
            <span className="flex items-center gap-2 mx-6">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span className="font-bold uppercase tracking-wide">Stay tuned for a better learning experience!</span>
            </span>
            <span className="flex items-center gap-2 mx-6">
                <Smartphone className="w-4 h-4 text-cyan-300" />
                <span className="font-bold uppercase tracking-wide">Mobile App Coming Soon!</span>
            </span>
            <span className="flex items-center gap-2 mx-6">
                <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-cyan-300">
                    StudyPlus YT
                </span>
            </span>
        </>
    );

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-primary text-primary-foreground border-t border-primary-foreground/10 shadow-[0_-4px_20px_rgba(var(--primary),0.3)] overflow-hidden py-2 backdrop-blur-md bg-opacity-95">
            <div className="relative flex overflow-x-hidden">
                <motion.div
                    className="flex whitespace-nowrap py-1"
                    animate={{ x: "-50%" }}
                    transition={{
                        repeat: Infinity,
                        ease: "linear",
                        duration: 40,
                    }}
                >
                    {/* Duplicate content enough times to ensure smooth loop */}
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="flex items-center">
                            {content}
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
