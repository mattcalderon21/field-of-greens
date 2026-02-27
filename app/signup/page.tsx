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
          <p className="text-fairway/60 mt-2">Join the 2026 One-and-Done contest</p>
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
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Min. 8 characters"
                required
                minLength={8}
                autoComplete="new-password"
              />
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
          This contest is for the Iowa/Nebraska friend group. If you have the link, you&apos;re in. 🌽⛳
        </div>
      </div>
    </div>
  )
}
