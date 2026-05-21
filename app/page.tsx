import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'

export const dynamic = 'force-dynamic'

async function getLeaderboardPreview() {
  const supabase = createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')

  if (!profiles?.length) return []

  const { data: picks } = await supabase
    .from('picks')
    .select('user_id, earnings, tournament_id')

  if (!picks) return []

  const earningsByUser: Record<string, number> = {}
  for (const pick of picks) {
    earningsByUser[pick.user_id] = (earningsByUser[pick.user_id] ?? 0) + (pick.earnings ?? 0)
  }

  const leaderboard = profiles
    .map((p) => ({ ...p, total: earningsByUser[p.id] ?? 0 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  return leaderboard
}

async function getCurrentWeekPicks(tournamentId: number, isCompleted: boolean) {
  const supabase = createClient()

  const [{ data: profiles }, { data: picks }] = await Promise.all([
    supabase.from('profiles').select('id, display_name'),
    supabase
      .from('picks')
      .select('user_id, earnings, golfer:golfers(name)')
      .eq('tournament_id', tournamentId),
  ])

  if (!profiles) return []

  const pickMap = new Map(
    (picks ?? []).map((p) => [
      p.user_id,
      {
        golfer_name: (p.golfer as unknown as { name: string } | null)?.name ?? null,
        earnings: (p.earnings as number) ?? 0,
      },
    ])
  )

  const rows = profiles.map((p) => ({
    display_name: p.display_name,
    golfer_name: pickMap.get(p.id)?.golfer_name ?? null,
    earnings: pickMap.get(p.id)?.earnings ?? 0,
  }))

  if (isCompleted) {
    rows.sort((a, b) => b.earnings - a.earnings)
  } else {
    rows.sort((a, b) => {
      if (!!a.golfer_name !== !!b.golfer_name) return a.golfer_name ? -1 : 1
      return a.display_name.localeCompare(b.display_name)
    })
  }

  return rows
}

async function getActiveTournament() {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  // Find any tournament marked active OR whose dates span today
  const { data } = await supabase
    .from('tournaments')
    .select('*')
    .eq('is_included_in_ond', true)
    .eq('is_completed', false)
    .or(`is_active.eq.true,and(start_date.lte.${today},end_date.gte.${today})`)
    .order('start_date', { ascending: true })
    .limit(1)
    .single()
  return data
}

const RULES = [
  { icon: '🏌️', text: 'Pick 1 golfer per tournament week — choose wisely.' },
  { icon: '🔥', text: 'Once burned, a golfer is gone for the season.' },
  { icon: '💰', text: 'Your points = your golfer\'s prize money that week.' },
  { icon: '⏰', text: 'Submit before your golfer tees off in Round 1.' },
  { icon: '🏆', text: 'Highest aggregate earnings after 36 events wins.' },
]

export default async function LandingPage({
  searchParams,
}: {
  searchParams: { error?: string; error_code?: string }
}) {
  // Supabase lands auth errors (expired links, access denied, etc.) on the
  // site root. Catch them here and bounce to the login page with context.
  if (searchParams.error) {
    const code = searchParams.error_code ?? searchParams.error
    redirect(`/login?error=${encodeURIComponent(code)}`)
  }

  const [leaderboard, activeTournament] = await Promise.all([
    getLeaderboardPreview(),
    getActiveTournament(),
  ])

  const weekPicks = activeTournament
    ? await getCurrentWeekPicks(activeTournament.id, activeTournament.is_completed)
    : []

  const leader = leaderboard[0]

  return (
    <div>
      {/* ── Hero ── */}
      <section className="bg-hero-gradient relative overflow-hidden">
        {/* Decorative golf texture */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, #c9a84c 0, #c9a84c 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }}
        />

        <div className="relative max-w-5xl mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 text-gold text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span>⛳</span>
            <span>2026 One-and-Done Season · Jan 15 – Aug 20</span>
          </div>

          <h1 className="font-display text-5xl sm:text-7xl font-bold text-cream leading-tight mb-4">
            The Field<br />
            <span className="text-gold">of Greens</span>
          </h1>

          <p className="text-cream/70 text-xl sm:text-2xl italic font-display mt-4 mb-10">
            "If you pick him, points will come."
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/leaderboard" className="btn-primary text-base px-8 py-3">
              View Leaderboard
            </Link>
            <Link href="/picks" className="bg-cream/10 border border-cream/30 text-cream font-semibold px-8 py-3 rounded-lg hover:bg-cream/20 transition-colors text-base">
              Make My Pick
            </Link>
          </div>

          {activeTournament && (
            <div className="mt-10 inline-flex items-center gap-2 bg-gold/10 border border-gold/20 text-gold text-sm px-5 py-2.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
              <span>Live now: <strong>{activeTournament.name}</strong></span>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-16 grid lg:grid-cols-2 gap-12">
        {/* ── Leaderboard Preview ── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl font-bold text-fairway">Season Standings</h2>
            <Link href="/leaderboard" className="text-sm text-gold font-medium hover:underline">
              Full leaderboard →
            </Link>
          </div>

          {leaderboard.length === 0 ? (
            <div className="card text-center text-fairway/50 py-12">
              <p>Season hasn't started yet. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, idx) => (
                <div
                  key={entry.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    idx === 0
                      ? 'bg-gold/10 border-gold/40 shadow-sm'
                      : 'bg-white border-cream-dark hover:border-cream-darker'
                  }`}
                >
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm flex-shrink-0 ${
                    idx === 0 ? 'bg-gold text-fairway-dark' :
                    idx === 1 ? 'bg-cream-darker text-fairway' :
                    idx === 2 ? 'bg-amber-700/20 text-amber-900' :
                    'bg-cream-dark text-fairway/60'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 font-semibold text-fairway">{entry.display_name}</div>
                  <div className="earnings-num font-semibold text-fairway">
                    {formatCurrency(entry.total)}
                  </div>
                  {idx === 0 && leader && (
                    <span className="text-xs text-gold font-medium bg-gold/10 px-2 py-0.5 rounded-full">LEADER</span>
                  )}
                  {idx > 0 && leader && (
                    <span className="text-xs text-fairway/40 earnings-num">
                      -{formatCurrency(leader.total - entry.total)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Rules ── */}
        <section>
          <h2 className="font-display text-2xl font-bold text-fairway mb-5">How It Works</h2>
          <div className="space-y-3">
            {RULES.map((rule, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-cream-dark">
                <span className="text-2xl flex-shrink-0">{rule.icon}</span>
                <p className="text-fairway/80 text-sm leading-relaxed">{rule.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 p-5 bg-fairway rounded-xl text-cream">
            <p className="font-display text-lg font-semibold mb-1">2026 Season</p>
            <p className="text-cream/70 text-sm">36 tournaments · Sony Open through BMW Championship</p>
            <p className="text-cream/70 text-sm mt-1">Midwest bragging rights on the line. 🌽</p>
            <Link href="/schedule" className="inline-block mt-4 text-gold text-sm font-medium hover:underline">
              View full schedule →
            </Link>
          </div>
        </section>
      </div>

      {/* ── This Week's Picks ── */}
      {activeTournament && weekPicks.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 pb-16">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl font-bold text-fairway">This Week&rsquo;s Picks</h2>
            <span className="text-sm text-fairway/50">{activeTournament.name}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {weekPicks.map((row) => (
              <div
                key={row.display_name}
                className={`p-4 rounded-xl border ${
                  row.golfer_name
                    ? 'bg-white border-cream-dark'
                    : 'bg-cream/40 border-cream-dark'
                }`}
              >
                <p className="text-xs text-fairway/50 font-medium uppercase tracking-wide truncate mb-1">
                  {row.display_name}
                </p>
                <p className={`font-semibold text-sm truncate ${row.golfer_name ? 'text-fairway' : 'text-fairway/30'}`}>
                  {row.golfer_name ?? '—'}
                </p>
                {activeTournament.is_completed && row.golfer_name && (
                  <p className="text-xs earnings-num text-gold mt-1">
                    {formatCurrency(row.earnings)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
