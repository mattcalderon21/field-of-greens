/**
 * The Field of Greens — Golfer Odds-Name Cleanup
 *
 * Finds golfers whose names contain trailing betting odds (e.g. "Scottie Scheffler +650")
 * and either renames them (if no clean version exists) or merges them into the existing
 * clean entry (updating tournament_fields and picks, then deleting the duplicate).
 *
 * Dry-run by default — pass --execute to commit changes.
 *
 * Run:
 *   npx ts-node --project tsconfig.scripts.json scripts/fix-golfer-odds-names.ts
 *   npx ts-node --project tsconfig.scripts.json scripts/fix-golfer-odds-names.ts --execute
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

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

const EXECUTE = process.argv.includes('--execute')

// Strips trailing American odds: "+650", "-120", "(+1400)", "(-105)"
function stripOdds(name: string): string {
  return name.replace(/\s+\(?[+-]\d+\)?$/, '').trim()
}

function hasOdds(name: string): boolean {
  return /\s+\(?[+-]\d+\)?$/.test(name)
}

async function main() {
  console.log(`\n=== Golfer Odds-Name Cleanup (${EXECUTE ? 'EXECUTE' : 'DRY RUN'}) ===\n`)

  const { data: allGolfers, error } = await supabase
    .from('golfers')
    .select('id, name')
    .order('name')

  if (error || !allGolfers) {
    console.error('Failed to fetch golfers:', error?.message)
    process.exit(1)
  }

  const oddsGolfers = allGolfers.filter((g) => hasOdds(g.name))

  if (oddsGolfers.length === 0) {
    console.log('No golfers with odds in their names found. Nothing to do.')
    return
  }

  console.log(`Found ${oddsGolfers.length} golfer(s) with odds in name:\n`)

  const cleanNameMap = new Map(allGolfers.map((g) => [g.name.toLowerCase(), g]))

  let renames = 0
  let merges = 0

  for (const bad of oddsGolfers) {
    const cleanName = stripOdds(bad.name)
    const existing = cleanNameMap.get(cleanName.toLowerCase())

    if (existing && existing.id !== bad.id) {
      // Clean version already exists — merge: re-point refs then delete duplicate
      console.log(`  MERGE  "${bad.name}" → existing "${existing.name}" (id ${existing.id})`)

      // Check tournament_fields
      const { data: tfRows } = await supabase
        .from('tournament_fields')
        .select('id, tournament_id')
        .eq('golfer_id', bad.id)

      if (tfRows && tfRows.length > 0) {
        for (const tf of tfRows) {
          // Check if the clean golfer already has a field entry for this tournament
          const { data: conflict } = await supabase
            .from('tournament_fields')
            .select('id')
            .eq('tournament_id', tf.tournament_id)
            .eq('golfer_id', existing.id)
            .single()

          if (conflict) {
            console.log(`    tournament_fields: clean entry already exists for tournament ${tf.tournament_id} — deleting duplicate tf row ${tf.id}`)
            if (EXECUTE) {
              await supabase.from('tournament_fields').delete().eq('id', tf.id)
            }
          } else {
            console.log(`    tournament_fields: re-pointing tf row ${tf.id} (tournament ${tf.tournament_id}) to golfer_id ${existing.id}`)
            if (EXECUTE) {
              await supabase.from('tournament_fields').update({ golfer_id: existing.id }).eq('id', tf.id)
            }
          }
        }
      }

      // Check picks
      const { data: pickRows } = await supabase
        .from('picks')
        .select('id, tournament_id, user_id')
        .eq('golfer_id', bad.id)

      if (pickRows && pickRows.length > 0) {
        console.log(`    picks: re-pointing ${pickRows.length} pick(s) to golfer_id ${existing.id}`)
        if (EXECUTE) {
          await supabase.from('picks').update({ golfer_id: existing.id }).eq('golfer_id', bad.id)
        }
      }

      console.log(`    golfers: deleting bad entry id ${bad.id}`)
      if (EXECUTE) {
        await supabase.from('golfers').delete().eq('id', bad.id)
      }
      merges++
    } else {
      // No clean version — just rename
      console.log(`  RENAME "${bad.name}" → "${cleanName}" (id ${bad.id})`)
      if (EXECUTE) {
        await supabase.from('golfers').update({ name: cleanName }).eq('id', bad.id)
      }
      renames++
    }
  }

  console.log(`\nSummary: ${renames} rename(s), ${merges} merge(s)`)
  if (!EXECUTE) {
    console.log('\nThis was a DRY RUN — no changes were made.')
    console.log('Re-run with --execute to apply.')
  } else {
    console.log('\nDone.')
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
