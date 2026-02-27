'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatCountdown, isPickDeadlinePassed } from '@/lib/utils'
import type { Tournament, Golfer, TournamentField, Pick, Profile } from '@/lib/types'

type Props = {
  userId: string
  profile: Profile
  activeTournaments: Tournament[]
  burnedGolferIds: number[]
}

type TournamentPickState = {
  field: TournamentField[]
  currentPicks: Pick[]
  loading: boolean
  saving: boolean
  error: string | null
  success: string | null
  selectedGolferIds: (number | null)[]
}

function PickForm({
  tournament,
  state,
  burnedGolferIds,
  onSelect,
  onSubmit,
}: {
  tournament: Tournament
  state: TournamentPickState
  burnedGolferIds: number[]
  onSelect: (slot: number, golferId: number | null) => void
  onSubmit: (tournamentId: number) => void
}) {
  const { field, currentPicks, loading, saving, error, success, selectedGolferIds } = state
  const numSlots = tournament.max_picks_per_user ?? 1

  // Determine deadline from earliest tee time in field
  const earliestTeeTime = field
    .map((f) => f.tee_time_r1)
    .filter(Boolean)
    .sort()[0] ?? null

  const deadlinePassed = isPickDeadlinePassed(earliestTeeTime)

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-6 bg-cream-dark rounded w-1/3 mb-4" />
        <div className="h-10 bg-cream-dark rounded" />
      </div>
    )
  }

  return (
    <div className={`card border-2 ${deadlinePassed ? 'border-red-200 bg-red-50/30' : 'border-gold/30 bg-gold/5'}`}>
      {/* Tournament header */}
      <div className="flex items-start justify-between flex-wrap gap-2 mb-5">
        <div>
          <h2 className="font-display text-xl font-bold text-fairway">⛳ {tournament.name}</h2>
          <p className="text-sm text-fairway/60 mt-0.5">{tournament.course} · {tournament.location}</p>
          {tournament.purse && (
            <p className="text-sm text-fairway/50 mt-0.5">Purse: <span className="earnings-num">{formatCurrency(tournament.purse)}</span></p>
          )}
        </div>
        <div className="text-right">
          {deadlinePassed ? (
            <span className="inline-flex items-center gap-1 text-red-600 text-sm font-medium bg-red-100 px-3 py-1 rounded-full">
              🔒 Locked
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-gold-dark text-sm font-medium bg-gold/10 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              Open
            </span>
          )}
          {earliestTeeTime && !deadlinePassed && (
            <p className="text-xs text-fairway/50 mt-1">{formatCountdown(earliestTeeTime)}</p>
          )}
        </div>
      </div>

      {numSlots === 2 && (
        <div className="mb-4 bg-fairway/5 border border-fairway/10 rounded-lg px-4 py-2 text-sm text-fairway/70">
          <strong>Team event:</strong> Select 2 golfers for the Zurich Classic.
        </div>
      )}

      {/* Golfer selection */}
      {Array.from({ length: numSlots }).map((_, slot) => {
        const existingPick = currentPicks.find((p) => p.pick_number === slot + 1) ?? null
        const isLocked = existingPick?.is_locked ?? false
        const selectedId = selectedGolferIds[slot]

        return (
          <div key={slot} className={`mb-4 ${slot > 0 ? 'pt-4 border-t border-cream-dark' : ''}`}>
            {numSlots > 1 && (
              <label className="block text-sm font-semibold text-fairway mb-2">
                Pick #{slot + 1}
              </label>
            )}

            {isLocked ? (
              <div className="bg-cream-dark rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-fairway">{existingPick?.golfer?.name ?? '—'}</span>
                    <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Locked</span>
                  </div>
                  <span className="earnings-num font-semibold text-fairway">
                    {formatCurrency(existingPick?.earnings ?? 0)}
                  </span>
                </div>
              </div>
            ) : (
              <select
                value={selectedId ?? ''}
                onChange={(e) => onSelect(slot, e.target.value ? Number(e.target.value) : null)}
                disabled={deadlinePassed || saving}
                className="input"
              >
                <option value="">— Select a golfer —</option>
                {field
                  .sort((a, b) => (a.golfer?.name ?? '').localeCompare(b.golfer?.name ?? ''))
                  .map((tf) => {
                    const golfer = tf.golfer!
                    const isBurned = burnedGolferIds.includes(golfer.id)
                    const teedOff = isPickDeadlinePassed(tf.tee_time_r1)
                    // Allow the golfer that's already selected even if teed off
                    const alreadyMyPick = selectedGolferIds.includes(golfer.id)
                    const otherSlotSelected = selectedGolferIds.some((id, i) => i !== slot && id === golfer.id)

                    const disabled = isBurned || (teedOff && !alreadyMyPick) || otherSlotSelected

                    return (
                      <option
                        key={golfer.id}
                        value={golfer.id}
                        disabled={disabled}
                      >
                        {golfer.name}
                        {isBurned ? ' 🔥 (burned)' : ''}
                        {teedOff && !isBurned ? ' 🔒 (teed off)' : ''}
                        {golfer.world_rank ? ` — WR #${golfer.world_rank}` : ''}
                      </option>
                    )
                  })}
              </select>
            )}

            {existingPick && !isLocked && (
              <p className="text-xs text-fairway/50 mt-1.5">
                Current pick: <strong>{existingPick.golfer?.name}</strong> — can be changed until tee off.
              </p>
            )}
          </div>
        )
      })}

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-fairway/10 border border-fairway/20 text-fairway text-sm rounded-lg p-3 mb-4 flex items-center gap-2">
          <span>✅</span> {success}
        </div>
      )}

      {/* Submit */}
      {!deadlinePassed && (
        <button
          onClick={() => onSubmit(tournament.id)}
          disabled={saving || selectedGolferIds.every((id) => id === null) || deadlinePassed}
          className="btn-primary w-full"
        >
          {saving ? 'Saving…' : currentPicks.length > 0 ? 'Update Pick' : 'Submit Pick'}
        </button>
      )}

      {deadlinePassed && currentPicks.length === 0 && (
        <div className="text-center text-sm text-red-500 mt-2">
          Deadline passed — no pick recorded for this tournament.
        </div>
      )}
    </div>
  )
}

function BurnedList({ burnedGolferIds, allGolfers }: { burnedGolferIds: number[]; allGolfers: Map<number, string> }) {
  if (burnedGolferIds.length === 0) return null

  return (
    <div className="card mt-8">
      <h3 className="font-display text-lg font-bold text-fairway mb-3">
        🔥 Burned Golfers ({burnedGolferIds.length})
      </h3>
      <p className="text-sm text-fairway/60 mb-4">These golfers cannot be picked again this season.</p>
      <div className="flex flex-wrap gap-2">
        {burnedGolferIds.map((id) => (
          <span key={id} className="text-sm bg-red-50 border border-red-100 text-red-700 px-3 py-1 rounded-full">
            {allGolfers.get(id) ?? `Golfer #${id}`}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function PicksClient({ userId, profile, activeTournaments, burnedGolferIds: initialBurned }: Props) {
  const supabase = createClient()
  const [burnedGolferIds, setBurnedGolferIds] = useState<number[]>(initialBurned)
  const [tournamentStates, setTournamentStates] = useState<Record<number, TournamentPickState>>({})
  const [allGolfers, setAllGolfers] = useState<Map<number, string>>(new Map())

  const loadTournamentData = useCallback(async (tournamentId: number, numSlots: number) => {
    setTournamentStates((prev) => ({
      ...prev,
      [tournamentId]: {
        ...prev[tournamentId],
        loading: true,
        error: null,
      },
    }))

    const [{ data: field }, { data: currentPicks }] = await Promise.all([
      supabase
        .from('tournament_fields')
        .select('*, golfer:golfers(id, name, world_rank, primary_tour)')
        .eq('tournament_id', tournamentId),
      supabase
        .from('picks')
        .select('*, golfer:golfers(id, name, world_rank, primary_tour)')
        .eq('tournament_id', tournamentId)
        .eq('user_id', userId),
    ])

    const picks = (currentPicks ?? []) as Pick[]
    const selectedIds: (number | null)[] = Array.from({ length: numSlots }, (_, i) => {
      return picks.find((p) => p.pick_number === i + 1)?.golfer_id ?? null
    })

    setTournamentStates((prev) => ({
      ...prev,
      [tournamentId]: {
        field: (field as TournamentField[]) ?? [],
        currentPicks: picks,
        loading: false,
        saving: false,
        error: null,
        success: null,
        selectedGolferIds: selectedIds,
      },
    }))
  }, [supabase, userId])

  useEffect(() => {
    const golferMap = new Map<number, string>()

    const loadAll = async () => {
      // Load all golfers for burned display
      const { data: golfers } = await supabase.from('golfers').select('id, name')
      if (golfers) {
        golfers.forEach((g: Golfer) => golferMap.set(g.id, g.name))
        setAllGolfers(golferMap)
      }

      // Load data for each active tournament
      for (const t of activeTournaments) {
        await loadTournamentData(t.id, t.max_picks_per_user ?? 1)
      }
    }

    loadAll()
  }, [activeTournaments, loadTournamentData, supabase])

  const handleSelect = (tournamentId: number, slot: number, golferId: number | null) => {
    setTournamentStates((prev) => {
      const state = prev[tournamentId]
      if (!state) return prev
      const newIds = [...state.selectedGolferIds]
      newIds[slot] = golferId
      return { ...prev, [tournamentId]: { ...state, selectedGolferIds: newIds, error: null, success: null } }
    })
  }

  const handleSubmit = async (tournamentId: number) => {
    const state = tournamentStates[tournamentId]
    if (!state) return

    const tournament = activeTournaments.find((t) => t.id === tournamentId)
    if (!tournament) return

    const numSlots = tournament.max_picks_per_user ?? 1

    setTournamentStates((prev) => ({
      ...prev,
      [tournamentId]: { ...prev[tournamentId], saving: true, error: null, success: null },
    }))

    for (let slot = 0; slot < numSlots; slot++) {
      const golferId = state.selectedGolferIds[slot]

      // Check: at least slot 0 must be filled
      if (slot === 0 && !golferId) {
        setTournamentStates((prev) => ({
          ...prev,
          [tournamentId]: { ...prev[tournamentId], saving: false, error: 'Please select a golfer.' },
        }))
        return
      }
      if (!golferId) continue // optional second pick

      // Validate: not burned (unless it's their existing pick)
      const existingPick = state.currentPicks.find((p) => p.pick_number === slot + 1)
      const isExistingGolfer = existingPick?.golfer_id === golferId
      if (burnedGolferIds.includes(golferId) && !isExistingGolfer) {
        setTournamentStates((prev) => ({
          ...prev,
          [tournamentId]: { ...prev[tournamentId], saving: false, error: 'That golfer has already been used this season.' },
        }))
        return
      }

      // Validate: golfer hasn't teed off
      const fieldEntry = state.field.find((f) => f.golfer_id === golferId)
      if (fieldEntry?.tee_time_r1 && isPickDeadlinePassed(fieldEntry.tee_time_r1) && !isExistingGolfer) {
        setTournamentStates((prev) => ({
          ...prev,
          [tournamentId]: { ...prev[tournamentId], saving: false, error: 'That golfer has already teed off.' },
        }))
        return
      }

      // Validate: golfer is in the field
      if (!fieldEntry) {
        setTournamentStates((prev) => ({
          ...prev,
          [tournamentId]: { ...prev[tournamentId], saving: false, error: 'That golfer is not in this week\'s field.' },
        }))
        return
      }

      // Upsert pick
      const { error } = await supabase.from('picks').upsert(
        {
          user_id: userId,
          tournament_id: tournamentId,
          golfer_id: golferId,
          pick_number: slot + 1,
          submitted_at: new Date().toISOString(),
          earnings: 0,
          is_locked: false,
        },
        { onConflict: 'user_id,tournament_id,pick_number' }
      )

      if (error) {
        setTournamentStates((prev) => ({
          ...prev,
          [tournamentId]: { ...prev[tournamentId], saving: false, error: `Failed to save pick: ${error.message}` },
        }))
        return
      }
    }

    // Refresh burned list and picks
    const { data: allPicks } = await supabase
      .from('picks')
      .select('golfer_id')
      .eq('user_id', userId)

    setBurnedGolferIds((allPicks ?? []).map((p) => p.golfer_id))
    await loadTournamentData(tournamentId, numSlots)

    setTournamentStates((prev) => ({
      ...prev,
      [tournamentId]: { ...prev[tournamentId], saving: false, success: 'Pick saved! Good luck this week. 🏌️' },
    }))
  }

  if (activeTournaments.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="card">
          <span className="text-5xl block mb-4">⛳</span>
          <h1 className="font-display text-3xl font-bold text-fairway mb-3">No Active Tournament</h1>
          <p className="text-fairway/60">
            There&apos;s no active tournament right now. Picks open before each event&apos;s first tee time.
          </p>
          <p className="text-fairway/50 mt-2 text-sm">
            Check the <a href="/schedule" className="text-gold hover:underline">schedule</a> to see what&apos;s coming up.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-fairway mb-1">My Pick</h1>
        <p className="text-fairway/60">
          Welcome back, <strong>{profile.display_name}</strong>. Make your weekly selection below.
        </p>
      </div>

      {/* Active tournament pick forms */}
      <div className="space-y-6">
        {activeTournaments.map((tournament) => {
          const state = tournamentStates[tournament.id]
          return (
            <PickForm
              key={tournament.id}
              tournament={tournament}
              state={state ?? {
                field: [],
                currentPicks: [],
                loading: true,
                saving: false,
                error: null,
                success: null,
                selectedGolferIds: [null],
              }}
              burnedGolferIds={burnedGolferIds}
              onSelect={(slot, golferId) => handleSelect(tournament.id, slot, golferId)}
              onSubmit={handleSubmit}
            />
          )
        })}
      </div>

      {/* Burned golfers list */}
      <BurnedList burnedGolferIds={burnedGolferIds} allGolfers={allGolfers} />
    </div>
  )
}
