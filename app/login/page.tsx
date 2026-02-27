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

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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

        <div className="card">
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
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
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
        </div>
      </div>
    </div>
  )
}
