'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

export default function SignupPage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (displayName.trim().length < 2) {
      setError('Display name must be at least 2 characters.')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      setLoading(false)
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName.trim() },
        emailRedirectTo: `${location.origin}/api/auth/callback`,
      },
    })

    if (signUpError) {
      setError(friendlyAuthError(signUpError.message))
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        display_name: displayName.trim(),
        email: email,
      })
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
          <p className="text-fairway/60 mt-2">Join the {process.env.NEXT_PUBLIC_CURRENT_YEAR ?? '2026'} One-and-Done contest</p>
        </div>

        {/* Setup warning — shown when the placeholder Supabase URL is still in place */}
        {isStubUrl && (
          <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <p className="font-semibold mb-1">⚠️ Database not configured</p>
            <p>
              The app is still using the placeholder Supabase URL. Sign-up won&apos;t work until you
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

        <div className="card">
          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label htmlFor="displayName" className="label">
                Display name <span className="text-fairway/40 font-normal">(shown on leaderboard)</span>
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input"
                placeholder="e.g. Ben, Todd, Horse…"
                required
                maxLength={30}
              />
            </div>

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
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input w-full pr-10"
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  autoComplete="new-password"
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
                <p className="font-semibold mb-0.5">Sign-up failed</p>
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-center"
            >
              {loading ? 'Creating account…' : 'Join the contest'}
            </button>
          </form>

          <p className="text-center text-sm text-fairway/60 mt-5">
            Already have an account?{' '}
            <Link href="/login" className="text-gold font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-4 p-4 bg-fairway/5 rounded-xl border border-fairway/10 text-sm text-fairway/60 text-center">
          If you received a link to this page, you&apos;ve been invited to the Field of Greens One-and-Done contest. May the best picks win. ⛳
        </div>
      </div>
    </div>
  )
}
