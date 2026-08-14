'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Tournament, Golfer, Profile, Pick, TournamentField, Season } from '@/lib/types'

type Tab = 'seasons' | 'tournaments' | 'fields' | 'results' | 'picks' | 'users'

// Shared helper — normalizes various copy-paste name formats to "First Last"
function normalizeName(raw: string): string {
  let name = raw.trim()
  // Strip trailing betting odds: "+650", "-120", "(+1400)", "(-105)"
  name = name.replace(/\s+\(?[+-]\d+\)?$/, '').trim()
  // Strip other trailing noise: +, #, *
  name = name.replace(/[\s+#*]+$/, '').trim()
  // Convert "Last, First" → "First Last"
  if (name.includes(',')) {
    const commaIdx = name.indexOf(',')
    const last = name.slice(0, commaIdx).trim()
    const first = name.slice(commaIdx + 1).trim()
    name = `${first} ${last}`
  }
  return name
}

// ── Tournament Management ──────────────────────────────────────────────────

function TournamentsPanel() {
  const supabase = createClient()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [seasonFilter, setSeasonFilter] = useState<number | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<number | null>(null)
  const [editData, setEditData] = useState<Partial<Tournament>>({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      supabase.from('tournaments').select('*').order('start_date', { ascending: true }),
      supabase.from('seasons').select('*').order('year', { ascending: false }),
    ]).then(([{ data: tData }, { data: sData }]) => {
      setTournaments(tData ?? [])
      setSeasons(sData ?? [])
      const current = (sData ?? []).find((s: Season) => s.is_current)
      if (current) setSeasonFilter(current.id)
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
    const { error } = await supabase.from('tournaments').update({ [field]: value }).eq('id', id)
    if (!error) {
      setTournaments((prev) => prev.map((t) => t.id === id ? { ...t, [field]: value } : t))
    }
  }

  if (loading) return <div className="text-fairway/50 text-center py-8">Loading…</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <h2 className="font-display text-xl font-bold text-fairway">Tournament Management</h2>
        <div className="flex items-center gap-3">
          {seasons.length > 1 && (
            <select
              className="input text-sm py-1.5"
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
            >
              <option value="all">All seasons</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>{s.year}</option>
              ))}
            </select>
          )}
          {msg && <span className="text-sm text-gold">{msg}</span>}
        </div>
      </div>

      <div className="space-y-2">
        {tournaments.filter((t) => seasonFilter === 'all' || t.season_id === seasonFilter).map((t) => (
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
  const [seasons, setSeasons] = useState<Season[]>([])
  const [seasonFilter, setSeasonFilter] = useState<number | 'all'>('all')
  const [selectedTournament, setSelectedTournament] = useState<number | null>(null)
  const [field, setField] = useState<TournamentField[]>([])
  const [allGolfers, setAllGolfers] = useState<Golfer[]>([])
  const [addGolferId, setAddGolferId] = useState<number | ''>('')
  const [teeTime, setTeeTime] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [bulkText, setBulkText] = useState('')
  const [bulkTour, setBulkTour] = useState('PGA Tour')
  const [bulkMsg, setBulkMsg] = useState<string | null>(null)
  const [bulkImporting, setBulkImporting] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('tournaments').select('*').order('start_date', { ascending: true }),
      supabase.from('golfers').select('*').order('name'),
      supabase.from('seasons').select('*').order('year', { ascending: false }),
    ]).then(([{ data: t }, { data: g }, { data: sData }]) => {
      setTournaments(t ?? [])
      setAllGolfers(g ?? [])
      setSeasons(sData ?? [])
      const current = (sData ?? []).find((s: Season) => s.is_current)
      if (current) setSeasonFilter(current.id)
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

  const bulkImportField = async () => {
    if (!selectedTournament || !bulkText.trim()) return
    setBulkImporting(true)
    setBulkMsg(null)

    const names = bulkText.split('\n').map((n) => normalizeName(n)).filter(Boolean)
    if (names.length === 0) { setBulkImporting(false); return }

    const existingMap = new Map(allGolfers.map((g) => [g.name.toLowerCase(), g]))
    const newNames = names.filter((n) => !existingMap.has(n.toLowerCase()))

    if (newNames.length > 0) {
      const { data: inserted, error } = await supabase
        .from('golfers')
        .insert(newNames.map((name) => ({ name, primary_tour: bulkTour })))
        .select()
      if (error) {
        setBulkMsg(`Error creating golfers: ${error.message}`)
        setBulkImporting(false)
        return
      }
      const newList = [...allGolfers, ...(inserted ?? [])]
      setAllGolfers(newList.sort((a, b) => a.name.localeCompare(b.name)));
      (inserted ?? []).forEach((g) => existingMap.set(g.name.toLowerCase(), g))
    }

    const fieldEntries = names
      .map((name) => {
        const g = existingMap.get(name.toLowerCase())
        return g ? { tournament_id: selectedTournament, golfer_id: g.id } : null
      })
      .filter((e): e is { tournament_id: number; golfer_id: number } => e !== null)

    const { error: fieldError } = await supabase
      .from('tournament_fields')
      .upsert(fieldEntries, { onConflict: 'tournament_id,golfer_id', ignoreDuplicates: true })

    if (fieldError) {
      setBulkMsg(`Error adding to field: ${fieldError.message}`)
    } else {
      const alreadyExisted = names.length - newNames.length
      setBulkMsg(`Done! ${fieldEntries.length} players added to field (${newNames.length} new golfers created, ${alreadyExisted} already existed).`)
      setBulkText('')
      await loadField(selectedTournament)
    }
    setBulkImporting(false)
  }

  if (loading) return <div className="text-fairway/50 text-center py-8">Loading…</div>

  const filteredTournaments = tournaments.filter(
    (t) => seasonFilter === 'all' || t.season_id === seasonFilter
  )

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-fairway mb-4">Field Management</h2>

      {seasons.length > 1 && (
        <div className="mb-3">
          <label className="label">Season</label>
          <select
            className="input max-w-xs"
            value={seasonFilter}
            onChange={(e) => {
              setSeasonFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))
              setSelectedTournament(null)
            }}
          >
            <option value="all">All seasons</option>
            {seasons.map((s) => <option key={s.id} value={s.id}>{s.year}</option>)}
          </select>
        </div>
      )}

      <div className="mb-4">
        <label className="label">Select Tournament</label>
        <select
          className="input max-w-md"
          value={selectedTournament ?? ''}
          onChange={(e) => handleSelectTournament(Number(e.target.value))}
        >
          <option value="">— Select a tournament —</option>
          {filteredTournaments.map((t) => (
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

          {/* Bulk Import */}
          <div className="card mb-4">
            <button
              className="flex items-center gap-2 w-full text-left font-semibold text-fairway"
              onClick={() => setShowBulkImport(!showBulkImport)}
            >
              <span className="text-xs">{showBulkImport ? '▼' : '▶'}</span>
              Bulk Import from List
            </button>
            {showBulkImport && (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-fairway/60">
                  Paste player names one per line (e.g. copied from a golf site). New golfers are created automatically.
                </p>
                <textarea
                  className="input w-full font-mono text-sm"
                  rows={8}
                  placeholder={'Scottie Scheffler\nRory McIlroy\nCollin Morikawa\n...'}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                />
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-fairway/70 whitespace-nowrap">Tour for new players:</label>
                    <select className="input py-1" value={bulkTour} onChange={(e) => setBulkTour(e.target.value)}>
                      <option>PGA Tour</option>
                      <option>LIV Golf</option>
                      <option>DP World Tour</option>
                      <option>Korn Ferry Tour</option>
                    </select>
                  </div>
                  <button
                    onClick={bulkImportField}
                    disabled={bulkImporting || !bulkText.trim()}
                    className="btn-primary"
                  >
                    {bulkImporting ? 'Importing…' : 'Import Players'}
                  </button>
                </div>
                {bulkMsg && <p className="text-sm text-gold">{bulkMsg}</p>}
              </div>
            )}
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
  const [seasons, setSeasons] = useState<Season[]>([])
  const [seasonFilter, setSeasonFilter] = useState<number | 'all'>('all')
  const [selectedTournament, setSelectedTournament] = useState<number | null>(null)
  const [field, setField] = useState<TournamentField[]>([])
  const [pickedGolferIds, setPickedGolferIds] = useState<Set<number>>(new Set())
  const [earnings, setEarnings] = useState<Record<number, string>>({})
  const [positions, setPositions] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkMsg, setBulkMsg] = useState<string | null>(null)
  const [bulkImporting, setBulkImporting] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase
        .from('tournaments')
        .select('*')
        .or('is_active.eq.true,is_completed.eq.true')
        .order('start_date', { ascending: false }),
      supabase.from('seasons').select('*').order('year', { ascending: false }),
    ]).then(([{ data: tData }, { data: sData }]) => {
      setTournaments(tData ?? [])
      setSeasons(sData ?? [])
      const current = (sData ?? []).find((s: Season) => s.is_current)
      if (current) setSeasonFilter(current.id)
    })
  }, [supabase])

  const loadField = async (tid: number) => {
    const [{ data }, { data: picksData }] = await Promise.all([
      supabase
        .from('tournament_fields')
        .select('*, golfer:golfers(name)')
        .eq('tournament_id', tid),
      supabase
        .from('picks')
        .select('golfer_id')
        .eq('tournament_id', tid),
    ])
    const f = (data ?? []) as TournamentField[]
    const pickedIds = new Set((picksData ?? []).map((p) => p.golfer_id as number))
    setPickedGolferIds(pickedIds)
    // Sort: picked golfers first, then alphabetically within each group
    const sorted = [...f].sort((a, b) => {
      const aPicked = pickedIds.has(a.golfer_id) ? 0 : 1
      const bPicked = pickedIds.has(b.golfer_id) ? 0 : 1
      if (aPicked !== bPicked) return aPicked - bPicked
      return (a.golfer?.name ?? '').localeCompare(b.golfer?.name ?? '')
    })
    setField(sorted)
    const earn: Record<number, string> = {}
    const pos: Record<number, string> = {}
    sorted.forEach((tf) => {
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

  const bulkImportResults = async () => {
    if (!selectedTournament || !bulkText.trim() || field.length === 0) return
    setBulkImporting(true)
    setBulkMsg(null)

    const nameMap = new Map(
      field.map((tf) => [(tf.golfer?.name ?? '').toLowerCase(), tf])
    )

    const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean)
    const updates: { tf: TournamentField; position: string; earningsVal: number }[] = []
    const unmatched: string[] = []

    for (const line of lines) {
      // Detect separator: tab, pipe, or comma
      let cols: string[]
      if (line.includes('\t')) {
        cols = line.split('\t')
      } else if (line.includes('|')) {
        cols = line.split('|')
      } else {
        // Split on first two commas to allow comma in position values
        const parts = line.split(',')
        cols = [parts[0], parts[1] ?? '', parts.slice(2).join(',')]
      }

      const rawName = normalizeName(cols[0] ?? '')
      const position = (cols[1] ?? '').trim()
      const earningsVal = parseFloat((cols[2] ?? '').replace(/[$,\s]/g, '')) || 0

      const tf = nameMap.get(rawName.toLowerCase())
      if (!tf) {
        unmatched.push(rawName)
        continue
      }
      updates.push({ tf, position, earningsVal })
    }

    // Update tournament_fields
    for (const { tf, position, earningsVal } of updates) {
      await supabase
        .from('tournament_fields')
        .update({ earnings: earningsVal || null, finish_position: position || null })
        .eq('id', tf.id)
    }

    // Update picks.earnings + is_locked
    if (updates.length > 0) {
      const { data: allPicks } = await supabase
        .from('picks')
        .select('id, golfer_id')
        .eq('tournament_id', selectedTournament)

      if (allPicks) {
        for (const pick of allPicks) {
          const update = updates.find((u) => u.tf.golfer_id === pick.golfer_id)
          if (update) {
            await supabase
              .from('picks')
              .update({ earnings: update.earningsVal, is_locked: true })
              .eq('id', pick.id)
          }
        }
      }
    }

    // Sync local state so manual table reflects changes immediately
    setEarnings((prev) => {
      const next = { ...prev }
      updates.forEach(({ tf, earningsVal }) => { next[tf.id] = earningsVal ? String(earningsVal) : '' })
      return next
    })
    setPositions((prev) => {
      const next = { ...prev }
      updates.forEach(({ tf, position }) => { next[tf.id] = position })
      return next
    })

    const unmatchedNote = unmatched.length > 0 ? ` Unmatched: ${unmatched.join(', ')}.` : ''
    setBulkMsg(`${updates.length} golfer${updates.length !== 1 ? 's' : ''} updated.${unmatchedNote}`)
    setBulkText('')
    setBulkImporting(false)
  }

  const filteredTournamentsResults = tournaments.filter(
    (t) => seasonFilter === 'all' || t.season_id === seasonFilter
  )

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-fairway mb-4">Results Entry</h2>

      {seasons.length > 1 && (
        <div className="mb-3">
          <label className="label">Season</label>
          <select
            className="input max-w-xs"
            value={seasonFilter}
            onChange={(e) => {
              setSeasonFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))
              setSelectedTournament(null)
            }}
          >
            <option value="all">All seasons</option>
            {seasons.map((s) => <option key={s.id} value={s.id}>{s.year}</option>)}
          </select>
        </div>
      )}

      <div className="mb-4">
        <label className="label">Select Tournament</label>
        <select
          className="input max-w-md"
          value={selectedTournament ?? ''}
          onChange={(e) => handleSelectTournament(Number(e.target.value))}
        >
          <option value="">— Select a tournament —</option>
          {filteredTournamentsResults.map((t) => (
            <option key={t.id} value={t.id}>
              {formatDate(t.start_date)} · {t.name}
            </option>
          ))}
        </select>
      </div>

      {selectedTournament && field.length > 0 && (
        <>
          {/* Bulk Import */}
          <div className="card mb-4">
            <button
              className="flex items-center gap-2 w-full text-left font-semibold text-fairway"
              onClick={() => setBulkOpen(!bulkOpen)}
            >
              <span className="text-xs">{bulkOpen ? '▼' : '▶'}</span>
              Bulk Import Results
            </button>
            {bulkOpen && (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-fairway/60">
                  Paste results one per line — columns separated by tab, comma, or pipe:<br />
                  <span className="font-mono">Golfer Name &nbsp; Finish Pos. &nbsp; Earnings</span><br />
                  Earnings can be omitted for CUT/WD (defaults to 0). Supports &ldquo;Last, First&rdquo; names.
                </p>
                <textarea
                  className="input w-full font-mono text-sm"
                  rows={10}
                  placeholder={'Scottie Scheffler\t1\t3600000\nRory McIlroy\tT2\t2160000\nXander Schauffele\tCUT\nScheffler, Scottie\t1\t$3,600,000'}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                />
                <div className="flex items-center gap-3">
                  <button
                    onClick={bulkImportResults}
                    disabled={bulkImporting || !bulkText.trim()}
                    className="btn-primary"
                  >
                    {bulkImporting ? 'Importing…' : 'Import Results'}
                  </button>
                  {bulkMsg && <span className="text-sm text-gold">{bulkMsg}</span>}
                </div>
              </div>
            )}
          </div>

          {/* Manual entry table */}
          <div className="card p-0 overflow-hidden mb-4">
            <div className="bg-fairway text-cream text-sm px-4 py-2 grid grid-cols-3 gap-3">
              <span className="font-medium">Golfer</span>
              <span className="font-medium">Finish Pos.</span>
              <span className="font-medium">Earnings ($)</span>
            </div>
            <div className="divide-y divide-cream-dark max-h-[500px] overflow-y-auto">
              {field.map((tf, idx) => {
                const isPicked = pickedGolferIds.has(tf.golfer_id)
                const prevPicked = idx > 0 ? pickedGolferIds.has(field[idx - 1].golfer_id) : true
                const showDivider = !isPicked && prevPicked && pickedGolferIds.size > 0
                return (
                  <div key={tf.id}>
                    {showDivider && (
                      <div className="px-4 py-1.5 text-xs text-fairway/40 bg-cream/60 border-b border-cream-dark">
                        — Rest of field —
                      </div>
                    )}
                    <div className={`grid grid-cols-3 gap-3 items-center px-4 py-2 ${isPicked ? 'bg-gold/5 border-l-2 border-gold' : ''}`}>
                      <span className="text-sm font-medium text-fairway flex items-center gap-2">
                        {tf.golfer?.name}
                        {isPicked && (
                          <span className="text-xs bg-gold/20 text-fairway px-1.5 py-0.5 rounded-full font-normal">Picked</span>
                        )}
                      </span>
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
                  </div>
                )
              })}
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
  const [seasons, setSeasons] = useState<Season[]>([])
  const [seasonFilter, setSeasonFilter] = useState<number | 'all'>('all')
  const [profiles, setProfiles] = useState<{ id: string; display_name: string }[]>([])
  const [selectedTournament, setSelectedTournament] = useState<number | null>(null)
  const [picks, setPicks] = useState<Pick[]>([])
  const [loading, setLoading] = useState(false)
  const [editPickId, setEditPickId] = useState<number | null>(null)
  const [editGolferId, setEditGolferId] = useState<number | ''>('')
  const [fieldGolfers, setFieldGolfers] = useState<{ golfer_id: number; name: string; earnings: number | null }[]>([])
  const [addUserId, setAddUserId] = useState<string>('')
  const [addGolferId, setAddGolferId] = useState<number | ''>('')
  const [addMsg, setAddMsg] = useState<string | null>(null)
  const [addingPick, setAddingPick] = useState(false)
  const [duplicateKeys, setDuplicateKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    Promise.all([
      supabase.from('tournaments').select('*').order('start_date', { ascending: false }),
      supabase.from('profiles').select('id, display_name').order('display_name'),
      supabase.from('seasons').select('*').order('year', { ascending: false }),
    ]).then(([{ data: t }, { data: p }, { data: sData }]) => {
      setTournaments(t ?? [])
      setProfiles(p ?? [])
      setSeasons(sData ?? [])
      const current = (sData ?? []).find((s: Season) => s.is_current)
      if (current) setSeasonFilter(current.id)
    })
  }, [supabase])

  const loadPicks = async (tid: number) => {
    setLoading(true)
    const [{ data: picksData }, { data: fieldData }] = await Promise.all([
      supabase
        .from('picks')
        .select('*, golfer:golfers(name), profile:profiles(display_name)')
        .eq('tournament_id', tid),
      supabase
        .from('tournament_fields')
        .select('golfer_id, earnings, golfer:golfers(name)')
        .eq('tournament_id', tid)
        .order('golfer(name)', { ascending: true }),
    ])
    setPicks((picksData ?? []) as Pick[])
    setFieldGolfers(
      (fieldData ?? []).map((tf) => ({
        golfer_id: tf.golfer_id as number,
        name: (tf.golfer as unknown as { name: string } | null)?.name ?? '',
        earnings: tf.earnings as number | null,
      }))
    )

    // Compute duplicate keys: any (user_id, golfer_id) picked more than once this season
    const selectedT = tournaments.find((t) => t.id === tid)
    if (selectedT?.season_id) {
      const seasonTIds = tournaments
        .filter((t) => t.season_id === selectedT.season_id)
        .map((t) => t.id)
      const { data: seasonPicksData } = await supabase
        .from('picks')
        .select('user_id, golfer_id')
        .in('tournament_id', seasonTIds)
      const counts = new Map<string, number>()
      for (const sp of seasonPicksData ?? []) {
        const k = `${sp.user_id}:${sp.golfer_id}`
        counts.set(k, (counts.get(k) ?? 0) + 1)
      }
      setDuplicateKeys(new Set(Array.from(counts.entries()).filter(([, n]) => n > 1).map(([k]) => k)))
    }

    setLoading(false)
  }

  const lockPick = async (pickId: number, lock: boolean) => {
    await supabase.from('picks').update({ is_locked: lock }).eq('id', pickId)
    if (selectedTournament) await loadPicks(selectedTournament)
  }

  const updatePick = async (pickId: number) => {
    if (!editGolferId) return
    const tf = fieldGolfers.find((g) => g.golfer_id === editGolferId)
    const earningsVal = tf?.earnings ?? 0
    await supabase
      .from('picks')
      .update({ golfer_id: editGolferId, earnings: earningsVal })
      .eq('id', pickId)
    setEditPickId(null)
    setEditGolferId('')
    if (selectedTournament) await loadPicks(selectedTournament)
  }

  const addPick = async () => {
    if (!selectedTournament || !addUserId || !addGolferId) return
    setAddingPick(true)
    setAddMsg(null)

    // Next pick_number for this user in this tournament
    const existingUserPicks = picks.filter((p) => p.user_id === addUserId)
    const pickNumber = existingUserPicks.length + 1

    // Carry forward earnings if results already entered
    const tf = fieldGolfers.find((g) => g.golfer_id === Number(addGolferId))
    const earnings = tf?.earnings ?? 0

    const { error } = await supabase.from('picks').upsert({
      user_id: addUserId,
      tournament_id: selectedTournament,
      golfer_id: Number(addGolferId),
      pick_number: pickNumber,
      earnings: earnings,
      is_locked: false,
      submitted_at: new Date().toISOString(),
    }, { onConflict: 'user_id,tournament_id,pick_number' })

    if (error) {
      setAddMsg(`Error: ${error.message}`)
    } else {
      setAddMsg('Pick added!')
      setAddUserId('')
      setAddGolferId('')
      await loadPicks(selectedTournament)
    }
    setAddingPick(false)
  }

  const deletePick = async (pickId: number) => {
    if (!confirm('Delete this pick? This cannot be undone.')) return
    await supabase.from('picks').delete().eq('id', pickId)
    if (selectedTournament) await loadPicks(selectedTournament)
  }

  const filteredTournamentsPicks = tournaments.filter(
    (t) => seasonFilter === 'all' || t.season_id === seasonFilter
  )

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-fairway mb-4">Picks Overview</h2>

      {seasons.length > 1 && (
        <div className="mb-3">
          <label className="label">Season</label>
          <select
            className="input max-w-xs"
            value={seasonFilter}
            onChange={(e) => {
              setSeasonFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))
              setSelectedTournament(null)
            }}
          >
            <option value="all">All seasons</option>
            {seasons.map((s) => <option key={s.id} value={s.id}>{s.year}</option>)}
          </select>
        </div>
      )}

      <div className="mb-4">
        <label className="label">Select Tournament</label>
        <select
          className="input max-w-md"
          value={selectedTournament ?? ''}
          onChange={(e) => { const v = Number(e.target.value); setSelectedTournament(v); loadPicks(v) }}
        >
          <option value="">— Select a tournament —</option>
          {filteredTournamentsPicks.map((t) => (
            <option key={t.id} value={t.id}>{formatDate(t.start_date)} · {t.name}</option>
          ))}
        </select>
      </div>

      {loading && <div className="text-fairway/50 text-center py-4">Loading…</div>}

      {/* Add Pick */}
      {!loading && selectedTournament !== null && (
        <div className="card mb-4">
          <h3 className="font-semibold text-fairway mb-3">Add Pick for Contestant</h3>
          <div className="flex flex-wrap gap-3">
            <select
              className="input flex-1 min-w-40"
              value={addUserId}
              onChange={(e) => setAddUserId(e.target.value)}
            >
              <option value="">— Select contestant —</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.display_name}</option>
              ))}
            </select>
            <select
              className="input flex-1 min-w-40"
              value={addGolferId}
              onChange={(e) => setAddGolferId(Number(e.target.value) || '')}
            >
              <option value="">— Select golfer —</option>
              {fieldGolfers.map((g) => (
                <option key={g.golfer_id} value={g.golfer_id}>{g.name}</option>
              ))}
            </select>
            <button
              onClick={addPick}
              disabled={addingPick || !addUserId || !addGolferId}
              className="btn-primary text-sm"
            >
              {addingPick ? 'Adding…' : 'Add Pick'}
            </button>
          </div>
          {addMsg && (
            <p className={`text-sm mt-2 ${addMsg.startsWith('Error') ? 'text-red-600' : 'text-gold'}`}>{addMsg}</p>
          )}
          {fieldGolfers.length === 0 && (
            <p className="text-xs text-fairway/40 mt-2">Load a tournament field first (Fields tab) to enable golfer selection.</p>
          )}
        </div>
      )}

      {!loading && picks.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-fairway text-cream">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Contestant</th>
                <th className="px-4 py-2.5 text-left font-medium">Golfer</th>
                <th className="px-4 py-2.5 text-right font-medium">Earnings</th>
                <th className="px-4 py-2.5 text-center font-medium">Locked</th>
                <th className="px-4 py-2.5 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-dark">
              {picks.map((pick) => {
                const isEditing = editPickId === pick.id
                const golferName = (pick.golfer as unknown as { name: string } | null)?.name ?? '—'
                return (
                  <tr key={pick.id}>
                    <td className="px-4 py-2.5 font-medium text-fairway">
                      {(pick.profile as unknown as { display_name: string } | null)?.display_name ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-fairway">
                      {isEditing ? (
                        <select
                          className="input text-sm py-1"
                          value={editGolferId}
                          onChange={(e) => setEditGolferId(Number(e.target.value))}
                        >
                          <option value="">— Select golfer —</option>
                          {fieldGolfers.map((g) => (
                            <option key={g.golfer_id} value={g.golfer_id}>{g.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="flex items-center gap-2">
                          {golferName}
                          {duplicateKeys.has(`${pick.user_id}:${pick.golfer_id}`) && (
                            <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">Duplicate</span>
                          )}
                        </span>
                      )}
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
                      {isEditing ? (
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => updatePick(pick.id)}
                            disabled={!editGolferId}
                            className="text-xs bg-fairway text-cream px-2 py-1 rounded hover:bg-fairway/80 transition-colors disabled:opacity-40"
                          >Save</button>
                          <button
                            onClick={() => { setEditPickId(null); setEditGolferId('') }}
                            className="text-xs border border-cream-darker px-2 py-1 rounded hover:bg-cream-dark transition-colors"
                          >Cancel</button>
                        </div>
                      ) : (
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => { setEditPickId(pick.id); setEditGolferId(pick.golfer_id) }}
                            className="text-xs border border-cream-darker px-2 py-1 rounded hover:bg-cream-dark transition-colors"
                          >Edit</button>
                          <button
                            onClick={() => lockPick(pick.id, !pick.is_locked)}
                            className="text-xs border border-cream-darker px-2 py-1 rounded hover:bg-cream-dark transition-colors"
                          >{pick.is_locked ? 'Unlock' : 'Lock'}</button>
                          <button
                            onClick={() => deletePick(pick.id)}
                            className="text-xs border border-red-200 text-red-500 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                          >Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
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
  const [seasons, setSeasons] = useState<Season[]>([])
  const [burnedSeasonId, setBurnedSeasonId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('*').order('display_name'),
      supabase.from('seasons').select('*').order('year', { ascending: false }),
    ]).then(([{ data: pData }, { data: sData }]) => {
      setProfiles(pData ?? [])
      setSeasons(sData ?? [])
      const current = (sData ?? []).find((s: Season) => s.is_current)
      if (current) setBurnedSeasonId(current.id)
      setLoading(false)
    })
  }, [supabase])

  const toggleAdmin = async (id: string, current: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_admin: !current }).eq('id', id)
    if (!error) {
      setProfiles((prev) => prev.map((p) => p.id === id ? { ...p, is_admin: !current } : p))
      setMsg(`Admin status updated.`)
    }
  }

  const [burnedForUser, setBurnedForUser] = useState<{ userId: string; golfers: string[] } | null>(null)

  const viewBurned = async (userId: string) => {
    let query = supabase
      .from('picks')
      .select('golfer:golfers(name), tournament:tournaments(season_id)')
      .eq('user_id', userId)

    if (burnedSeasonId !== null) {
      // Filter via join: only picks from tournaments in the selected season
      const { data: tids } = await supabase
        .from('tournaments')
        .select('id')
        .eq('season_id', burnedSeasonId)
      const ids = (tids ?? []).map((t: { id: number }) => t.id)
      if (ids.length > 0) {
        query = query.in('tournament_id', ids) as typeof query
      }
    }

    const { data } = await query
    const names = (data ?? []).map((p) => (p.golfer as unknown as { name: string } | null)?.name ?? '—')
    setBurnedForUser({ userId, golfers: names })
  }

  if (loading) return <div className="text-fairway/50 text-center py-8">Loading…</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <h2 className="font-display text-xl font-bold text-fairway">Users & Contestants</h2>
        <div className="flex items-center gap-3">
          {seasons.length > 1 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-fairway/50">Burned golfers:</span>
              <select
                className="input text-sm py-1.5"
                value={burnedSeasonId ?? ''}
                onChange={(e) => { setBurnedSeasonId(e.target.value ? parseInt(e.target.value, 10) : null); setBurnedForUser(null) }}
              >
                <option value="">All time</option>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>{s.year}</option>
                ))}
              </select>
            </div>
          )}
          {msg && <span className="text-sm text-gold">{msg}</span>}
        </div>
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
                    onClick={() => viewBurned(p.id)}
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

// ── Seasons Management ────────────────────────────────────────────────────

function SeasonsPanel() {
  const supabase = createClient()
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // New season form state
  const [newYear, setNewYear] = useState('')
  const [newName, setNewName] = useState('')
  const [newStart, setNewStart] = useState('')
  const [newEnd, setNewEnd] = useState('')
  const [newTotal, setNewTotal] = useState('36')

  useEffect(() => {
    supabase.from('seasons').select('*').order('year', { ascending: false })
      .then(({ data }) => { setSeasons(data ?? []); setLoading(false) })
  }, [supabase])

  const createSeason = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    const { data, error } = await supabase
      .from('seasons')
      .insert({
        year: parseInt(newYear, 10),
        name: newName,
        start_date: newStart,
        end_date: newEnd,
        total_tournaments: parseInt(newTotal, 10),
        is_current: false,
      })
      .select()
      .single()
    if (error) {
      setMsg(`Error: ${error.message}`)
    } else {
      setSeasons((prev) => [data as Season, ...prev])
      setNewYear(''); setNewName(''); setNewStart(''); setNewEnd(''); setNewTotal('36')
      setMsg('Season created.')
    }
    setSaving(false)
  }

  const setCurrentSeason = async (id: number) => {
    setSaving(true)
    const { error } = await supabase.rpc('set_current_season', { p_season_id: id })
    if (error) {
      setMsg(`Error: ${error.message}`)
    } else {
      setSeasons((prev) => prev.map((s) => ({ ...s, is_current: s.id === id })))
      setMsg('Current season updated.')
    }
    setSaving(false)
  }

  if (loading) return <div className="text-fairway/50 text-center py-8">Loading…</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold text-fairway">Seasons</h2>
        {msg && <span className="text-sm text-gold">{msg}</span>}
      </div>

      <div className="card p-0 overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead className="bg-fairway text-cream">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Year</th>
              <th className="px-4 py-2.5 text-left font-medium">Name</th>
              <th className="px-4 py-2.5 text-center font-medium">Tournaments</th>
              <th className="px-4 py-2.5 text-center font-medium">Status</th>
              <th className="px-4 py-2.5 text-center font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-dark">
            {seasons.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-bold text-fairway">{s.year}</td>
                <td className="px-4 py-3 text-fairway/80">{s.name}</td>
                <td className="px-4 py-3 text-center text-fairway/60">{s.total_tournaments}</td>
                <td className="px-4 py-3 text-center">
                  {s.is_current ? (
                    <span className="text-xs bg-gold/20 text-gold-dark px-2 py-0.5 rounded-full font-medium">Current</span>
                  ) : (
                    <span className="text-xs text-fairway/40">Past</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {!s.is_current && (
                    <button
                      onClick={() => setCurrentSeason(s.id)}
                      disabled={saving}
                      className="text-xs text-gold hover:underline disabled:opacity-50"
                    >
                      Set as Current
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 className="font-semibold text-fairway mb-4">Create New Season</h3>
        <form onSubmit={createSeason} className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Year</label>
            <input className="input" type="number" placeholder="2027" value={newYear} onChange={(e) => setNewYear(e.target.value)} required />
          </div>
          <div>
            <label className="label">Season Name</label>
            <input className="input" placeholder="2027 One-and-Done Season" value={newName} onChange={(e) => setNewName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Start Date</label>
            <input className="input" type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} required />
          </div>
          <div>
            <label className="label">End Date</label>
            <input className="input" type="date" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} required />
          </div>
          <div>
            <label className="label">Total Tournaments</label>
            <input className="input" type="number" min={1} value={newTotal} onChange={(e) => setNewTotal(e.target.value)} required />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={saving} className="btn-primary text-sm w-full">
              {saving ? 'Creating…' : 'Create Season'}
            </button>
          </div>
        </form>
      </div>
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
    { key: 'seasons', label: 'Seasons', icon: '📆' },
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
      {tab === 'seasons' && <SeasonsPanel />}
      {tab === 'tournaments' && <TournamentsPanel />}
      {tab === 'fields' && <FieldPanel />}
      {tab === 'results' && <ResultsPanel />}
      {tab === 'picks' && <PicksPanel />}
      {tab === 'users' && <UsersPanel />}
    </div>
  )
}
