/**
 * The Field of Greens — Historical Season Importer
 *
 * Imports a full season's worth of picks from a JSON file into Supabase.
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Usage:
 *   npm run seed:historical -- --year 2025           # dry run (default)
 *   npm run seed:historical -- --year 2025 --execute  # write to database
 *
 * Data file: scripts/data/season-YYYY.json
 * See scripts/data/season-example.json for the expected format.
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Types ────────────────────────────────────────────────────────────────

type SeasonData = {
  year: number
  name: string
  start_date: string  // YYYY-MM-DD
  end_date: string    // YYYY-MM-DD
  total_tournaments?: number
}

type PickRow = {
  contestant: string         // matches display_name in profiles
  tournament_name: string
  tournament_start_date: string  // YYYY-MM-DD
  tournament_end_date?: string   // YYYY-MM-DD (defaults to start_date + 3 days)
  tournament_course?: string
  tournament_location?: string
  tournament_purse?: number
  golfer_name: string
  earnings: number
  finish_position?: string  // "1", "T3", "CUT", "WD", etc.
}

type ImportFile = {
  season: SeasonData
  picks: PickRow[]
}

// ─── CLI args ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const yearIdx = args.indexOf('--year')
const execute = args.includes('--execute')

if (yearIdx === -1 || !args[yearIdx + 1]) {
  console.error('Usage: npm run seed:historical -- --year 2025 [--execute]')
  process.exit(1)
}

const targetYear = parseInt(args[yearIdx + 1], 10)
if (isNaN(targetYear)) {
  console.error('--year must be a number')
  process.exit(1)
}

const dataFile = path.join(__dirname, 'data', `season-${targetYear}.json`)
if (!fs.existsSync(dataFile)) {
  console.error(`Data file not found: ${dataFile}`)
  console.error(`Expected format documented in scripts/data/season-example.json`)
  process.exit(1)
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\n🏌️  Field of Greens — Historical Importer`)
  console.log(`   Year: ${targetYear}`)
  console.log(`   Mode: ${execute ? '✍️  EXECUTE (writing to DB)' : '👀 DRY RUN (no writes)'}`)
  console.log('')

  const raw = fs.readFileSync(dataFile, 'utf-8')
  const input: ImportFile = JSON.parse(raw)

  if (input.season.year !== targetYear) {
    console.error(`Year mismatch: file says ${input.season.year}, --year says ${targetYear}`)
    process.exit(1)
  }

  // 1. Check if season already has picks (guard against double-import)
  const { data: existingSeason } = await supabase
    .from('seasons')
    .select('id')
    .eq('year', targetYear)
    .single()

  if (existingSeason) {
    const { count } = await supabase
      .from('picks')
      .select('id', { count: 'exact', head: true })
      .in(
        'tournament_id',
        (await supabase.from('tournaments').select('id').eq('season_id', existingSeason.id)).data?.map((t: { id: number }) => t.id) ?? []
      )
    if ((count ?? 0) > 0) {
      console.error(`Season ${targetYear} already has picks in the database. Aborting to prevent duplicates.`)
      console.error(`To reimport, manually delete the existing picks and season row first.`)
      process.exit(1)
    }
  }

  // 2. Load profiles (needed to map contestant name → user_id)
  const { data: profiles } = await supabase.from('profiles').select('id, display_name')
  const profileMap = new Map<string, string>((profiles ?? []).map((p: { id: string; display_name: string }) => [p.display_name.trim().toLowerCase(), p.id]))

  // Validate all contestant names upfront
  const missingContestants = new Set<string>()
  for (const pick of input.picks) {
    if (!profileMap.has(pick.contestant.trim().toLowerCase())) {
      missingContestants.add(pick.contestant)
    }
  }
  if (missingContestants.size > 0) {
    console.error('ERROR: These contestant names were not found in profiles:')
    for (const name of missingContestants) console.error(`  - "${name}"`)
    console.error('\nFix: ensure display_name in profiles matches exactly (case-insensitive).')
    process.exit(1)
  }
  console.log(`✓ All ${new Set(input.picks.map((p) => p.contestant)).size} contestants matched`)

  // 3. Upsert season row
  if (execute) {
    const { data: seasonRow, error: seasonErr } = await supabase
      .from('seasons')
      .upsert({
        year: input.season.year,
        name: input.season.name,
        start_date: input.season.start_date,
        end_date: input.season.end_date,
        total_tournaments: input.season.total_tournaments ?? input.picks.reduce((s, p) => { s.add(p.tournament_name); return s }, new Set<string>()).size,
        is_current: false,
      }, { onConflict: 'year' })
      .select()
      .single()
    if (seasonErr) { console.error('Error upserting season:', seasonErr.message); process.exit(1) }
    console.log(`✓ Season row upserted (id=${(seasonRow as { id: number }).id})`)
  } else {
    console.log(`  [dry-run] Would upsert season: ${input.season.name}`)
  }

  // Reload season id
  const { data: seasonRow } = await supabase.from('seasons').select('id').eq('year', targetYear).single()
  const seasonId: number = execute ? (seasonRow as { id: number }).id : -1

  // 4. Group picks by tournament
  const tournamentGroups = new Map<string, PickRow[]>()
  for (const pick of input.picks) {
    const key = `${pick.tournament_name}__${pick.tournament_start_date}`
    if (!tournamentGroups.has(key)) tournamentGroups.set(key, [])
    tournamentGroups.get(key)!.push(pick)
  }

  console.log(`\n📋 ${tournamentGroups.size} tournaments, ${input.picks.length} picks total`)

  // 5. For each tournament: upsert tournament, upsert golfers, upsert fields + picks
  let insertedPicks = 0
  for (const [, picks] of tournamentGroups) {
    const sample = picks[0]
    const tName = sample.tournament_name
    const tStart = sample.tournament_start_date
    const tEnd = sample.tournament_end_date ?? tStart  // fallback same day

    if (!execute) {
      console.log(`  [dry-run] Tournament: ${tName} (${tStart})`)
      for (const p of picks) {
        const userId = profileMap.get(p.contestant.trim().toLowerCase())!
        console.log(`    ${p.contestant} → ${p.golfer_name} | pos=${p.finish_position ?? '—'} | $${p.earnings.toLocaleString()}`)
      }
      continue
    }

    // Upsert tournament
    const { data: tRow, error: tErr } = await supabase
      .from('tournaments')
      .upsert({
        name: tName,
        start_date: tStart,
        end_date: tEnd,
        course: sample.tournament_course ?? '',
        location: sample.tournament_location ?? '',
        purse: sample.tournament_purse ?? null,
        season_id: seasonId,
        is_included_in_ond: true,
        is_completed: true,
        is_active: false,
        max_picks_per_user: 1,
      }, { onConflict: 'name,start_date' })
      .select()
      .single()
    if (tErr) { console.error(`  Error upserting tournament "${tName}":`, tErr.message); continue }
    const tId: number = (tRow as { id: number }).id

    for (const pick of picks) {
      const userId = profileMap.get(pick.contestant.trim().toLowerCase())!

      // Upsert golfer (global — same golfer across seasons)
      const { data: golferRow, error: gErr } = await supabase
        .from('golfers')
        .upsert({ name: pick.golfer_name, primary_tour: 'PGA Tour' }, { onConflict: 'name' })
        .select()
        .single()
      if (gErr) { console.error(`  Error upserting golfer "${pick.golfer_name}":`, gErr.message); continue }
      const gId: number = (golferRow as { id: number }).id

      // Upsert tournament_field
      const { error: fErr } = await supabase
        .from('tournament_fields')
        .upsert({
          tournament_id: tId,
          golfer_id: gId,
          earnings: pick.earnings,
          finish_position: pick.finish_position ?? null,
        }, { onConflict: 'tournament_id,golfer_id' })
      if (fErr) { console.error(`  Error upserting field for "${pick.golfer_name}":`, fErr.message) }

      // Upsert pick
      const { data: existingPicks } = await supabase
        .from('picks')
        .select('id')
        .eq('user_id', userId)
        .eq('tournament_id', tId)
      const pickNumber = (existingPicks?.length ?? 0) + 1

      const { error: pErr } = await supabase
        .from('picks')
        .upsert({
          user_id: userId,
          tournament_id: tId,
          golfer_id: gId,
          pick_number: pickNumber,
          earnings: pick.earnings,
          is_locked: true,
        }, { onConflict: 'user_id,tournament_id,pick_number' })
      if (pErr) { console.error(`  Error upserting pick for "${pick.contestant}":`, pErr.message) }
      else insertedPicks++
    }

    console.log(`  ✓ ${tName} (${picks.length} picks)`)
  }

  if (execute) {
    console.log(`\n✅ Done! Inserted ${insertedPicks} picks for ${targetYear} season.`)
    console.log(`   To set this as the current season, use the Admin Panel → Seasons tab.`)
  } else {
    console.log(`\n✅ Dry run complete. Re-run with --execute to write to the database.`)
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
