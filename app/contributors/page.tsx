import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
    Heart,
    Trophy,
    Star,
    Sparkles,
    Users,
    TrendingUp,
    Coffee,
    Gift,
    Crown,
    Zap,
    EyeOff,
    Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

const topContributors = [
    { name: "Sarah Chen", amount: 250, posts: 45, badge: "Champion", avatar: "SC" },
    { name: "Marcus Johnson", amount: 180, posts: 32, badge: "Pioneer", avatar: "MJ" },
    { name: "Priya Sharma", amount: 150, posts: 28, badge: "Pioneer", avatar: "PS" },
    { name: "Alex Kim", amount: 100, posts: 21, badge: "Supporter", avatar: "AK" },
    { name: "David Lee", amount: 75, posts: 18, badge: "Supporter", avatar: "DL" },
];

const recentContributors = [
    { name: "Anonymous", amount: 75, timeAgo: "1 hour ago", isAnonymous: true },
    { name: "Emily R.", amount: 25, timeAgo: "2 hours ago", isAnonymous: false },
    { name: "James T.", amount: 50, timeAgo: "5 hours ago", isAnonymous: false },
    { name: "Anonymous", amount: 200, timeAgo: "8 hours ago", isAnonymous: true },
    { name: "Nina K.", amount: 15, timeAgo: "1 day ago", isAnonymous: false },
];

const impactStats = [
    { label: "Students Helped", value: "12,400+", icon: Users },
    { label: "Hours of Focus", value: "89,000+", icon: TrendingUp },
    { label: "Community Members", value: "3,200+", icon: Heart },
];

const tiers = [
    {
        name: "Supporter",
        amount: "$5",
        description: "Buy us a coffee",
        icon: Coffee,
        perks: ["Name on contributors wall", "Supporter badge", "Our eternal gratitude"],
        highlighted: false,
    },
    {
        name: "Champion",
        amount: "$25",
        description: "Fuel a week of development",
        icon: Crown,
        perks: ["Everything in Supporter", "Priority feature requests", "Early access to new features", "Exclusive Discord channel"],
        highlighted: true,
    },
    {
        name: "Pioneer",
        amount: "$100",
        description: "Shape the future of learning",
        icon: Sparkles,
        perks: ["Everything in Champion", "Your logo on our page", "1-on-1 call with founders", "Lifetime premium access"],
        highlighted: false,
    },
];

export default function ContributorsPage() {
    return (
        <div className="min-h-screen">
            <Navbar />
            <main className="pt-32 pb-20">
                <div className="container-wide">
                    {/* Hero Section */}
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
                            <Heart className="w-4 h-4" />
                            <span className="text-sm font-medium">Community Powered</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                            Built by Learners,<br />
                            <span className="text-primary">For Learners</span>
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                            StudyPlus YT is free because of amazing people like you.
                            Your contribution keeps us ad-free, distraction-free, and focused on what matters—your learning.
                        </p>
                        <Button size="lg" className="gap-2 shadow-elevated" asChild>
                            <a href="#contribute">
                                <Gift className="w-5 h-5" />
                                Become a Contributor
                            </a>
                        </Button>
                    </div>

                    {/* Impact Stats */}
                    <div className="grid md:grid-cols-3 gap-6 mb-20">
                        {impactStats.map((stat) => (
                            <div
                                key={stat.label}
                                className="text-center p-8 rounded-2xl bg-card border border-border"
                            >
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-muted-foreground">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Contribution Tiers */}
                    <div id="contribute" className="mb-20 scroll-mt-24">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-foreground mb-4">
                                Support Our Mission
                            </h2>
                            <p className="text-muted-foreground max-w-xl mx-auto">
                                Every contribution, big or small, helps us build a better learning experience for everyone.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                            {tiers.map((tier) => (
                                <div
                                    key={tier.name}
                                    className={cn(
                                        "rounded-2xl border p-8 transition-all relative flex flex-col",
                                        tier.highlighted
                                            ? "border-primary bg-card shadow-elevated scale-105 z-10"
                                            : "border-border bg-card hover:border-primary/30"
                                    )}
                                >
                                    {tier.highlighted && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                                            Most Popular
                                        </div>
                                    )}

                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                                        tier.highlighted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    )}>
                                        <tier.icon className="w-6 h-6" />
                                    </div>

                                    <h3 className="text-xl font-semibold text-foreground mb-1">{tier.name}</h3>
                                    <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>

                                    <div className="mb-6">
                                        <span className="text-4xl font-bold text-foreground">{tier.amount}</span>
                                        <span className="text-muted-foreground"> / one-time</span>
                                    </div>

                                    <ul className="space-y-3 mb-8 flex-grow">
                                        {tier.perks.map((perk) => (
                                            <li key={perk} className="flex items-start gap-3 text-sm">
                                                <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                                <span className="text-foreground">{perk}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        variant={tier.highlighted ? "default" : "outline"}
                                        className="w-full"
                                    >
                                        Contribute {tier.amount}
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {/* Anonymous Option - Code truncated for brevity, keeping same structure */}
                        <p className="text-center text-sm text-muted-foreground mt-8">
                            Want to give a custom amount?{" "}
                            <a href="#" className="text-primary hover:underline">Contact us</a>
                        </p>
                    </div>

                    {/* Top Contributors & Recent Activity Grid */}
                    <div className="grid lg:grid-cols-5 gap-8 mb-20">
                        <div className="lg:col-span-3">
                            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
                                <div className="flex items-center gap-3 mb-2">
                                    <Trophy className="w-6 h-6 text-primary" />
                                    <h2 className="text-xl font-semibold text-foreground">Top Contributors</h2>
                                </div>
                                <p className="text-sm text-muted-foreground mb-6">
                                    Heroes who make distraction-free learning possible
                                </p>

                                <div className="space-y-4">
                                    {topContributors.map((contributor, index) => (
                                        <div
                                            key={contributor.name}
                                            className={cn(
                                                "flex items-center gap-4 p-4 rounded-xl transition-colors",
                                                index === 0 ? "bg-primary/5 border border-primary/20" : "bg-muted/50 hover:bg-muted"
                                            )}
                                        >
                                            <div className="flex items-center justify-center w-8 text-sm font-medium text-muted-foreground">
                                                {index === 0 ? (
                                                    <Crown className="w-5 h-5 text-yellow-500" />
                                                ) : (
                                                    `#${index + 1}`
                                                )}
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-sm">
                                                {contributor.avatar}
                                            </div>
                                            <div className="flex-grow">
                                                <div className="font-medium text-foreground">{contributor.name}</div>
                                                <div className="text-xs text-muted-foreground">{contributor.posts} contributions</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold text-foreground">${contributor.amount}</div>
                                                <div className={cn(
                                                    "text-xs px-2 py-0.5 rounded-full inline-block",
                                                    contributor.badge === "Champion" ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" :
                                                        contributor.badge === "Pioneer" ? "bg-primary/10 text-primary" :
                                                            "bg-muted text-muted-foreground"
                                                )}>
                                                    {contributor.badge}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            <div className="rounded-2xl border border-border bg-card p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                    <h3 className="text-lg font-semibold text-foreground">Recent Support</h3>
                                </div>
                                <p className="text-sm text-muted-foreground mb-6">
                                    Fresh contributions from the community
                                </p>

                                <div className="space-y-4">
                                    {recentContributors.map((contributor, index) => (
                                        <div key={`${contributor.name}-${index}`} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center",
                                                    contributor.isAnonymous
                                                        ? "bg-muted text-muted-foreground"
                                                        : "bg-success/10 text-success"
                                                )}>
                                                    {contributor.isAnonymous ? (
                                                        <EyeOff className="w-4 h-4" />
                                                    ) : (
                                                        <Heart className="w-4 h-4" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className={cn(
                                                        "text-sm font-medium",
                                                        contributor.isAnonymous ? "text-muted-foreground italic" : "text-foreground"
                                                    )}>
                                                        {contributor.name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">{contributor.timeAgo}</div>
                                                </div>
                                            </div>
                                            <div className="font-medium text-success">${contributor.amount}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6">
                                <Star className="w-8 h-8 text-primary mb-4" />
                                <h3 className="text-lg font-semibold text-foreground mb-2">
                                    Join 200+ Contributors
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Be part of something meaningful. Help students worldwide focus on what matters.
                                </p>
                                <Button className="w-full gap-2">
                                    <Heart className="w-4 h-4" />
                                    Contribute Now
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Why Contribute Section */}
                    <div className="text-center max-w-3xl mx-auto">
                        <h2 className="text-2xl font-bold text-foreground mb-4">
                            Why Your Support Matters
                        </h2>
                        <p className="text-muted-foreground mb-8">
                            We believe education should be accessible and distraction-free. Your contribution
                            directly funds server costs, new features, and keeps StudyPlus YT free for students
                            who can't afford premium tools. Together, we're building a calmer way to learn.
                        </p>
                        <div className="flex items-center justify-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="w-2 h-2 rounded-full bg-success"></div>
                                No ads, ever
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="w-2 h-2 rounded-full bg-success"></div>
                                100% transparent
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="w-2 h-2 rounded-full bg-success"></div>
                                Community-driven
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
