import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDate, getPurseDisplay, getTournamentStatus } from '@/lib/utils'
import { resolveSeasonParam, getAllSeasons } from '@/lib/seasons'
import SeasonNav from '@/components/SeasonNav'
import type { Tournament } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props) {
  const year = params.year?.[0] ?? null
  return { title: year ? `${year} Schedule — The Field of Greens` : 'Schedule — The Field of Greens' }
}

type Props = { params: { year?: string[] } }

function StatusBadge({ status }: { status: 'upcoming' | 'active' | 'completed' }) {
  if (status === 'active') {
    return (
      <span className="status-badge-active flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-gold-dark animate-pulse" />
        Active
      </span>
    )
  }
  if (status === 'completed') {
    return <span className="status-badge-completed">✓ Completed</span>
  }
  return <span className="status-badge-upcoming">Upcoming</span>
}

function PurseRankBadge({ rank, purse }: { rank: number | null; purse: number | null }) {
  if (!rank || !purse) return null
  return (
    <span className="text-xs text-fairway/50">
      #{rank} purse
    </span>
  )
}

async function getActiveTournaments(seasonId: number) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('tournaments')
    .select('*')
    .eq('season_id', seasonId)
    .eq('is_included_in_ond', true)
    .eq('is_completed', false)
    .or(`is_active.eq.true,and(start_date.lte.${today},end_date.gte.${today})`)
    .order('start_date', { ascending: true })
  return (data ?? []) as Tournament[]
}

export default async function SchedulePage({ params }: Props) {
  const rawYear = params.year?.[0] ?? null
  const requestedYear = rawYear ? parseInt(rawYear, 10) : null

  const [season, allSeasons] = await Promise.all([
    resolveSeasonParam(requestedYear),
    getAllSeasons(),
  ])

  if (!season) notFound()

  if (season.is_current && rawYear !== null) {
    redirect('/schedule')
  }

  const supabase = createClient()
  const [{ data: tournaments, error }, activeTournaments] = await Promise.all([
    supabase
      .from('tournaments')
      .select('*')
      .eq('season_id', season.id)
      .eq('is_included_in_ond', true)
      .order('start_date', { ascending: true }),
    getActiveTournaments(season.id),
  ])

  if (error || !tournaments?.length) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <span className="text-4xl block mb-3">⛳</span>
        <p className="text-fairway/60">Schedule is loading. Check back in a moment!</p>
      </div>
    )
  }

  const total = tournaments.length
  const completed = tournaments.filter((t) => t.is_completed).length

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-4xl font-bold text-fairway mb-2">{season.year} OND Schedule</h1>
          <p className="text-fairway/60">
            {completed} of {total} tournaments complete · {season.name}
          </p>
        </div>
        {allSeasons.length > 1 && (
          <SeasonNav seasons={allSeasons} activeYear={season.year} basePath="/schedule" />
        )}
      </div>

      {/* Live now banner — only shown for current season */}
      {season.is_current && activeTournaments.length > 0 && (
        <div className="mb-8 flex items-center justify-between gap-3 flex-wrap bg-gold/10 border border-gold/30 rounded-xl px-5 py-3">
          <div className="inline-flex items-center gap-2 text-gold text-sm">
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            <span>
              Live now:{' '}
              {activeTournaments.map((t, i) => (
                <span key={t.id}>
                  {i > 0 && <span className="text-gold/60"> · </span>}
                  <strong className="text-fairway">{t.name}</strong>
                </span>
              ))}
            </span>
          </div>
          <Link href="/" className="text-sm text-gold font-medium hover:underline">
            See this week&rsquo;s picks →
          </Link>
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-fairway/50 mb-1.5">
          <span>{formatDate(season.start_date)}</span>
          <span>{completed}/{total} complete</span>
          <span>{formatDate(season.end_date)}</span>
        </div>
        <div className="h-2 bg-cream-dark rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-fairway to-gold rounded-full transition-all"
            style={{ width: `${(completed / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Tournament list */}
      <div className="space-y-2">
        {(tournaments as Tournament[]).map((t) => {
          const status = getTournamentStatus(t)
          const isActive = status === 'active'
          return (
            <div
              key={t.id}
              className={`rounded-xl border transition-all ${
                isActive
                  ? 'bg-gold/5 border-gold/40 shadow-sm ring-1 ring-gold/20'
                  : status === 'completed'
                  ? 'bg-white border-cream-dark'
                  : 'bg-white border-cream-dark hover:border-cream-darker'
              }`}
            >
              <div className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  {/* Date */}
                  <div className="flex-shrink-0 w-20 text-sm font-medium text-fairway/50 font-mono">
                    {formatDate(t.start_date)}
                  </div>

                  {/* Name & location */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-semibold text-fairway ${isActive ? 'text-fairway' : ''}`}>
                        {isActive && '⛳ '}{t.name}
                      </span>
                      <StatusBadge status={status} />
                      {t.max_picks_per_user > 1 && (
                        <span className="text-xs bg-fairway/10 text-fairway px-2 py-0.5 rounded-full">
                          Team event ({t.max_picks_per_user} picks)
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-fairway/50 mt-0.5">
                      {t.course} · {t.location}
                    </div>
                  </div>

                  {/* Purse */}
                  <div className="flex items-center gap-3 sm:text-right">
                    <div>
                      <div className={`earnings-num font-semibold ${
                        t.purse && t.purse >= 20_000_000 ? 'text-gold-dark' : 'text-fairway'
                      }`}>
                        {getPurseDisplay(t.purse)}
                      </div>
                      <div className="text-xs text-fairway/40">
                        <PurseRankBadge rank={t.purse_rank} purse={t.purse} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-8 flex flex-wrap gap-4 text-sm text-fairway/60">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gold" />
          <span>$20M+ purse (premium event)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-base">⛳</span>
          <span>Current week</span>
        </div>
      </div>
    </div>
  )
}
