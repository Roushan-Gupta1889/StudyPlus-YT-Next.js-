'use client'

import Link from 'next/link'
import { useState, FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Play, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showIITMHint, setShowIITMHint] = useState(false)

    // Check if email is IITM
    const isIITM = email.endsWith('@iitm.ac.in') ||
        email.endsWith('@study.iitm.ac.in') ||
        email.endsWith('@ds.study.iitm.ac.in')

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError('Invalid email or password')
            } else {
                router.push('/app/dashboard')
                router.refresh()
            }
        } catch (error) {
            setError('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignIn = () => {
        signIn('google', { callbackUrl: '/app/dashboard' })
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-muted/40 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-2 mb-8 group">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                        <Play className="w-5 h-5 text-primary-foreground fill-current" />
                    </div>
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                        StudyPlus YT
                    </span>
                </Link>

                <Card className="border-border/50 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/95">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
                        <CardDescription className="text-center">
                            Sign in to continue your learning journey
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="bg-background/50"
                                    onFocus={() => setShowIITMHint(true)}
                                    onBlur={() => setShowIITMHint(false)}
                                />
                                {isIITM ? (
                                    <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1 mt-2">
                                        <span>✓</span>
                                        <span>IITM email detected</span>
                                    </p>
                                ) : showIITMHint && (
                                    <div className="text-[0.8rem] text-muted-foreground bg-primary/5 border border-primary/10 rounded-md p-3 mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <p className="font-semibold text-primary mb-1 flex items-center gap-1.5">
                                            <span className="text-base">🎓</span>
                                            IITM Student or Staff?
                                        </p>
                                        <p className="leading-relaxed mb-2 opacity-90">
                                            Use your institute email ending in <code className="bg-primary/10 px-1 py-0.5 rounded text-primary text-xs">@iitm.ac.in</code>, <code className="bg-primary/10 px-1 py-0.5 rounded text-primary text-xs">@study.iitm.ac.in</code>, or <code className="bg-primary/10 px-1 py-0.5 rounded text-primary text-xs">@ds.study.iitm.ac.in</code> to unlock exclusive tools.
                                        </p>
                                        <div className="pt-2 border-t border-primary/10 flex items-center gap-1.5 text-foreground/80">
                                            <span className="text-base">✨</span>
                                            <span>General users are welcome with any email!</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="bg-background/50"
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            type="button"
                            className="w-full bg-background/50"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                        >
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Google
                        </Button>
                    </CardContent>
                    <CardFooter>
                        <p className="text-center text-sm text-muted-foreground w-full">
                            Don&apos;t have an account?{' '}
                            <Link href="/signup" className="text-primary hover:underline font-medium">
                                Sign up
                            </Link>
                        </p>
                    </CardFooter>
                </Card>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                    By continuing, you agree to our{' '}
                    <Link href="/terms" className="hover:text-primary underline underline-offset-4">
                        Terms
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="hover:text-primary underline underline-offset-4">
                        Privacy Policy
                    </Link>
                </p>
            </div>
        </div>
    )
}
