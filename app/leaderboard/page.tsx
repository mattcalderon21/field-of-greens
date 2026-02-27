import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'

export const metadata = { title: 'Leaderboard — The Field of Greens' }
export const revalidate = 60 // revalidate every minute

async function getLeaderboard() {
  const supabase = createClient()

  // Get all profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, email')

  if (!profiles?.length) return []

  // Get all picks with golfer + tournament info
  const { data: picks } = await supabase
    .from('picks')
    .select(`
      user_id, earnings, tournament_id, pick_number,
      golfer:golfers(name),
      tournament:tournaments(name, is_completed, start_date)
    `)
    .order('tournament_id', { ascending: false })

  if (!picks) return profiles.map((p) => ({
    ...p,
    total_earnings: 0,
    last_pick: null,
    gap: 0,
    rank: 0,
  }))

  // Compute totals and last pick per user
  const dataByUser: Record<string, {
    total: number
    lastPick: { golfer: string; earnings: number; tournament: string } | null
  }> = {}

  for (const p of picks) {
    if (!dataByUser[p.user_id]) {
      dataByUser[p.user_id] = { total: 0, lastPick: null }
    }
    dataByUser[p.user_id].total += p.earnings ?? 0

    // Track last pick from completed tournament
    const tournament = p.tournament as { name: string; is_completed: boolean; start_date: string } | null
    if (tournament?.is_completed && !dataByUser[p.user_id].lastPick) {
      dataByUser[p.user_id].lastPick = {
        golfer: (p.golfer as { name: string } | null)?.name ?? '—',
        earnings: p.earnings ?? 0,
        tournament: tournament.name,
      }
    }
  }

  const ranked = profiles
    .map((profile) => ({
      ...profile,
      total_earnings: dataByUser[profile.id]?.total ?? 0,
      last_pick: dataByUser[profile.id]?.lastPick ?? null,
    }))
    .sort((a, b) => b.total_earnings - a.total_earnings)
    .map((entry, idx, arr) => ({
      ...entry,
      rank: idx + 1,
      gap: idx === 0 ? 0 : arr[0].total_earnings - entry.total_earnings,
    }))

  return ranked
}

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard()

  const podium = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl font-bold text-fairway mb-2">
          Season Leaderboard
        </h1>
        <p className="text-fairway/50 italic">"If you pick him, points will come."</p>
      </div>

      {leaderboard.length === 0 ? (
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
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Last Pick</th>
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
                      {entry.last_pick ? (
                        <div>
                          <span className="font-medium text-fairway">{entry.last_pick.golfer}</span>
                          <span className="text-fairway/40 ml-2 earnings-num">
                            {formatCurrency(entry.last_pick.earnings)}
                          </span>
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
