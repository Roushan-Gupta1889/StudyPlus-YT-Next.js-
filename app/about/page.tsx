import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BookOpen, Shield, Zap, Coffee } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow pt-32 pb-20">
                <div className="container-wide">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">About StudyPlus YT</h1>
                        <p className="text-xl text-muted-foreground">
                            We're on a mission to make online learning distraction-free, focused, and effective.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 items-center mb-20 max-w-5xl mx-auto">
                        <div>
                            <h2 className="text-3xl font-bold mb-4">The Problem</h2>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                YouTube is an incredible resource for learning, but it's also built to keep you watching.
                                Algorithms, recommended videos, and shorts are designed to distract you.
                                Trying to study often leads to falling down a rabbit hole of unrelated content.
                            </p>
                        </div>
                        <div className="bg-card border border-border p-8 rounded-2xl shadow-sm">
                            <div className="flex items-center gap-4 mb-4 text-destructive">
                                <Zap className="w-6 h-6" />
                                <span className="font-semibold">The Distraction Trap</span>
                            </div>
                            <ul className="space-y-3 text-muted-foreground">
                                <li>❌ Endless recommended videos</li>
                                <li>❌ Distracting comments section</li>
                                <li>❌ addictive Shorts feed</li>
                                <li>❌ Autoplay keeping you hooked</li>
                            </ul>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 items-center mb-20 max-w-5xl mx-auto md:flex-row-reverse">
                        <div className="bg-card border border-border p-8 rounded-2xl shadow-sm md:order-1">
                            <div className="flex items-center gap-4 mb-4 text-primary">
                                <Shield className="w-6 h-6" />
                                <span className="font-semibold">The StudyPlus Solution</span>
                            </div>
                            <ul className="space-y-3 text-muted-foreground">
                                <li>✅ Clean, focused video player</li>
                                <li>✅ No sidebar recommendations</li>
                                <li>✅ Built-in note taking</li>
                                <li>✅ Playlist management for courses</li>
                            </ul>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold mb-4">Our Solution</h2>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                StudyPlus YT strips away the noise. We use the YouTube API to bring you the content you need,
                                without the features you don't. It's a dedicated environment for serious learners who want to
                                get the most out of educational content on YouTube.
                            </p>
                        </div>
                    </div>

                    <div className="text-center max-w-2xl mx-auto">
                        <h2 className="text-3xl font-bold mb-6">Built for Learners</h2>
                        <p className="text-muted-foreground mb-8">
                            Whether you're a student, a self-taught developer, or a lifelong learner,
                            StudyPlus YT is your tool for focused, deep work.
                        </p>
                        <div className="flex justify-center gap-4">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <span className="text-sm font-medium">Focused</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
                                    <Coffee className="w-6 h-6" />
                                </div>
                                <span className="text-sm font-medium">Simple</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
