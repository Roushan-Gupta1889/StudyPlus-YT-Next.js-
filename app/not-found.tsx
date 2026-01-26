import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6">
            <div className="text-center space-y-6">
                <div className="space-y-3">
                    <h1 className="text-8xl font-bold text-primary">404</h1>
                    <h2 className="text-3xl font-semibold text-foreground">Page Not Found</h2>
                    <p className="text-lg text-muted-foreground max-w-md mx-auto">
                        The page you're looking for doesn't exist or has been moved.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg">
                        <Link href="/" className="gap-2">
                            <Home className="w-5 h-5" />
                            Back to Home
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                        <Link href="/app/dashboard">
                            Go to Dashboard
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
