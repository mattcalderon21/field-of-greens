import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createClient()

  const [
    { data: profiles, error: profilesError },
    { data: picks,    error: picksError    },
    { data: tournaments, error: tournamentsError },
    { data: golfers,  error: golfersError  },
  ] = await Promise.all([
    supabase.from('profiles').select('id, display_name, is_admin'),
    supabase.from('picks').select('id, earnings, is_locked'),
    supabase.from('tournaments').select('id, name, is_completed, is_active').order('start_date'),
    supabase.from('golfers').select('id, name'),
  ])

  const completedTournaments = (tournaments ?? []).filter((t) => t.is_completed)
  const totalEarnings = (picks ?? []).reduce((s, p) => s + (Number(p.earnings) || 0), 0)

  return NextResponse.json({
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 40) + '…',
    counts: {
      profiles:              profiles?.length ?? 0,
      picks:                 picks?.length ?? 0,
      picks_locked:          (picks ?? []).filter((p) => p.is_locked).length,
      tournaments_total:     tournaments?.length ?? 0,
      tournaments_completed: completedTournaments.length,
      golfers:               golfers?.length ?? 0,
      total_earnings_in_db:  totalEarnings,
    },
    errors: {
      profiles:    profilesError?.message ?? null,
      picks:       picksError?.message ?? null,
      tournaments: tournamentsError?.message ?? null,
      golfers:     golfersError?.message ?? null,
    },
    profiles_found: (profiles ?? []).map((p) => ({
      display_name: p.display_name,
      is_admin: p.is_admin,
    })),
    completed_tournaments: completedTournaments.map((t) => t.name),
  })
}
