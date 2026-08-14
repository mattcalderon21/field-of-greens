import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { resolveSeasonParam, getAllSeasons, getSeasonTournamentIds } from '@/lib/seasons'
import SeasonNav from '@/components/SeasonNav'

export const dynamic = 'force-dynamic'

// Normalizes for duplicate-golfer-row detection (e.g. "Ludvig Åberg" vs "Ludvig  Aberg" —
// a stray diacritic or whitespace variant created by a data import).
function normalizeGolferName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

export async function generateMetadata({ params }: Props) {
  const year = params.year?.[0] ?? null
  return { title: year ? `${year} Results — The Field of Greens` : 'Results — The Field of Greens' }
}

type Props = { params: { year?: string[] } }

async function getResults(tournamentIds: number[]) {
  const supabase = createClient()

  if (tournamentIds.length === 0) {
    const { data: profiles } = await supabase.from('profiles').select('id, display_name').order('display_name')
    return { profiles: profiles ?? [], tournaments: [], picks: [], winners: [] }
  }

  const [{ data: profiles }, { data: tournaments }, { data: picks }, { data: winners }] = await Promise.all([
    supabase.from('profiles').select('id, display_name').order('display_name'),
    supabase
      .from('tournaments')
      .select('id, name, start_date, is_active, is_completed, is_included_in_ond, purse')
      .in('id', tournamentIds)
      .order('start_date', { ascending: true }),
    supabase
      .from('picks')
      .select(`
        user_id, tournament_id, golfer_id, pick_number, earnings, is_locked,
        golfer:golfers(name)
      `)
      .in('tournament_id', tournamentIds),
    supabase
      .from('tournament_fields')
      .select('tournament_id, golfer_id')
      .in('tournament_id', tournamentIds)
      .eq('finish_position', '1'),
  ])

  return { profiles: profiles ?? [], tournaments: tournaments ?? [], picks: picks ?? [], winners: winners ?? [] }
}

export default async function ResultsPage({ params }: Props) {
  const rawYear = params.year?.[0] ?? null
  const requestedYear = rawYear ? parseInt(rawYear, 10) : null

  const [season, allSeasons] = await Promise.all([
    resolveSeasonParam(requestedYear),
    getAllSeasons(),
  ])

  if (!season) notFound()

  if (season.is_current && rawYear !== null) {
    redirect('/results')
  }

  const tournamentIds = await getSeasonTournamentIds(season.id)
  const { profiles, tournaments, picks, winners } = await getResults(tournamentIds)

  // Build winner lookup: tournament_id → Set of golfer_ids who won that week
  const winnerMap: Record<number, Set<number>> = {}
  for (const w of winners) {
    if (!winnerMap[w.tournament_id]) winnerMap[w.tournament_id] = new Set()
    winnerMap[w.tournament_id].add(w.golfer_id)
  }

  // Detect the same golfer counted (earnings > 0) in more than one week this season —
  // usually means a duplicate golfer row slipped past the burned-golfer trigger (e.g. a
  // stray whitespace/diacritic variant created by a data import).
  const earningsOccurrencesByKey: Record<string, number> = {}
  for (const pick of picks) {
    const name = (pick.golfer as unknown as { name: string } | null)?.name
    if (!name || !((pick.earnings ?? 0) > 0)) continue
    const key = `${pick.user_id}::${normalizeGolferName(name)}`
    earningsOccurrencesByKey[key] = (earningsOccurrencesByKey[key] ?? 0) + 1
  }
  const duplicateKeys = new Set(
    Object.keys(earningsOccurrencesByKey).filter((k) => earningsOccurrencesByKey[k] > 1)
  )

  const tournamentNameById: Record<number, string> = {}
  for (const t of tournaments) tournamentNameById[t.id] = t.name

  const duplicateDetailsMap: Record<string, { displayName: string; golferName: string; tournamentNames: string[] }> = {}
  for (const pick of picks) {
    const name = (pick.golfer as unknown as { name: string } | null)?.name
    if (!name || !((pick.earnings ?? 0) > 0)) continue
    const key = `${pick.user_id}::${normalizeGolferName(name)}`
    if (!duplicateKeys.has(key)) continue
    if (!duplicateDetailsMap[key]) {
      duplicateDetailsMap[key] = {
        displayName: profiles.find((p) => p.id === pick.user_id)?.display_name ?? 'Unknown',
        golferName: name,
        tournamentNames: [],
      }
    }
    duplicateDetailsMap[key].tournamentNames.push(tournamentNameById[pick.tournament_id] ?? `Tournament ${pick.tournament_id}`)
  }
  const duplicateDetails = Object.values(duplicateDetailsMap)

  // Build pick lookup: user_id → tournament_id → pick[]
  const pickMap: Record<string, Record<number, Array<{ golfer: string; earnings: number; is_locked: boolean; isWinner: boolean; isDuplicate: boolean }>>> = {}
  for (const pick of picks) {
    if (!pickMap[pick.user_id]) pickMap[pick.user_id] = {}
    if (!pickMap[pick.user_id][pick.tournament_id]) pickMap[pick.user_id][pick.tournament_id] = []
    const name = (pick.golfer as unknown as { name: string } | null)?.name ?? '—'
    pickMap[pick.user_id][pick.tournament_id].push({
      golfer: name,
      earnings: pick.earnings ?? 0,
      is_locked: pick.is_locked ?? false,
      isWinner: winnerMap[pick.tournament_id]?.has(pick.golfer_id) ?? false,
      isDuplicate: duplicateKeys.has(`${pick.user_id}::${normalizeGolferName(name)}`),
    })
  }

  // Count tournament winners picked per contestant
  const winCounts: Record<string, number> = {}
  for (const pick of picks) {
    if (winnerMap[pick.tournament_id]?.has(pick.golfer_id)) {
      winCounts[pick.user_id] = (winCounts[pick.user_id] ?? 0) + 1
    }
  }

  // Compute totals per user
  const totals: Record<string, number> = {}
  for (const pick of picks) {
    totals[pick.user_id] = (totals[pick.user_id] ?? 0) + (pick.earnings ?? 0)
  }

  const sortedProfiles = [...profiles].sort(
    (a, b) => (totals[b.id] ?? 0) - (totals[a.id] ?? 0)
  )

  const relevantTournaments = tournaments.filter((t) => t.is_active || t.is_completed)

  const maxByTournament: Record<number, number> = {}
  for (const t of relevantTournaments) {
    let max = 0
    for (const profile of profiles) {
      const pks = pickMap[profile.id]?.[t.id] ?? []
      const total = pks.reduce((s, p) => s + p.earnings, 0)
      if (total > max) max = total
    }
    maxByTournament[t.id] = max
  }

  return (
    <div className="max-w-full px-4 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-4xl font-bold text-fairway mb-2">
              {season.year} Results Grid
            </h1>
            <p className="text-fairway/60">
              All picks and earnings by week. Sorted by total earnings.
            </p>
          </div>
          {allSeasons.length > 1 && (
            <SeasonNav seasons={allSeasons} activeYear={season.year} basePath="/results" />
          )}
        </div>

        {duplicateDetails.length > 0 && (
          <div className="mb-6 rounded-lg border border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <div className="font-semibold flex items-center gap-1.5">
              ⚠️ Duplicate pick detected
            </div>
            <ul className="mt-1.5 space-y-1 list-disc list-inside">
              {duplicateDetails.map((d, i) => (
                <li key={i}>
                  <strong>{d.displayName}</strong> has earnings counted for{' '}
                  <strong>{d.golferName}</strong> in more than one week this season:{' '}
                  {d.tournamentNames.join(', ')}. This usually means a duplicate golfer row
                  exists in the database — merge the golfer entries and zero out the extra pick.
                </li>
              ))}
            </ul>
          </div>
        )}

        {tournamentIds.length === 0 ? (
          <div className="card text-center py-16 text-fairway/50">
            <span className="text-4xl block mb-3">⛳</span>
            <p>The {season.year} season hasn&apos;t started yet.</p>
          </div>
        ) : relevantTournaments.length === 0 ? (
          <div className="card text-center py-16 text-fairway/50">
            <span className="text-4xl block mb-3">⛳</span>
            <p>No results yet. Check back after the first tournament!</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-cream-dark shadow-sm bg-white">
            <table className="w-full text-sm results-table" style={{ minWidth: `${Math.max(700, 200 + relevantTournaments.length * 130)}px` }}>
              <thead>
                <tr className="bg-fairway text-cream">
                  <th className="px-4 py-3 text-left font-medium sticky left-0 bg-fairway z-10 w-28">
                    Contestant
                  </th>
                  {relevantTournaments.map((t) => (
                    <th key={t.id} className="px-2 py-3 text-center font-medium min-w-[110px]">
                      <div className="text-xs text-cream/60">{formatDate(t.start_date)}</div>
                      <div className="text-xs leading-tight mt-0.5 line-clamp-2" title={t.name}>
                        {t.name.replace(/^The /, '')}
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right font-medium sticky right-0 bg-gold/80 text-fairway-dark">
                    TOTAL
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedProfiles.map((profile, rowIdx) => (
                  <tr key={profile.id} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-cream/40'}>
                    <td className={`px-4 py-3 font-semibold text-fairway sticky left-0 z-10 ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-cream/40'}`}>
                      <div>{profile.display_name}</div>
                      {winCounts[profile.id] > 0 && (
                        <div className="text-xs font-normal text-emerald-700 mt-0.5" title="Tournament winners picked this season">
                          🏆 {winCounts[profile.id]}
                        </div>
                      )}
                    </td>
                    {relevantTournaments.map((t) => {
                      const pks = pickMap[profile.id]?.[t.id] ?? []
                      const cellEarnings = pks.reduce((s, p) => s + p.earnings, 0)
                      const isTopEarner = cellEarnings > 0 && cellEarnings === maxByTournament[t.id]
                      const hasWinnerPick = pks.some((p) => p.isWinner)

                      return (
                        <td
                          key={t.id}
                          className={`px-2 py-2.5 text-center align-top ${
                            hasWinnerPick
                              ? 'bg-emerald-50 ring-2 ring-inset ring-emerald-400'
                              : isTopEarner
                              ? 'bg-gold/10'
                              : ''
                          }`}
                        >
                          {pks.length === 0 ? (
                            t.is_completed ? (
                              <span className="text-fairway/25 text-xs">—</span>
                            ) : (
                              <span className="text-fairway/30 text-xs italic">pending</span>
                            )
                          ) : (
                            pks.map((pk, i) => (
                              <div key={i} className={`${i > 0 ? 'mt-1 pt-1 border-t border-cream-dark' : ''}`}>
                                <div className={`font-medium text-xs leading-tight ${pk.isWinner ? 'text-emerald-700' : 'text-fairway'}`}>
                                  {pk.golfer}
                                </div>
                                <div className={`earnings-num text-xs ${
                                  pk.earnings === 0
                                    ? 'text-fairway/30'
                                    : pk.isWinner
                                    ? 'text-emerald-700 font-semibold'
                                    : isTopEarner
                                    ? 'text-gold-dark font-semibold'
                                    : 'text-fairway'
                                }`}>
                                  {pk.earnings === 0
                                    ? t.is_completed ? '$0' : '—'
                                    : formatCurrency(pk.earnings)
                                  }
                                </div>
                                <div className="flex items-center justify-center gap-1">
                                  {pk.isWinner && (
                                    <span className="text-xs" title="Picked the tournament winner">🏆</span>
                                  )}
                                  {isTopEarner && pk.earnings > 0 && (
                                    <span className="text-gold text-xs">⭐</span>
                                  )}
                                  {pk.isDuplicate && (
                                    <span
                                      className="text-xs"
                                      title="Possible duplicate pick — this golfer is counted for earnings in more than one week this season"
                                    >
                                      ⚠️
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </td>
                      )
                    })}
                    <td className={`px-4 py-3 text-right earnings-num font-bold text-fairway sticky right-0 ${
                      rowIdx % 2 === 0 ? 'bg-gold/10' : 'bg-gold/15'
                    }`}>
                      {formatCurrency(totals[profile.id] ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-fairway/50">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gold/10 border border-gold/30" /> Top earner that week</span>
          <span className="flex items-center gap-1"><span>⭐</span> Week high</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-50 ring-2 ring-inset ring-emerald-400" /> 🏆 Picked the tournament winner</span>
          <span className="flex items-center gap-1"><span className="text-fairway/25">—</span> No pick / missed deadline</span>
          <span className="flex items-center gap-1"><span>⚠️</span> Possible duplicate pick (same golfer counted twice this season)</span>
        </div>
      </div>
    </div>
  )
}
