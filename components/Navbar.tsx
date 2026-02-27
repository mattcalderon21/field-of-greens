'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'

const navLinks = [
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/results', label: 'Results' },
  { href: '/picks', label: 'My Pick' },
  { href: '/schedule', label: 'Schedule' },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ?? null)
      if (user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          .then(({ data }) => setProfile(data))
      }
    }).catch(() => { /* Supabase unreachable — stay logged out */ })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-fairway shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-gold text-2xl" aria-hidden="true">⛳</span>
            <div className="leading-tight">
              <span className="font-display text-cream text-lg font-bold tracking-wide group-hover:text-gold transition-colors">
                The Field of Greens
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-fairway-light text-gold'
                    : 'text-cream/80 hover:text-cream hover:bg-fairway-light'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {profile?.is_admin && (
              <Link
                href="/admin"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith('/admin')
                    ? 'bg-gold text-fairway-dark'
                    : 'text-gold/80 hover:text-gold hover:bg-fairway-light'
                }`}
              >
                Admin
              </Link>
            )}
          </div>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-cream/70 text-sm">
                  {profile?.display_name ?? user.email?.split('@')[0]}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-cream/60 hover:text-cream border border-cream/20 hover:border-cream/50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm text-cream/80 hover:text-cream px-3 py-1.5 rounded-lg transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="text-sm bg-gold text-fairway-dark font-semibold px-4 py-1.5 rounded-lg hover:bg-gold-light transition-colors"
                >
                  Join
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-cream p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-fairway-dark border-t border-fairway-light px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-fairway-light text-gold'
                  : 'text-cream/80 hover:text-cream hover:bg-fairway-light'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {profile?.is_admin && (
            <Link
              href="/admin"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2 rounded-lg text-sm font-medium text-gold hover:bg-fairway-light transition-colors"
            >
              Admin
            </Link>
          )}
          <div className="pt-2 border-t border-fairway-light">
            {user ? (
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-cream/70 text-sm">{profile?.display_name ?? user.email}</span>
                <button
                  onClick={() => { handleSignOut(); setMenuOpen(false) }}
                  className="text-sm text-cream/60 hover:text-cream"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex gap-2 px-4 py-2">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 text-center text-sm text-cream/80 hover:text-cream border border-cream/20 px-3 py-2 rounded-lg"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 text-center text-sm bg-gold text-fairway-dark font-semibold px-3 py-2 rounded-lg"
                >
                  Join
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
