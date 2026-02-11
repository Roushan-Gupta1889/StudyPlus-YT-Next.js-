"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Crown, Star } from "lucide-react";
import Image from "next/image";

interface Contributor {
    id: string;
    name: string;
    amount: number;
    message?: string | null;
    isAnonymous: boolean;
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
}

export function ContributorPodium({ contributors }: { contributors: Contributor[] }) {
    // Ensure we have at least 3 spots even if empty
    const topThree = [
        contributors[1], // Silver (Left)
        contributors[0], // Gold (Center)
        contributors[2], // Bronze (Right)
    ];

    const podiumConfig = [
        { color: "bg-slate-300 dark:bg-slate-600", border: "border-slate-400", height: "h-32", delay: 0.2, iconColor: "text-slate-400" }, // Silver
        { color: "bg-yellow-400 dark:bg-yellow-500", border: "border-yellow-600", height: "h-40", delay: 0, iconColor: "text-yellow-600" }, // Gold
        { color: "bg-orange-300 dark:bg-orange-700", border: "border-orange-500", height: "h-24", delay: 0.4, iconColor: "text-orange-500" }, // Bronze
    ];

    return (
        <div className="flex items-end justify-center gap-4 md:gap-8 min-h-[300px] mb-12">
            {topThree.map((contributor, index) => {
                if (!contributor) return null;
                const config = podiumConfig[index];

                return (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: config.delay }}
                        className="flex flex-col items-center relative group"
                    >
                        {/* Avatar */}
                        <div className="mb-4 relative">
                            {index === 1 && (
                                <Crown className="absolute -top-8 left-1/2 -translate-x-1/2 w-8 h-8 text-yellow-500 animate-bounce" />
                            )}
                            <div className={cn(
                                "w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-xl font-bold shadow-lg border-4",
                                config.border,
                                "bg-background"
                            )}>
                                {getInitials(contributor.name)}
                            </div>
                        </div>

                        {/* Name & Amount */}
                        <div className="text-center mb-2 z-10">
                            <div className="font-bold text-lg md:text-xl truncate max-w-[120px] md:max-w-[160px]">
                                {contributor.name}
                            </div>
                            <div className="text-sm font-medium text-muted-foreground">
                                ₹{contributor.amount.toLocaleString()}
                            </div>
                        </div>

                        {/* Podium Block */}
                        <div className={cn(
                            "w-24 md:w-32 rounded-t-lg shadow-xl flex items-end justify-center pb-4",
                            config.color,
                            config.height
                        )}>
                            <span className={cn("text-4xl font-black opacity-20", "text-black dark:text-white")}>
                                {index === 1 ? "1" : index === 0 ? "2" : "3"}
                            </span>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
