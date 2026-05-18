'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const isStubUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'http://localhost:54321' ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL

function friendlyAuthError(msg: string): string {
  if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network')) {
    return 'Cannot reach the database. Add your real Supabase URL and anon key to .env.local, then restart the dev server.'
  }
  return msg
}

function LoginPageContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')
  const supabase = createClient()

  const urlErrorMessage =
    urlError === 'otp_expired'
      ? 'That reset link has expired. Request a new one below using "Forgot your password?"'
      : urlError === 'auth_callback_failed'
      ? 'Sign-in link failed. Please try signing in again.'
      : urlError
      ? 'Something went wrong with that link. Please try again.'
      : null

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    // Strip www so the URL always matches Supabase's canonical Site URL
    const origin = window.location.origin.replace(/^(https?:\/\/)www\./, '$1')
    const redirectTo = `${origin}/api/auth/callback?next=/reset-password`
    await supabase.auth.resetPasswordForEmail(resetEmail, { redirectTo })
    // Always show success — don't reveal whether the email exists
    setResetSent(true)
    setResetLoading(false)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(friendlyAuthError(error.message))
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-4xl">⛳</span>
            <h1 className="font-display text-3xl font-bold text-fairway mt-2">The Field of Greens</h1>
          </Link>
          <p className="text-fairway/60 mt-2">Sign in to your account</p>
        </div>

        {/* Setup warning — shown when the placeholder Supabase URL is still in place */}
        {isStubUrl && (
          <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <p className="font-semibold mb-1">⚠️ Database not configured</p>
            <p>
              The app is still using the placeholder Supabase URL. Sign-in won&apos;t work until you
              add real credentials to{' '}
              <code className="bg-amber-100 px-1 rounded font-mono">.env.local</code> and restart.
            </p>
            <a
              href="https://supabase.com/dashboard/project/_/settings/api"
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-2 text-amber-700 font-medium underline hover:no-underline"
            >
              Get your Supabase API keys →
            </a>
          </div>
        )}

        {urlErrorMessage && (
          <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            {urlErrorMessage}
          </div>
        )}

        <div className="card">
          {forgotMode ? (
            resetSent ? (
              <div className="text-center py-4 space-y-3">
                <span className="text-3xl block">📬</span>
                <p className="font-semibold text-fairway">Check your email</p>
                <p className="text-sm text-fairway/60">
                  If an account exists for <strong>{resetEmail}</strong>, a reset link is on its way.
                </p>
                <button
                  onClick={() => { setForgotMode(false); setResetSent(false); setResetEmail('') }}
                  className="text-sm text-gold font-medium hover:underline mt-2"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div>
                  <p className="text-fairway font-semibold mb-1">Reset your password</p>
                  <p className="text-sm text-fairway/60 mb-4">Enter your email and we&apos;ll send a reset link.</p>
                  <label htmlFor="reset-email" className="label">Email address</label>
                  <input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="input"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="btn-primary w-full text-center"
                >
                  {resetLoading ? 'Sending…' : 'Send reset link'}
                </button>
                <p className="text-center text-sm">
                  <button
                    type="button"
                    onClick={() => setForgotMode(false)}
                    className="text-fairway/60 hover:text-fairway"
                  >
                    Back to sign in
                  </button>
                </p>
              </form>
            )
          ) : (
            <>
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label htmlFor="email" className="label">Email address</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="password" className="label mb-0">Password</label>
                    <button
                      type="button"
                      onClick={() => setForgotMode(true)}
                      className="text-xs text-fairway/50 hover:text-gold transition-colors"
                    >
                      Forgot your password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input w-full pr-10"
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-fairway/40 hover:text-fairway/70 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                    <p className="font-semibold mb-0.5">Sign-in failed</p>
                    <p>{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full text-center"
                >
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>

              <p className="text-center text-sm text-fairway/60 mt-5">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-gold font-medium hover:underline">
                  Join the contest
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// useSearchParams() requires a Suspense boundary in Next.js 14
export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  )
}
