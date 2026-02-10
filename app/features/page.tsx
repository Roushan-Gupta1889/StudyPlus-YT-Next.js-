import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Monitor, ListVideo, FileText, BarChart3, Shield, Zap, History as HistoryIcon } from "lucide-react";
import { FeatureCarousel } from "@/components/ui/FeatureCarousel";

const features = [
    {
        icon: Monitor,
        title: "Distraction-Free Player",
        description: "Our player strips away everything that pulls your attention. No ads, no comments, no suggested videos. Just you and the content. Resume exactly where you left off, control playback speed, and stay immersed in learning.",
        benefits: ["No ads or interruptions", "Resume from last position", "Speed controls (0.5x - 2x)", "Keyboard shortcuts"],
        images: ["/assets/feature-player.png", "/assets/Demo.mp4"], // Using video as placeholder if supported, or just duplicate for now. Wait, image component wont support mp4. stick to pngs.
        // Actually, let's use the same image twice for now as requested by user plan ("populate with existing assets (duplicating where needed)")
        // diverse images would be better but I only have 1 per feature. 
    },
    // ...
];

// Re-writing the file content to be cleaner and handle the data structure update properly.

const featuresData = [
    {
        icon: Monitor,
        title: "Distraction-Free Player",
        description: "Our player strips away everything that pulls your attention. No comments, no sidebar, no suggested videos. Just you and the content. Resume exactly where you left off, control playback speed, and stay immersed in learning.",
        benefits: ["No distractions or clutter", "Resume from last position", "Speed controls (0.5x - 2x)", "Keyboard shortcuts"],
        images: ["/assets/feature-player.png", "/assets/player2.png"],
    },
    {
        icon: ListVideo,
        title: "Smart Playlist Learning",
        description: "Organize YouTube videos into structured learning paths. Track your progress through each playlist with visual indicators and completion stats. Perfect for courses, tutorials, and learning series.",
        benefits: ["Visual progress tracking", "Completion statistics", "Drag-and-drop organization", "Import YouTube playlists"],
        images: ["/assets/feature-playlists.png", "/assets/playlist2.png"],
    },
    {
        icon: FileText,
        title: "Timestamped Notes",
        description: "Take notes that link directly to video moments. When reviewing, click any note to jump back to that exact point. Export your notes as markdown for use anywhere.",
        benefits: ["Click-to-jump timestamps", "Markdown formatting", "Export to external tools", "Search across all notes"],
        images: ["/assets/feature-notes.png", "/assets/note2.png"],
    },
    {
        icon: HistoryIcon,
        title: "Smart Watch History",
        description: "Automatically track every second of learning. Resume videos exactly where you left off, and easily find that one tutorial you watched last week. Everything is searchable.",
        benefits: ["Resume playback instantly", "Search your history", "Date-based organization", "One-click history clear"],
        images: ["/assets/history1.png", "/assets/history2.png"], // Placeholder until dedicated history screenshot
    },
    {
        icon: BarChart3,
        title: "Progress Analytics",
        description: "Understand your learning patterns with clean, simple analytics. See your weekly study time, completion rates, and streaks. No overwhelming dashboards—just the insights that matter.",
        benefits: ["Weekly time tracking", "Completion rates", "Learning streaks", "Goal setting"],
        images: ["/assets/analytics1.png", "/assets/analytics2.png"],
    },
    {
        icon: Shield,
        title: "Privacy-First Design",
        description: "Your learning data stays yours. We don't track what you watch for advertising, sell your data, or share your habits with third parties. Simple, honest privacy.",
        benefits: ["No tracking for ads", "Data never sold", "Optional data export", "Account deletion anytime"],
        images: ["/assets/Privacy & Security.png"], // Fallback
    },
    {
        icon: Zap,
        title: "Keyboard-First Experience",
        description: "Navigate everything with your keyboard. Play/pause, skip, take notes, switch tabs—all without touching your mouse. Built for power users who value efficiency.",
        benefits: ["Full keyboard navigation", "Customizable shortcuts", "Quick command palette", "Vim-style bindings"],
        images: ["/assets/keyboard.png"], // Fallback
    },
];

export default function FeaturesPage() {
    return (
        <div className="min-h-screen">
            <Navbar />
            <main className="pt-32 pb-20">
                <div className="container-wide">
                    <div className="text-center mb-20">
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                            Features built for focus
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Every feature is designed with one goal: help you learn more effectively from YouTube content.
                        </p>
                    </div>

                    <div className="space-y-24">
                        {featuresData.map((feature, index) => (
                            <div
                                key={feature.title}
                                className={`grid lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? "lg:flex-row-reverse" : ""
                                    }`}
                            >
                                <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                                    <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-6">
                                        <feature.icon className="w-7 h-7 text-primary" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-foreground mb-4">
                                        {feature.title}
                                    </h2>
                                    <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                                        {feature.description}
                                    </p>
                                    <ul className="grid grid-cols-2 gap-3">
                                        {feature.benefits.map((benefit) => (
                                            <li key={benefit} className="flex items-center gap-2 text-sm text-foreground">
                                                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                                                {benefit}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className={`${index % 2 === 1 ? "lg:order-1" : ""}`}>
                                    <div className="aspect-video w-full h-full">
                                        <FeatureCarousel
                                            images={feature.images}
                                            alt={feature.title}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
