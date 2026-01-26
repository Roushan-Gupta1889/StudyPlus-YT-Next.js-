'use client'

import Link from 'next/link'
import { useState, FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Play } from 'lucide-react'

export default function SignupPage() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // Check if email is IITM
    const isIITM = email.endsWith('@iitm.ac.in') ||
        email.endsWith('@study.iitm.ac.in') ||
        email.endsWith('@ds.study.iitm.ac.in')

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        // Validate password
        if (password.length < 8) {
            setError('Password must be at least 8 characters')
            setLoading(false)
            return
        }

        try {
            // Call signup API
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || 'Something went wrong')
                setLoading(false)
                return
            }

            // Auto sign-in after successful signup
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError('Account created but sign-in failed. Please try logging in.')
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
        <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8 sm:py-0">
            <div className="w-full max-w-md">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-2 mb-6 sm:mb-8">
                    <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Play className="w-6 h-6 text-white" fill="white" />
                    </div>
                    <span className="text-xl sm:text-2xl font-semibold text-text-primary">StudyPlus YT</span>
                </Link>

                {/* Signup Card */}
                <div className="card">
                    <h1 className="text-xl sm:text-2xl font-bold text-text-primary mb-1 sm:mb-2">Create your account</h1>
                    <p className="text-sm sm:text-base text-text-secondary mb-4 sm:mb-6">Start learning without distractions</p>

                    {error && (
                        <div className="mb-4 p-3 bg-error-light border border-error rounded-lg text-error text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1">
                                Full Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input"
                                placeholder="John Doe"
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input"
                                placeholder="you@example.com"
                                required
                                disabled={loading}
                            />
                            {isIITM && (
                                <p className="mt-1 text-sm text-accent-600 flex items-center gap-1">
                                    <span>✓</span>
                                    <span>IITM email detected - You&apos;ll get access to curated BS course content!</span>
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-1">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input"
                                placeholder="••••••••"
                                required
                                disabled={loading}
                                minLength={8}
                            />
                            <p className="mt-1 text-xs text-text-tertiary">At least 8 characters</p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="btn-primary btn-md w-full"
                            disabled={loading}
                        >
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-4 sm:my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center text-xs sm:text-sm">
                            <span className="px-4 bg-white dark:bg-slate-950 text-text-tertiary">Or continue with</span>
                        </div>
                    </div>

                    {/* Google Sign In */}
                    <button
                        onClick={handleGoogleSignIn}
                        type="button"
                        className="btn-secondary btn-md w-full flex items-center justify-center gap-3"
                        disabled={loading}
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Sign up with Google
                    </button>

                    {/* Login Link */}
                    <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-text-secondary">
                        Already have an account?{' '}
                        <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700">
                            Sign in
                        </Link>
                    </p>
                </div>

                {/* Footer */}
                <p className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-text-tertiary">
                    By creating an account, you agree to our{' '}
                    <Link href="/terms" className="text-text-secondary hover:text-text-primary">
                        Terms
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-text-secondary hover:text-text-primary">
                        Privacy Policy
                    </Link>
                </p>
            </div>
        </div>
    )
}
