import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PicksClient from './PicksClient'

export const metadata = { title: 'My Pick — The Field of Greens' }

export default async function PicksPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // Auto-create profile if missing (edge case)
    await supabase.from('profiles').insert({
      id: user.id,
      email: user.email,
      display_name: user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? 'Unknown',
    })
  }

  // Get active tournaments
  const { data: activeTournaments } = await supabase
    .from('tournaments')
    .select('*')
    .eq('is_active', true)
    .eq('is_included_in_ond', true)
    .order('start_date', { ascending: true })

  // Get all burned golfer IDs for this user (any pick this season = burned)
  const { data: allPicks } = await supabase
    .from('picks')
    .select('golfer_id, tournament_id')
    .eq('user_id', user.id)

  const burnedGolferIds = new Set((allPicks ?? []).map((p) => p.golfer_id))

  return (
    <PicksClient
      userId={user.id}
      profile={profile ?? { id: user.id, display_name: user.email ?? 'Unknown', email: user.email, is_admin: false, created_at: '' }}
      activeTournaments={activeTournaments ?? []}
      burnedGolferIds={Array.from(burnedGolferIds)}
    />
  )
}
