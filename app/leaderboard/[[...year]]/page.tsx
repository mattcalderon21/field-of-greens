import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { resolveSeasonParam, getAllSeasons, getSeasonTournamentIds } from '@/lib/seasons'
import SeasonNav from '@/components/SeasonNav'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props) {
  const year = params.year?.[0] ?? null
  return { title: year ? `${year} Leaderboard — The Field of Greens` : 'Leaderboard — The Field of Greens' }
}

type Props = { params: { year?: string[] } }

type LastPickEntry = {
  golfer: string
  earnings: number
  tournament: string
  finish_position: string | null
}

async function getLeaderboard(tournamentIds: number[]) {
  const supabase = createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, email')

  if (!profiles?.length) return []

  if (tournamentIds.length === 0) {
    return profiles.map((p) => ({
      ...p,
      total_earnings: 0,
      last_picks: [] as LastPickEntry[],
      gap: 0,
      rank: 0,
    }))
  }

  const { data: picks } = await supabase
    .from('picks')
    .select(`
      user_id, earnings, tournament_id, pick_number, golfer_id,
      golfer:golfers(name),
      tournament:tournaments(name, is_completed, start_date)
    `)
    .in('tournament_id', tournamentIds)
    .order('tournament_id', { ascending: false })

  if (!picks) return profiles.map((p) => ({
    ...p,
    total_earnings: 0,
    last_picks: [] as LastPickEntry[],
    gap: 0,
    rank: 0,
  }))

  const completedTournamentMeta = new Map<number, { name: string; start_date: string }>()
  for (const p of picks) {
    const t = p.tournament as unknown as { name: string; is_completed: boolean; start_date: string } | null
    if (t?.is_completed && !completedTournamentMeta.has(p.tournament_id)) {
      completedTournamentMeta.set(p.tournament_id, { name: t.name, start_date: t.start_date })
    }
  }

  const completedEntries = Array.from(completedTournamentMeta.entries())

  let latestStartDate: string | null = null
  for (const [, { start_date }] of completedEntries) {
    if (!latestStartDate || start_date > latestStartDate) latestStartDate = start_date
  }

  const lastWeekIds = new Set<number>()
  if (latestStartDate) {
    const latestMs = new Date(latestStartDate).getTime()
    for (const [tid, { start_date }] of completedEntries) {
      if ((latestMs - new Date(start_date).getTime()) / 86_400_000 <= 3) {
        lastWeekIds.add(tid)
      }
    }
  }

  const finishMap = new Map<string, string | null>()
  if (lastWeekIds.size > 0) {
    const { data: fields } = await supabase
      .from('tournament_fields')
      .select('tournament_id, golfer_id, finish_position')
      .in('tournament_id', Array.from(lastWeekIds))
    for (const f of fields ?? []) {
      finishMap.set(`${f.tournament_id}_${f.golfer_id}`, f.finish_position ?? null)
    }
  }

  const dataByUser: Record<string, { total: number; lastPicks: LastPickEntry[] }> = {}

  for (const p of picks) {
    if (!dataByUser[p.user_id]) dataByUser[p.user_id] = { total: 0, lastPicks: [] }
    dataByUser[p.user_id].total += p.earnings ?? 0

    if (lastWeekIds.has(p.tournament_id)) {
      const meta = completedTournamentMeta.get(p.tournament_id)
      if (meta) {
        dataByUser[p.user_id].lastPicks.push({
          golfer: (p.golfer as unknown as { name: string } | null)?.name ?? '—',
          earnings: p.earnings ?? 0,
          tournament: meta.name,
          finish_position: finishMap.get(`${p.tournament_id}_${p.golfer_id}`) ?? null,
        })
      }
    }
  }

  const ranked = profiles
    .map((profile) => ({
      ...profile,
      total_earnings: dataByUser[profile.id]?.total ?? 0,
      last_picks: dataByUser[profile.id]?.lastPicks ?? [],
    }))
    .sort((a, b) => b.total_earnings - a.total_earnings)
    .map((entry, idx, arr) => ({
      ...entry,
      rank: idx + 1,
      gap: idx === 0 ? 0 : arr[0].total_earnings - entry.total_earnings,
    }))

  return ranked
}

async function getLastCompletedTournament(tournamentIds: number[]) {
  if (tournamentIds.length === 0) return null
  const supabase = createClient()
  const { data } = await supabase
    .from('tournaments')
    .select('id, name, start_date')
    .in('id', tournamentIds)
    .eq('is_completed', true)
    .order('start_date', { ascending: false })
    .limit(1)
    .single()
  return data
}

export default async function LeaderboardPage({ params }: Props) {
  const rawYear = params.year?.[0] ?? null
  const requestedYear = rawYear ? parseInt(rawYear, 10) : null

  const [season, allSeasons] = await Promise.all([
    resolveSeasonParam(requestedYear),
    getAllSeasons(),
  ])

  if (!season) notFound()

  // Redirect /leaderboard/2026 → /leaderboard to avoid duplicate URLs for current season
  if (season.is_current && rawYear !== null) {
    redirect('/leaderboard')
  }

  const tournamentIds = await getSeasonTournamentIds(season.id)

  const [leaderboard, lastCompletedTournament] = await Promise.all([
    getLeaderboard(tournamentIds),
    getLastCompletedTournament(tournamentIds),
  ])

  const podium = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl font-bold text-fairway mb-2">
          Season Leaderboard
        </h1>
        <p className="text-fairway/50 italic">&ldquo;If you pick him, points will come.&rdquo;</p>
        {lastCompletedTournament && (
          <p className="text-fairway/40 text-sm mt-3">
            Results through <strong className="text-fairway/60 font-medium">{lastCompletedTournament.name}</strong>
          </p>
        )}
        {allSeasons.length > 1 && (
          <div className="flex justify-center mt-4">
            <SeasonNav seasons={allSeasons} activeYear={season.year} basePath="/leaderboard" />
          </div>
        )}
      </div>

      {tournamentIds.length === 0 ? (
        <div className="card text-center py-16 text-fairway/50">
          <span className="text-4xl block mb-3">⛳</span>
          <p>The {season.year} season hasn&apos;t started yet. Check back soon.</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="card text-center py-16 text-fairway/50">
          <span className="text-4xl block mb-3">⛳</span>
          <p>The season hasn&apos;t started yet. Check back after the Sony Open.</p>
        </div>
      ) : (
        <>
          {/* Podium — top 3 */}
          <div className="grid grid-cols-3 gap-3 mb-6 items-end">
            {/* 2nd place */}
            {podium[1] && (
              <div className="text-center">
                <div className="bg-white border-2 border-cream-darker rounded-xl p-4 shadow-sm">
                  <div className="text-3xl font-bold text-fairway/30 mb-1">2</div>
                  <div className="font-display font-bold text-fairway text-lg leading-tight mb-2">
                    {podium[1].display_name}
                  </div>
                  <div className="earnings-num text-fairway font-semibold text-sm">
                    {formatCurrency(podium[1].total_earnings)}
                  </div>
                  <div className="earnings-num text-fairway/40 text-xs mt-1">
                    -{formatCurrency(podium[1].gap)}
                  </div>
                </div>
              </div>
            )}

            {/* 1st place */}
            {podium[0] && (
              <div className="text-center">
                <div className="text-3xl mb-1">👑</div>
                <div className="bg-gradient-to-b from-gold/20 to-gold/5 border-2 border-gold rounded-xl p-5 shadow-gold shadow-sm">
                  <div className="rank-first text-4xl font-bold mb-1">1</div>
                  <div className="font-display font-bold text-fairway text-xl leading-tight mb-2">
                    {podium[0].display_name}
                  </div>
                  <div className="earnings-num text-gold-dark font-bold text-base">
                    {formatCurrency(podium[0].total_earnings)}
                  </div>
                  <div className="text-xs text-gold font-medium mt-1">LEADER</div>
                </div>
              </div>
            )}

            {/* 3rd place */}
            {podium[2] && (
              <div className="text-center">
                <div className="bg-white border-2 border-cream-darker rounded-xl p-4 shadow-sm">
                  <div className="text-3xl font-bold text-amber-700/30 mb-1">3</div>
                  <div className="font-display font-bold text-fairway text-lg leading-tight mb-2">
                    {podium[2].display_name}
                  </div>
                  <div className="earnings-num text-fairway font-semibold text-sm">
                    {formatCurrency(podium[2].total_earnings)}
                  </div>
                  <div className="earnings-num text-fairway/40 text-xs mt-1">
                    -{formatCurrency(podium[2].gap)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Full leaderboard table */}
          <div className="card p-0 overflow-hidden">
            <table className="w-full">
              <thead className="bg-fairway text-cream text-sm">
                <tr>
                  <th className="px-4 py-3 text-left font-medium w-10">#</th>
                  <th className="px-4 py-3 text-left font-medium">Contestant</th>
                  <th className="px-4 py-3 text-right font-medium earnings-num">Total</th>
                  <th className="px-4 py-3 text-right font-medium earnings-num hidden sm:table-cell">Gap</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Last Week</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-dark">
                {leaderboard.map((entry) => (
                  <tr
                    key={entry.id}
                    className={`transition-colors ${
                      entry.rank === 1 ? 'bg-gold/5' :
                      entry.rank <= 3 ? 'bg-fairway/[0.02]' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <span className={`w-7 h-7 inline-flex items-center justify-center rounded-full text-sm font-bold ${
                        entry.rank === 1 ? 'bg-gold text-fairway-dark' :
                        entry.rank === 2 ? 'bg-cream-darker text-fairway' :
                        entry.rank === 3 ? 'bg-amber-100 text-amber-900' :
                        'bg-cream-dark text-fairway/50'
                      }`}>
                        {entry.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-fairway">
                      {entry.display_name}
                    </td>
                    <td className="px-4 py-3.5 text-right earnings-num font-semibold text-fairway">
                      {formatCurrency(entry.total_earnings)}
                    </td>
                    <td className="px-4 py-3.5 text-right earnings-num text-fairway/50 text-sm hidden sm:table-cell">
                      {entry.rank === 1
                        ? <span className="text-gold font-semibold text-xs">LEADER</span>
                        : `-${formatCurrency(entry.gap)}`}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-fairway/60 hidden md:table-cell">
                      {entry.last_picks.length > 0 ? (
                        <div className="space-y-1.5">
                          {entry.last_picks.map((lp, i) => (
                            <div key={i} className="leading-tight">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium text-fairway">{lp.golfer}</span>
                                {lp.finish_position && (
                                  <span className="text-xs font-mono bg-fairway/8 text-fairway/70 px-1.5 py-0.5 rounded">
                                    {lp.finish_position}
                                  </span>
                                )}
                                <span className="text-fairway/40 earnings-num text-xs">
                                  {formatCurrency(lp.earnings)}
                                </span>
                              </div>
                              {entry.last_picks.length > 1 && (
                                <div className="text-fairway/35 text-xs mt-0.5">{lp.tournament}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-fairway/30">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
