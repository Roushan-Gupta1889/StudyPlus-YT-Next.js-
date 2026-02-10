import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Construction } from "lucide-react";

export default function BlogPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow pt-32 pb-20">
                <div className="container-wide text-center">
                    <div className="max-w-2xl mx-auto py-20">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                            <Construction className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h1 className="text-4xl font-bold mb-4">Blog Coming Soon</h1>
                        <p className="text-xl text-muted-foreground mb-8">
                            We're working on some great articles to help you study better and stay productive.
                            Check back soon!
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
