"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface FeatureCarouselProps {
    images: string[];
    alt: string;
    interval?: number;
}

export function FeatureCarousel({
    images,
    alt,
    interval = 4000,
}: FeatureCarouselProps) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (images.length <= 1) return;

        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % images.length);
        }, interval);

        return () => clearInterval(timer);
    }, [images.length, interval]);

    return (
        <div className="relative w-full h-full overflow-hidden rounded-2xl bg-card border border-border shadow-card group">
            <div className="absolute inset-0 bg-muted/20" /> {/* Placeholder background */}

            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7, ease: "easeInOut" }}
                    className="absolute inset-0"
                >
                    <Image
                        src={images[index]}
                        alt={`${alt} - View ${index + 1}`}
                        fill
                        className="object-contain p-4"
                        priority={index === 0}
                    />
                </motion.div>
            </AnimatePresence>

            {/* Progress Indicators */}
            {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {images.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? "w-6 bg-primary" : "w-1.5 bg-primary/20"
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
