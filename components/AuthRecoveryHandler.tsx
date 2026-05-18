'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Mounted in the root layout to handle two edge-case password-reset scenarios:
 *
 * 1. Implicit flow — Supabase sends the user to the Site URL with a hash
 *    fragment (#access_token=...&type=recovery). The supabase client fires
 *    PASSWORD_RECOVERY; we forward to /reset-password.
 *
 * 2. PKCE code landing on the home page — happens when Supabase's redirectTo
 *    validation fails and it falls back to the Site URL, appending ?code=...
 *    We forward the code to the auth callback with next=/reset-password.
 */
export default function AuthRecoveryHandler() {
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    // Case 1 — hash fragment with type=recovery
    const hash = window.location.hash
    if (hash.includes('type=recovery')) {
      window.location.replace('/reset-password' + hash)
      return
    }

    // Case 2 — stray ?code= on the home page (redirectTo was rejected by Supabase)
    if (pathname === '/') {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      if (code) {
        window.location.replace(
          `/api/auth/callback?code=${encodeURIComponent(code)}&next=/reset-password`
        )
      }
    }
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Also listen for the PASSWORD_RECOVERY auth event (fired by Supabase client
    // when it processes a recovery token from the URL hash on any page).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        window.location.replace('/reset-password')
      }
    })
    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
