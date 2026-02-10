"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
    videoSrc: string;
    posterSrc: string;
    className?: string;
    width?: number;
    height?: number;
}

export function VideoPlayer({
    videoSrc,
    posterSrc,
    className,
    width = 1920,
    height = 1080
}: VideoPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    const handlePlay = () => {
        setIsPlaying(true);
    };

    // Structured data for SEO
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "name": "StudyPlus YT Demo",
        "description": "See how StudyPlus YT helps you learn from YouTube without distractions.",
        "thumbnailUrl": [posterSrc], // Ideally absolute URL in production
        "uploadDate": new Date().toISOString(),
        "contentUrl": videoSrc,
        "embedUrl": videoSrc, // Simplified for direct file
    };

    if (!hasMounted) {
        return (
            <div className={cn("relative overflow-hidden bg-muted", className)}>
                <div className="absolute inset-0 bg-muted animate-pulse" />
            </div>
        );
    }

    return (
        <div className={cn("relative overflow-hidden bg-black group w-full h-full", className)}>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {!isPlaying ? (
                <div
                    className="absolute inset-0 cursor-pointer w-full h-full"
                    onClick={handlePlay}
                >
                    <Image
                        src={posterSrc}
                        alt="Video thumbnail"
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        priority
                    />

                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />

                    {/* Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:bg-primary">
                            <Play className="w-8 h-8 ml-1 fill-current" />
                        </div>
                    </div>

                    <div className="absolute bottom-8 left-0 right-0 text-center">
                        <p className="text-white font-medium drop-shadow-md opacity-90 group-hover:opacity-100 transition-opacity">Click to see StudyPlus in action</p>
                    </div>
                </div>
            ) : (
                <video
                    className="w-full h-full object-cover"
                    src={videoSrc}
                    autoPlay
                    controls
                    playsInline
                >
                    Your browser does not support the video tag.
                </video>
            )}
        </div>
    );
}
