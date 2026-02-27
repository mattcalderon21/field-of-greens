import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'

export const metadata = { title: 'Results — The Field of Greens' }
export const revalidate = 60

async function getResults() {
  const supabase = createClient()

  const [{ data: profiles }, { data: tournaments }, { data: picks }] = await Promise.all([
    supabase.from('profiles').select('id, display_name').order('display_name'),
    supabase
      .from('tournaments')
      .select('id, name, start_date, is_active, is_completed, is_included_in_ond, purse')
      .eq('is_included_in_ond', true)
      .order('start_date', { ascending: true }),
    supabase
      .from('picks')
      .select(`
        user_id, tournament_id, pick_number, earnings, is_locked,
        golfer:golfers(name)
      `),
  ])

  return { profiles: profiles ?? [], tournaments: tournaments ?? [], picks: picks ?? [] }
}

export default async function ResultsPage() {
  const { profiles, tournaments, picks } = await getResults()

  // Build pick lookup: user_id → tournament_id → pick[]
  const pickMap: Record<string, Record<number, Array<{ golfer: string; earnings: number; is_locked: boolean }>>> = {}
  for (const pick of picks) {
    if (!pickMap[pick.user_id]) pickMap[pick.user_id] = {}
    if (!pickMap[pick.user_id][pick.tournament_id]) pickMap[pick.user_id][pick.tournament_id] = []
    pickMap[pick.user_id][pick.tournament_id].push({
      golfer: (pick.golfer as { name: string } | null)?.name ?? '—',
      earnings: pick.earnings ?? 0,
      is_locked: pick.is_locked ?? false,
    })
  }

  // Compute totals per user
  const totals: Record<string, number> = {}
  for (const pick of picks) {
    totals[pick.user_id] = (totals[pick.user_id] ?? 0) + (pick.earnings ?? 0)
  }

  // Sort profiles by total desc
  const sortedProfiles = [...profiles].sort(
    (a, b) => (totals[b.id] ?? 0) - (totals[a.id] ?? 0)
  )

  // Only show tournaments that are active or completed
  const relevantTournaments = tournaments.filter((t) => t.is_active || t.is_completed)

  // Find max earnings per tournament for gold cell highlight
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
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-fairway mb-2">Results Grid</h1>
          <p className="text-fairway/60">
            All picks and earnings by week. Sorted by total earnings.
          </p>
        </div>

        {relevantTournaments.length === 0 ? (
          <div className="card text-center py-16 text-fairway/50">
            <span className="text-4xl block mb-3">⛳</span>
            <p>No results yet. Check back after the Sony Open!</p>
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
                      {profile.display_name}
                    </td>
                    {relevantTournaments.map((t) => {
                      const pks = pickMap[profile.id]?.[t.id] ?? []
                      const cellEarnings = pks.reduce((s, p) => s + p.earnings, 0)
                      const isTopEarner = cellEarnings > 0 && cellEarnings === maxByTournament[t.id]

                      return (
                        <td
                          key={t.id}
                          className={`px-2 py-2.5 text-center align-top ${
                            isTopEarner ? 'bg-gold/10' : ''
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
                                <div className="font-medium text-fairway text-xs leading-tight">{pk.golfer}</div>
                                <div className={`earnings-num text-xs ${
                                  pk.earnings === 0
                                    ? 'text-fairway/30'
                                    : isTopEarner
                                    ? 'text-gold-dark font-semibold'
                                    : 'text-fairway'
                                }`}>
                                  {pk.earnings === 0
                                    ? t.is_completed ? '$0' : '—'
                                    : formatCurrency(pk.earnings)
                                  }
                                </div>
                                {isTopEarner && pk.earnings > 0 && (
                                  <div className="text-gold text-xs">⭐</div>
                                )}
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
          <span className="flex items-center gap-1"><span className="text-fairway/25">—</span> No pick / missed deadline</span>
        </div>
      </div>
    </div>
  )
}
