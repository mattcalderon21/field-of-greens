'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Tournament, Golfer, Profile, Pick, TournamentField } from '@/lib/types'

type Tab = 'tournaments' | 'fields' | 'results' | 'picks' | 'users'

// ── Tournament Management ──────────────────────────────────────────────────

function TournamentsPanel() {
  const supabase = createClient()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<number | null>(null)
  const [editData, setEditData] = useState<Partial<Tournament>>({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('tournaments')
      .select('*')
      .order('start_date', { ascending: true })
      .then(({ data }) => {
        setTournaments(data ?? [])
        setLoading(false)
      })
  }, [supabase])

  const startEdit = (t: Tournament) => {
    setEditId(t.id)
    setEditData({ ...t })
  }

  const cancelEdit = () => {
    setEditId(null)
    setEditData({})
  }

  const saveEdit = async () => {
    if (!editId) return
    setSaving(true)
    const { error } = await supabase
      .from('tournaments')
      .update(editData)
      .eq('id', editId)

    if (error) {
      setMsg(`Error: ${error.message}`)
    } else {
      setTournaments((prev) => prev.map((t) => t.id === editId ? { ...t, ...editData } as Tournament : t))
      setMsg('Saved!')
      cancelEdit()
    }
    setSaving(false)
  }

  const toggleStatus = async (id: number, field: 'is_active' | 'is_completed', value: boolean) => {
    // If setting is_active = true, first clear all other active tournaments
    if (field === 'is_active' && value) {
      await supabase.from('tournaments').update({ is_active: false }).neq('id', id)
    }
    const { error } = await supabase.from('tournaments').update({ [field]: value }).eq('id', id)
    if (!error) {
      setTournaments((prev) => prev.map((t) => {
        if (field === 'is_active' && value) return t.id === id ? { ...t, is_active: true } : { ...t, is_active: false }
        return t.id === id ? { ...t, [field]: value } : t
      }))
    }
  }

  if (loading) return <div className="text-fairway/50 text-center py-8">Loading…</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold text-fairway">Tournament Management</h2>
        {msg && <span className="text-sm text-gold">{msg}</span>}
      </div>

      <div className="space-y-2">
        {tournaments.map((t) => (
          <div key={t.id} className={`rounded-xl border p-4 ${t.is_active ? 'border-gold/40 bg-gold/5' : 'border-cream-dark bg-white'}`}>
            {editId === t.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Name</label>
                    <input className="input" value={editData.name ?? ''} onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Course</label>
                    <input className="input" value={editData.course ?? ''} onChange={(e) => setEditData((d) => ({ ...d, course: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Purse ($)</label>
                    <input className="input" type="number" value={editData.purse ?? ''} onChange={(e) => setEditData((d) => ({ ...d, purse: Number(e.target.value) || null }))} />
                  </div>
                  <div>
                    <label className="label">Purse Rank</label>
                    <input className="input" type="number" value={editData.purse_rank ?? ''} onChange={(e) => setEditData((d) => ({ ...d, purse_rank: Number(e.target.value) || null }))} />
                  </div>
                  <div>
                    <label className="label">Max Picks Per User</label>
                    <input className="input" type="number" min={1} max={4} value={editData.max_picks_per_user ?? 1} onChange={(e) => setEditData((d) => ({ ...d, max_picks_per_user: Number(e.target.value) }))} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={saving} className="btn-primary text-sm">
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={cancelEdit} className="btn-ghost text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-fairway flex items-center gap-2">
                    {t.name}
                    {t.is_active && <span className="text-xs bg-gold/20 text-gold-dark px-2 py-0.5 rounded-full">Active</span>}
                    {t.is_completed && <span className="text-xs bg-fairway/10 text-fairway px-2 py-0.5 rounded-full">Completed</span>}
                  </div>
                  <div className="text-xs text-fairway/50 mt-0.5">{formatDate(t.start_date)} · {t.course} · {formatCurrency(t.purse ?? 0)}</div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => toggleStatus(t.id, 'is_active', !t.is_active)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${t.is_active ? 'bg-gold text-fairway-dark border-gold' : 'border-cream-darker text-fairway/60 hover:border-fairway'}`}
                  >
                    {t.is_active ? 'Active ✓' : 'Set Active'}
                  </button>
                  <button
                    onClick={() => toggleStatus(t.id, 'is_completed', !t.is_completed)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${t.is_completed ? 'bg-fairway text-cream border-fairway' : 'border-cream-darker text-fairway/60 hover:border-fairway'}`}
                  >
                    {t.is_completed ? 'Completed ✓' : 'Mark Complete'}
                  </button>
                  <button onClick={() => startEdit(t)} className="text-xs px-3 py-1.5 rounded-lg border border-cream-darker text-fairway/60 hover:border-fairway transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Field Management ───────────────────────────────────────────────────────

function FieldPanel() {
  const supabase = createClient()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedTournament, setSelectedTournament] = useState<number | null>(null)
  const [field, setField] = useState<TournamentField[]>([])
  const [allGolfers, setAllGolfers] = useState<Golfer[]>([])
  const [addGolferId, setAddGolferId] = useState<number | ''>('')
  const [teeTime, setTeeTime] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      supabase.from('tournaments').select('*').order('start_date', { ascending: true }),
      supabase.from('golfers').select('*').order('name'),
    ]).then(([{ data: t }, { data: g }]) => {
      setTournaments(t ?? [])
      setAllGolfers(g ?? [])
      setLoading(false)
    })
  }, [supabase])

  const loadField = async (tid: number) => {
    const { data } = await supabase
      .from('tournament_fields')
      .select('*, golfer:golfers(*)')
      .eq('tournament_id', tid)
      .order('golfer(name)', { ascending: true })
    setField((data ?? []) as TournamentField[])
  }

  const handleSelectTournament = async (tid: number) => {
    setSelectedTournament(tid)
    await loadField(tid)
  }

  const addToField = async () => {
    if (!selectedTournament || !addGolferId) return
    setSaving(true)
    const { error } = await supabase.from('tournament_fields').upsert({
      tournament_id: selectedTournament,
      golfer_id: Number(addGolferId),
      tee_time_r1: teeTime || null,
    }, { onConflict: 'tournament_id,golfer_id' })
    if (error) setMsg(`Error: ${error.message}`)
    else {
      setMsg('Added to field!')
      setAddGolferId('')
      setTeeTime('')
      await loadField(selectedTournament)
    }
    setSaving(false)
  }

  const removeFromField = async (fieldId: number) => {
    await supabase.from('tournament_fields').delete().eq('id', fieldId)
    if (selectedTournament) await loadField(selectedTournament)
  }

  const updateTeeTime = async (fieldId: number, time: string) => {
    await supabase.from('tournament_fields').update({ tee_time_r1: time || null }).eq('id', fieldId)
    if (selectedTournament) await loadField(selectedTournament)
  }

  if (loading) return <div className="text-fairway/50 text-center py-8">Loading…</div>

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-fairway mb-4">Field Management</h2>

      <div className="mb-4">
        <label className="label">Select Tournament</label>
        <select
          className="input max-w-md"
          value={selectedTournament ?? ''}
          onChange={(e) => handleSelectTournament(Number(e.target.value))}
        >
          <option value="">— Select a tournament —</option>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {formatDate(t.start_date)} · {t.name}
            </option>
          ))}
        </select>
      </div>

      {selectedTournament && (
        <>
          {/* Add golfer */}
          <div className="card mb-4">
            <h3 className="font-semibold text-fairway mb-3">Add Golfer to Field</h3>
            <div className="flex flex-wrap gap-3">
              <select
                className="input flex-1"
                value={addGolferId}
                onChange={(e) => setAddGolferId(Number(e.target.value) || '')}
              >
                <option value="">— Select golfer —</option>
                {allGolfers
                  .filter((g) => !field.find((f) => f.golfer_id === g.id))
                  .map((g) => (
                    <option key={g.id} value={g.id}>{g.name}{g.world_rank ? ` (WR #${g.world_rank})` : ''}</option>
                  ))}
              </select>
              <input
                className="input w-48"
                type="datetime-local"
                value={teeTime}
                onChange={(e) => setTeeTime(e.target.value)}
                placeholder="R1 Tee time"
              />
              <button onClick={addToField} disabled={saving || !addGolferId} className="btn-primary">
                Add
              </button>
            </div>
            {msg && <p className="text-sm text-gold mt-2">{msg}</p>}
          </div>

          {/* Current field */}
          <div className="card p-0 overflow-hidden">
            <div className="bg-fairway text-cream text-sm px-4 py-2 flex justify-between">
              <span className="font-medium">Golfers in Field ({field.length})</span>
              <span className="text-cream/60">R1 Tee Time</span>
            </div>
            <div className="divide-y divide-cream-dark max-h-96 overflow-y-auto">
              {field.length === 0 ? (
                <div className="px-4 py-6 text-center text-fairway/50 text-sm">No golfers added yet</div>
              ) : (
                field.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="flex-1 text-sm font-medium text-fairway">{f.golfer?.name}</div>
                    <input
                      type="datetime-local"
                      className="input text-xs py-1 w-44"
                      defaultValue={f.tee_time_r1 ? new Date(f.tee_time_r1).toISOString().slice(0, 16) : ''}
                      onBlur={(e) => updateTeeTime(f.id, e.target.value)}
                    />
                    <button
                      onClick={() => removeFromField(f.id)}
                      className="text-red-500 hover:text-red-700 text-sm px-2"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Results Entry ──────────────────────────────────────────────────────────

function ResultsPanel() {
  const supabase = createClient()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedTournament, setSelectedTournament] = useState<number | null>(null)
  const [field, setField] = useState<TournamentField[]>([])
  const [earnings, setEarnings] = useState<Record<number, string>>({})
  const [positions, setPositions] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('tournaments')
      .select('*')
      .or('is_active.eq.true,is_completed.eq.true')
      .order('start_date', { ascending: false })
      .then(({ data }) => setTournaments(data ?? []))
  }, [supabase])

  const loadField = async (tid: number) => {
    const { data } = await supabase
      .from('tournament_fields')
      .select('*, golfer:golfers(name)')
      .eq('tournament_id', tid)
      .order('golfer(name)', { ascending: true })
    const f = (data ?? []) as TournamentField[]
    setField(f)
    const earn: Record<number, string> = {}
    const pos: Record<number, string> = {}
    f.forEach((tf) => {
      earn[tf.id] = tf.earnings != null ? String(tf.earnings) : ''
      pos[tf.id] = tf.finish_position ?? ''
    })
    setEarnings(earn)
    setPositions(pos)
  }

  const handleSelectTournament = async (tid: number) => {
    setSelectedTournament(tid)
    await loadField(tid)
  }

  const saveResults = async () => {
    if (!selectedTournament) return
    setSaving(true)
    setMsg(null)

    // Update tournament_fields
    for (const tf of field) {
      const earningsVal = earnings[tf.id] !== '' ? Number(earnings[tf.id]) : null
      await supabase
        .from('tournament_fields')
        .update({ earnings: earningsVal, finish_position: positions[tf.id] || null })
        .eq('id', tf.id)
    }

    // Update picks.earnings by matching golfer picks for this tournament
    const { data: picks } = await supabase
      .from('picks')
      .select('id, golfer_id')
      .eq('tournament_id', selectedTournament)

    if (picks) {
      for (const pick of picks) {
        const tf = field.find((f) => f.golfer_id === pick.golfer_id)
        if (tf) {
          const earningsVal = earnings[tf.id] !== '' ? Number(earnings[tf.id]) : 0
          await supabase.from('picks').update({ earnings: earningsVal, is_locked: true }).eq('id', pick.id)
        }
      }
    }

    setMsg('Results saved and picks updated!')
    setSaving(false)
  }

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-fairway mb-4">Results Entry</h2>

      <div className="mb-4">
        <label className="label">Select Tournament</label>
        <select
          className="input max-w-md"
          value={selectedTournament ?? ''}
          onChange={(e) => handleSelectTournament(Number(e.target.value))}
        >
          <option value="">— Select a tournament —</option>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {formatDate(t.start_date)} · {t.name}
            </option>
          ))}
        </select>
      </div>

      {selectedTournament && field.length > 0 && (
        <>
          <div className="card p-0 overflow-hidden mb-4">
            <div className="bg-fairway text-cream text-sm px-4 py-2 grid grid-cols-3 gap-3">
              <span className="font-medium">Golfer</span>
              <span className="font-medium">Finish Pos.</span>
              <span className="font-medium">Earnings ($)</span>
            </div>
            <div className="divide-y divide-cream-dark max-h-[500px] overflow-y-auto">
              {field.map((tf) => (
                <div key={tf.id} className="grid grid-cols-3 gap-3 items-center px-4 py-2">
                  <span className="text-sm font-medium text-fairway">{tf.golfer?.name}</span>
                  <input
                    className="input text-sm py-1.5"
                    placeholder="e.g. T3, CUT, WD"
                    value={positions[tf.id] ?? ''}
                    onChange={(e) => setPositions((p) => ({ ...p, [tf.id]: e.target.value }))}
                  />
                  <input
                    className="input text-sm py-1.5 earnings-num"
                    type="number"
                    placeholder="0"
                    min={0}
                    value={earnings[tf.id] ?? ''}
                    onChange={(e) => setEarnings((p) => ({ ...p, [tf.id]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={saveResults} disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : 'Save Results & Update Picks'}
            </button>
            {msg && <span className="text-sm text-gold">{msg}</span>}
          </div>
        </>
      )}
    </div>
  )
}

// ── Picks Overview ─────────────────────────────────────────────────────────

function PicksPanel() {
  const supabase = createClient()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedTournament, setSelectedTournament] = useState<number | null>(null)
  const [picks, setPicks] = useState<Pick[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('tournaments').select('*').order('start_date', { ascending: false })
      .then(({ data }) => setTournaments(data ?? []))
  }, [supabase])

  const loadPicks = async (tid: number) => {
    setLoading(true)
    const { data } = await supabase
      .from('picks')
      .select('*, golfer:golfers(name), profile:profiles(display_name)')
      .eq('tournament_id', tid)
    setPicks((data ?? []) as Pick[])
    setLoading(false)
  }

  const lockPick = async (pickId: number, lock: boolean) => {
    await supabase.from('picks').update({ is_locked: lock }).eq('id', pickId)
    if (selectedTournament) await loadPicks(selectedTournament)
  }

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-fairway mb-4">Picks Overview</h2>

      <div className="mb-4">
        <label className="label">Select Tournament</label>
        <select
          className="input max-w-md"
          value={selectedTournament ?? ''}
          onChange={(e) => { const v = Number(e.target.value); setSelectedTournament(v); loadPicks(v) }}
        >
          <option value="">— Select a tournament —</option>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>{formatDate(t.start_date)} · {t.name}</option>
          ))}
        </select>
      </div>

      {loading && <div className="text-fairway/50 text-center py-4">Loading…</div>}

      {!loading && picks.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-fairway text-cream">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Contestant</th>
                <th className="px-4 py-2.5 text-left font-medium">Golfer</th>
                <th className="px-4 py-2.5 text-right font-medium">Earnings</th>
                <th className="px-4 py-2.5 text-center font-medium">Locked</th>
                <th className="px-4 py-2.5 text-center font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-dark">
              {picks.map((pick) => (
                <tr key={pick.id}>
                  <td className="px-4 py-2.5 font-medium text-fairway">
                    {(pick.profile as { display_name: string } | null)?.display_name ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-fairway">
                    {(pick.golfer as { name: string } | null)?.name ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right earnings-num text-fairway">
                    {formatCurrency(pick.earnings)}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {pick.is_locked ? (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">🔒 Locked</span>
                    ) : (
                      <span className="text-xs bg-fairway/10 text-fairway px-2 py-0.5 rounded-full">Open</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={() => lockPick(pick.id, !pick.is_locked)}
                      className="text-xs border border-cream-darker px-2 py-1 rounded hover:bg-cream-dark transition-colors"
                    >
                      {pick.is_locked ? 'Unlock' : 'Lock'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && selectedTournament && picks.length === 0 && (
        <div className="card text-center py-8 text-fairway/50 text-sm">
          No picks submitted yet for this tournament.
        </div>
      )}
    </div>
  )
}

// ── Users Panel ────────────────────────────────────────────────────────────

function UsersPanel() {
  const supabase = createClient()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('profiles').select('*').order('display_name')
      .then(({ data }) => { setProfiles(data ?? []); setLoading(false) })
  }, [supabase])

  const toggleAdmin = async (id: string, current: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_admin: !current }).eq('id', id)
    if (!error) {
      setProfiles((prev) => prev.map((p) => p.id === id ? { ...p, is_admin: !current } : p))
      setMsg(`Admin status updated.`)
    }
  }

  const [burnedForUser, setBurnedForUser] = useState<{ userId: string; golfers: string[] } | null>(null)

  const viewBurned = async (userId: string, name: string) => {
    const { data } = await supabase
      .from('picks')
      .select('golfer:golfers(name)')
      .eq('user_id', userId)
    const names = (data ?? []).map((p) => (p.golfer as unknown as { name: string } | null)?.name ?? '—')
    setBurnedForUser({ userId, golfers: names })
  }

  if (loading) return <div className="text-fairway/50 text-center py-8">Loading…</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold text-fairway">Users & Contestants</h2>
        {msg && <span className="text-sm text-gold">{msg}</span>}
      </div>

      <div className="card p-0 overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-fairway text-cream">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Name</th>
              <th className="px-4 py-2.5 text-left font-medium">Email</th>
              <th className="px-4 py-2.5 text-center font-medium">Admin</th>
              <th className="px-4 py-2.5 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-dark">
            {profiles.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-fairway">{p.display_name}</td>
                <td className="px-4 py-3 text-fairway/60 text-xs">{p.email ?? '—'}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleAdmin(p.id, p.is_admin)}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      p.is_admin
                        ? 'bg-gold text-fairway-dark border-gold'
                        : 'border-cream-darker text-fairway/50 hover:border-fairway'
                    }`}
                  >
                    {p.is_admin ? '★ Admin' : 'User'}
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => viewBurned(p.id, p.display_name)}
                    className="text-xs text-gold hover:underline"
                  >
                    View burned
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {burnedForUser && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-fairway">Burned Golfers</h3>
            <button onClick={() => setBurnedForUser(null)} className="text-fairway/40 hover:text-fairway">✕</button>
          </div>
          {burnedForUser.golfers.length === 0 ? (
            <p className="text-sm text-fairway/50">No picks yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {burnedForUser.golfers.map((name, i) => (
                <span key={i} className="text-sm bg-red-50 border border-red-100 text-red-700 px-3 py-1 rounded-full">
                  🔥 {name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Admin Golfer Management ────────────────────────────────────────────────

function GolfersPanel() {
  const supabase = createClient()
  const [golfers, setGolfers] = useState<Golfer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [newName, setNewName] = useState('')
  const [newRank, setNewRank] = useState('')
  const [newTour, setNewTour] = useState('PGA Tour')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('golfers').select('*').order('name')
      .then(({ data }) => { setGolfers(data ?? []); setLoading(false) })
  }, [supabase])

  const addGolfer = async () => {
    if (!newName.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('golfers').insert({
      name: newName.trim(),
      world_rank: newRank ? Number(newRank) : null,
      primary_tour: newTour,
    }).select().single()
    if (error) setMsg(`Error: ${error.message}`)
    else {
      setGolfers((prev) => [...prev, data as Golfer].sort((a, b) => a.name.localeCompare(b.name)))
      setNewName(''); setNewRank('')
      setMsg('Golfer added!')
    }
    setSaving(false)
  }

  const filtered = golfers.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div className="text-fairway/50 text-center py-8">Loading…</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold text-fairway">Golfer Pool ({golfers.length})</h2>
        {msg && <span className="text-sm text-gold">{msg}</span>}
      </div>

      {/* Add golfer */}
      <div className="card mb-4">
        <h3 className="font-semibold text-fairway mb-3">Add New Golfer</h3>
        <div className="flex flex-wrap gap-3">
          <input className="input flex-1" placeholder="Full name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <input className="input w-32" placeholder="World rank" type="number" value={newRank} onChange={(e) => setNewRank(e.target.value)} />
          <select className="input w-36" value={newTour} onChange={(e) => setNewTour(e.target.value)}>
            <option>PGA Tour</option>
            <option>LIV Golf</option>
            <option>DP World Tour</option>
            <option>Korn Ferry Tour</option>
          </select>
          <button onClick={addGolfer} disabled={saving || !newName.trim()} className="btn-primary">Add</button>
        </div>
      </div>

      <input
        className="input mb-3 max-w-sm"
        placeholder="Search golfers…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="card p-0 overflow-hidden">
        <div className="max-h-96 overflow-y-auto divide-y divide-cream-dark">
          {filtered.map((g) => (
            <div key={g.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="flex-1 text-sm font-medium text-fairway">{g.name}</div>
              {g.world_rank && <span className="text-xs text-fairway/40 earnings-num">WR #{g.world_rank}</span>}
              <span className="text-xs text-fairway/40">{g.primary_tour}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Admin Layout ──────────────────────────────────────────────────────

export default function AdminClient() {
  const [tab, setTab] = useState<Tab>('tournaments')

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'tournaments', label: 'Tournaments', icon: '📅' },
    { key: 'fields', label: 'Fields', icon: '🏌️' },
    { key: 'results', label: 'Results', icon: '📊' },
    { key: 'picks', label: 'Picks', icon: '🎯' },
    { key: 'users', label: 'Users', icon: '👥' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-fairway mb-1">Admin Panel</h1>
        <p className="text-fairway/60">Manage tournaments, fields, results, and contestants.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-cream-dark mb-8 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'border-gold text-gold-dark'
                : 'border-transparent text-fairway/60 hover:text-fairway'
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Panel content */}
      {tab === 'tournaments' && <TournamentsPanel />}
      {tab === 'fields' && <FieldPanel />}
      {tab === 'results' && <ResultsPanel />}
      {tab === 'picks' && <PicksPanel />}
      {tab === 'users' && <UsersPanel />}
    </div>
  )
}
