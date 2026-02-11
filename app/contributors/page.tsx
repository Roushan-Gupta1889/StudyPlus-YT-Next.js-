import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import {
    Heart,
    Users,
    TrendingUp,
    Coffee,
    Gift,
    Crown,
    Sparkles,
    Zap,
    Trophy,
    EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ContributeModal } from "@/components/contributors/ContributeModal";
import { ContributorPodium } from "@/components/contributors/ContributorPodium";
import { RecentActivityMarquee } from "@/components/contributors/RecentActivityMarquee";

// Refresh data every hour
export const revalidate = 3600;

function getInitials(name: string) {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
}

const tiers = [
    {
        name: "Supporter",
        amount: "₹50",
        description: "Buy us a chai",
        icon: Coffee,
        perks: ["Name on contributors wall", "Supporter badge", "Our eternal gratitude"],
        highlighted: false,
        color: "from-blue-500/20 to-cyan-500/20 border-blue-200 dark:border-blue-800",
    },
    {
        name: "Champion",
        amount: "₹200",
        description: "Fuel a week of development",
        icon: Crown,
        perks: ["Everything in Supporter", "Priority feature requests", "Early access to new features", "Exclusive Discord channel"],
        highlighted: true,
        color: "from-yellow-500/20 to-orange-500/20 border-yellow-200 dark:border-yellow-800",
    },
    {
        name: "Pioneer",
        amount: "₹1,000",
        description: "Shape the future of learning",
        icon: Sparkles,
        perks: ["Everything in Champion", "Your logo on our page", "1-on-1 call with founders", "Lifetime premium access"],
        highlighted: false,
        color: "from-purple-500/20 to-pink-500/20 border-purple-200 dark:border-purple-800",
    },
];

export default async function ContributorsPage() {
    // Fetch Top Contributors
    const topContributors = await prisma.contributor.findMany({
        where: { isAnonymous: false },
        take: 10,
        orderBy: { amount: 'desc' },
    });

    // Fetch Recent Contributors for Marquee
    const recentContributors = await prisma.contributor.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
    });

    // Calculate Stats
    const totalContributors = await prisma.contributor.count();
    const impactStats = [
        { label: "Students Helped", value: "12,400+", icon: Users },
        { label: "Hours of Focus", value: "89,000+", icon: TrendingUp },
        { label: "Community Members", value: `${(3200 + totalContributors).toLocaleString()}+`, icon: Heart },
    ];

    return (
        <div className="min-h-screen bg-background overflow-hidden">
            <Navbar />

            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-30 animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-30 animate-pulse delay-1000" />
            </div>

            <main className="pt-24 pb-20 relative z-10">
                {/* Marquee Banner */}
                <RecentActivityMarquee contributors={recentContributors} />

                <div className="container-wide mt-12">
                    {/* Hero Section */}
                    <div className="text-center mb-16 space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 backdrop-blur-sm">
                            <Heart className="w-4 h-4 text-primary animate-beat" />
                            <span className="text-sm font-medium bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Powering Education Together</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-foreground">
                            Built by Learners, <br />
                            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient-x">
                                Funded by Love
                            </span>
                        </h1>

                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            Join the movement to make education distraction-free.
                            Your support directly funds our servers and keeps StudyPlus YT free for everyone.
                        </p>

                        <div className="flex justify-center gap-4 pt-4">
                            <ContributeModal>
                                <Button size="lg" className="h-12 px-8 text-lg gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow rounded-full">
                                    <Gift className="w-5 h-5" />
                                    Become a Hero
                                </Button>
                            </ContributeModal>
                        </div>
                    </div>


                    {/* Top Contributors Podium */}
                    <div className="mb-24">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold mb-2">Hall of Fame</h2>
                            <p className="text-muted-foreground">Our top champions leading the way</p>
                        </div>
                        <ContributorPodium contributors={topContributors} />
                    </div>

                    {/* Top Contributors & Recent Activity Grid */}
                    <div className="grid lg:grid-cols-5 gap-8 mb-24">
                        <div className="lg:col-span-3">
                            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
                                <div className="flex items-center gap-3 mb-2">
                                    <Trophy className="w-6 h-6 text-yellow-500 animate-pulse" />
                                    <h2 className="text-xl font-bold text-foreground">Top 10 Payers</h2>
                                </div>
                                <p className="text-sm text-muted-foreground mb-6">
                                    Heroes who make distraction-free learning possible
                                </p>

                                <div className="space-y-4">
                                    {topContributors.map((contributor, index) => (
                                        <div
                                            key={contributor.id}
                                            className={cn(
                                                "flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-[1.01]",
                                                index === 0 ? "bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20" :
                                                    index === 1 ? "bg-gradient-to-r from-slate-400/10 to-transparent border border-slate-400/20" :
                                                        index === 2 ? "bg-gradient-to-r from-orange-400/10 to-transparent border border-orange-400/20" :
                                                            "bg-muted/30 hover:bg-muted/50"
                                            )}
                                        >
                                            <div className="flex items-center justify-center w-8 text-sm font-bold text-muted-foreground">
                                                {index === 0 ? (
                                                    <Crown className="w-5 h-5 text-yellow-500 fill-yellow-500/20" />
                                                ) : index === 1 ? (
                                                    <span className="text-slate-400 text-lg">#2</span>
                                                ) : index === 2 ? (
                                                    <span className="text-orange-400 text-lg">#3</span>
                                                ) : (
                                                    `#${index + 1}`
                                                )}
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm ring-2 ring-background">
                                                {getInitials(contributor.name)}
                                            </div>
                                            <div className="flex-grow">
                                                <div className="font-semibold text-foreground flex items-center gap-2">
                                                    {contributor.name}
                                                    {index < 3 && <Sparkles className="w-3 h-3 text-yellow-500 opacity-50" />}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {contributor.message || "Community Hero"}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-foreground">₹{contributor.amount.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {topContributors.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No contributors yet. Be the first!
                                        </div>
                                    )}
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

                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                    {recentContributors.map((contributor) => (
                                        <div key={contributor.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center",
                                                    contributor.isAnonymous
                                                        ? "bg-muted text-muted-foreground"
                                                        : "bg-green-500/10 text-green-600"
                                                )}>
                                                    {contributor.isAnonymous ? (
                                                        <EyeOff className="w-4 h-4" />
                                                    ) : (
                                                        <Heart className="w-4 h-4 fill-current" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className={cn(
                                                        "text-sm font-medium",
                                                        contributor.isAnonymous ? "text-muted-foreground italic" : "text-foreground"
                                                    )}>
                                                        {contributor.isAnonymous ? "Anonymous" : contributor.name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(new Date(contributor.createdAt), { addSuffix: true })}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="font-medium text-green-600">₹{contributor.amount.toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Impact Stats - Glass Cards */}
                    <div className="grid md:grid-cols-3 gap-6 mb-24">
                        {impactStats.map((stat, i) => (
                            <div
                                key={stat.label}
                                className="group relative overflow-hidden p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-500 hover:-translate-y-1"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-purple-600 p-0.5 mb-4 shadow-lg group-hover:shadow-primary/30 transition-shadow">
                                        <div className="w-full h-full bg-background rounded-[14px] flex items-center justify-center">
                                            <stat.icon className="w-7 h-7 text-primary" />
                                        </div>
                                    </div>
                                    <div className="text-4xl md:text-5xl font-black text-foreground mb-2 group-hover:scale-110 transition-transform duration-500">
                                        {stat.value}
                                    </div>
                                    <div className="text-muted-foreground font-medium uppercase tracking-wider text-sm">
                                        {stat.label}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Contribution Tiers */}
                    <div id="contribute" className="mb-24 scroll-mt-32">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold text-foreground mb-4">
                                Choose Your Impact
                            </h2>
                            <p className="text-xl text-muted-foreground max-w-xl mx-auto">
                                Every tier unlocks a brighter future for students worldwide.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            {tiers.map((tier) => (
                                <div
                                    key={tier.name}
                                    className={cn(
                                        "relative group p-8 rounded-3xl border transition-all duration-300 backdrop-blur-sm",
                                        tier.highlighted
                                            ? "bg-gradient-to-b from-card to-background shadow-2xl scale-105 z-10 border-primary/50"
                                            : "bg-card/50 hover:bg-card border-border hover:border-primary/30",
                                    )}
                                >
                                    {tier.highlighted && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-purple-600 text-white text-sm font-bold shadow-lg">
                                            Most Popular
                                        </div>
                                    )}

                                    {/* Hover Glow */}
                                    <div className={cn(
                                        "absolute inset-0 rounded-3xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -z-10",
                                        tier.color
                                    )} />

                                    <div className="flex items-center gap-4 mb-6">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center",
                                            tier.highlighted ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                        )}>
                                            <tier.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold">{tier.name}</h3>
                                            <p className="text-sm text-muted-foreground">{tier.description}</p>
                                        </div>
                                    </div>

                                    <div className="mb-8 p-4 rounded-xl bg-muted/30 border border-border/50">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black text-foreground">{tier.amount}</span>
                                            <span className="text-muted-foreground font-medium">/ once</span>
                                        </div>
                                    </div>

                                    <ul className="space-y-4 mb-8">
                                        {tier.perks.map((perk) => (
                                            <li key={perk} className="flex items-start gap-3">
                                                <div className="mt-1 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                                    <Zap className="w-3 h-3 text-green-500" />
                                                </div>
                                                <span className="text-sm text-foreground/80">{perk}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <ContributeModal amount={tier.amount}>
                                        <Button
                                            variant={tier.highlighted ? "default" : "outline"}
                                            className={cn(
                                                "w-full h-11 rounded-xl font-semibold transition-all hover:scale-[1.02]",
                                                tier.highlighted ? "shadow-lg shadow-primary/25" : ""
                                            )}
                                        >
                                            Support with {tier.amount}
                                        </Button>
                                    </ContributeModal>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 text-center">
                            <p className="text-muted-foreground">
                                Prefer a custom amount?{" "}
                                <ContributeModal>
                                    <button className="text-primary hover:underline font-medium">Scan QR Code directly</button>
                                </ContributeModal>
                            </p>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

