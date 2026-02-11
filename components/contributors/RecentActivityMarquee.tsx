"use client";

import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Heart, Zap } from "lucide-react";

interface Contributor {
    id: string;
    name: string;
    amount: number;
    createdAt: Date;
    isAnonymous: boolean;
}

export function RecentActivityMarquee({ contributors }: { contributors: Contributor[] }) {
    // Duplicate list for seamless loop
    const duplicatedContributors = [...contributors, ...contributors];

    return (
        <div className="w-full overflow-hidden bg-primary/5 border-y border-primary/10 py-3 relative">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />

            <motion.div
                className="flex gap-8 whitespace-nowrap"
                animate={{ x: [0, -1000] }} // Adjust based on content width
                transition={{
                    repeat: Infinity,
                    duration: 30, // Adjust speed
                    ease: "linear",
                }}
            >
                {duplicatedContributors.map((contributor, index) => (
                    <div key={`${contributor.id}-${index}`} className="flex items-center gap-2 text-sm">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary">
                            <Heart className="w-3 h-3 fill-current" />
                        </span>
                        <span className="font-semibold text-foreground">
                            {contributor.isAnonymous ? "Someone" : contributor.name}
                        </span>
                        <span className="text-muted-foreground">
                            contributed <span className="text-primary font-medium">₹{contributor.amount}</span>
                        </span>
                        <span className="text-xs text-muted-foreground/60">
                            • {formatDistanceToNow(new Date(contributor.createdAt), { addSuffix: true })}
                        </span>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
