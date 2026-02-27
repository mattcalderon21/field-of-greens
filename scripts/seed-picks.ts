/**
 * The Field of Greens — User & Pick Seeder
 *
 * Creates the 9 contestant accounts and seeds all historical picks (weeks 1–6).
 * Requires: SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Run: npm run seed:picks
 * (uses ts-node — install dev deps first with npm install)
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

// Admin client — bypasses RLS, can create users
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Contestants ──────────────────────────────────────────────────────────

const CONTESTANTS = [
  { display_name: 'Ben',   email: 'ben@fieldofgreens.local',   password: 'FieldOfGreens2026!' },
  { display_name: 'Matt',  email: 'matt@fieldofgreens.local',  password: 'FieldOfGreens2026!' },
  { display_name: 'Todd',  email: 'todd@fieldofgreens.local',  password: 'FieldOfGreens2026!' },
  { display_name: 'Luke',  email: 'luke@fieldofgreens.local',  password: 'FieldOfGreens2026!' },
  { display_name: 'Ryan',  email: 'ryan@fieldofgreens.local',  password: 'FieldOfGreens2026!' },
  { display_name: 'Horse', email: 'horse@fieldofgreens.local', password: 'FieldOfGreens2026!' },
  { display_name: 'Rich',  email: 'rich@fieldofgreens.local',  password: 'FieldOfGreens2026!' },
  { display_name: 'Paul',  email: 'paul@fieldofgreens.local',  password: 'FieldOfGreens2026!' },
  { display_name: 'Mitch', email: 'mitch@fieldofgreens.local', password: 'FieldOfGreens2026!' },
  // Admin account
  { display_name: 'Admin', email: 'admin@fieldofgreens.local', password: 'AdminPass2026!', is_admin: true },
]

// ─── Historical Picks (Weeks 1–6) ─────────────────────────────────────────

type PickRow = {
  contestant: string
  tournamentName: string
  golferName: string
  earnings: number
  pickNumber?: number
}

const HISTORICAL_PICKS: PickRow[] = [
  // Week 1 — Sony Open in Hawaii
  { contestant: 'Ben',   tournamentName: 'Sony Open in Hawaii', golferName: 'Si Woo Kim',       earnings: 220675 },
  { contestant: 'Matt',  tournamentName: 'Sony Open in Hawaii', golferName: 'Collin Morikawa',  earnings: 0 },
  { contestant: 'Todd',  tournamentName: 'Sony Open in Hawaii', golferName: 'Harry Hall',        earnings: 287105 },
  { contestant: 'Luke',  tournamentName: 'Sony Open in Hawaii', golferName: 'Ben Griffin',       earnings: 111839 },
  { contestant: 'Ryan',  tournamentName: 'Sony Open in Hawaii', golferName: 'Keegan Bradley',    earnings: 0 },
  { contestant: 'Horse', tournamentName: 'Sony Open in Hawaii', golferName: 'Nico Echavarria',   earnings: 0 },
  { contestant: 'Rich',  tournamentName: 'Sony Open in Hawaii', golferName: 'Nick Taylor',       earnings: 163041 },
  { contestant: 'Paul',  tournamentName: 'Sony Open in Hawaii', golferName: 'Ryan Gerard',       earnings: 991900 },
  { contestant: 'Mitch', tournamentName: 'Sony Open in Hawaii', golferName: 'Maverick McNealy',  earnings: 72475 },

  // Week 2 — The American Express
  { contestant: 'Ben',   tournamentName: 'The American Express', golferName: 'Sam Burns',         earnings: 57918 },
  { contestant: 'Matt',  tournamentName: 'The American Express', golferName: 'Si Woo Kim',        earnings: 322000 },
  { contestant: 'Todd',  tournamentName: 'The American Express', golferName: 'Si Woo Kim',        earnings: 322000 },
  { contestant: 'Luke',  tournamentName: 'The American Express', golferName: 'Harry Hall',        earnings: 81420 },
  { contestant: 'Ryan',  tournamentName: 'The American Express', golferName: 'Matt Fitzpatrick',  earnings: 19688 },
  { contestant: 'Horse', tournamentName: 'The American Express', golferName: 'Daniel Berger',     earnings: 20884 },
  { contestant: 'Rich',  tournamentName: 'The American Express', golferName: 'Sepp Straka',       earnings: 0 },
  { contestant: 'Paul',  tournamentName: 'The American Express', golferName: 'Harry Hall',        earnings: 81420 },
  { contestant: 'Mitch', tournamentName: 'The American Express', golferName: 'Robert MacIntyre',  earnings: 39100 },

  // Week 3 — Farmers Insurance Open
  { contestant: 'Ben',   tournamentName: 'Farmers Insurance Open', golferName: 'Keegan Bradley',    earnings: 31264 },
  { contestant: 'Matt',  tournamentName: 'Farmers Insurance Open', golferName: 'Will Zalatoris',    earnings: 0 },
  { contestant: 'Todd',  tournamentName: 'Farmers Insurance Open', golferName: 'Taylor Pendrith',   earnings: 0 },
  { contestant: 'Luke',  tournamentName: 'Farmers Insurance Open', golferName: 'Ryan Gerard',       earnings: 193028 },
  { contestant: 'Ryan',  tournamentName: 'Farmers Insurance Open', golferName: 'Wyndham Clark',     earnings: 20352 },
  { contestant: 'Horse', tournamentName: 'Farmers Insurance Open', golferName: 'Hideki Matsuyama',  earnings: 193028 },
  { contestant: 'Rich',  tournamentName: 'Farmers Insurance Open', golferName: 'Jason Day',         earnings: 41760 },
  { contestant: 'Paul',  tournamentName: 'Farmers Insurance Open', golferName: 'Marco Penge',       earnings: 0 },
  { contestant: 'Mitch', tournamentName: 'Farmers Insurance Open', golferName: 'Sam Stevens',       earnings: 56280 },

  // Week 4 — WM Phoenix Open
  { contestant: 'Ben',   tournamentName: 'WM Phoenix Open', golferName: 'Maverick McNealy',  earnings: 188000 },
  { contestant: 'Matt',  tournamentName: 'WM Phoenix Open', golferName: 'Sahith Theegala',   earnings: 122720 },
  { contestant: 'Todd',  tournamentName: 'WM Phoenix Open', golferName: 'Jake Knapp',         earnings: 300000 },
  { contestant: 'Luke',  tournamentName: 'WM Phoenix Open', golferName: 'Stephan Jaeger',     earnings: 62948 },
  { contestant: 'Ryan',  tournamentName: 'WM Phoenix Open', golferName: 'Ben Griffin',        earnings: 62948 },
  { contestant: 'Horse', tournamentName: 'WM Phoenix Open', golferName: 'Si Woo Kim',         earnings: 439680 },
  { contestant: 'Rich',  tournamentName: 'WM Phoenix Open', golferName: 'Sam Burns',          earnings: 0 },
  { contestant: 'Paul',  tournamentName: 'WM Phoenix Open', golferName: 'Keith Mitchell',     earnings: 34080 },
  { contestant: 'Mitch', tournamentName: 'WM Phoenix Open', golferName: 'Pierceson Coody',    earnings: 242400 },

  // Week 5 — AT&T Pebble Beach Pro-Am
  { contestant: 'Ben',   tournamentName: 'AT&T Pebble Beach Pro-Am', golferName: 'Justin Rose',        earnings: 78375 },
  { contestant: 'Matt',  tournamentName: 'AT&T Pebble Beach Pro-Am', golferName: 'Hideki Matsuyama',   earnings: 515000 },
  { contestant: 'Todd',  tournamentName: 'AT&T Pebble Beach Pro-Am', golferName: 'Si Woo Kim',          earnings: 57000 },
  { contestant: 'Luke',  tournamentName: 'AT&T Pebble Beach Pro-Am', golferName: 'Matt Fitzpatrick',   earnings: 342750 },
  { contestant: 'Ryan',  tournamentName: 'AT&T Pebble Beach Pro-Am', golferName: 'Russell Henley',     earnings: 235000 },
  { contestant: 'Horse', tournamentName: 'AT&T Pebble Beach Pro-Am', golferName: 'Jason Day',          earnings: 162000 },
  { contestant: 'Rich',  tournamentName: 'AT&T Pebble Beach Pro-Am', golferName: 'Justin Rose',        earnings: 78375 },
  { contestant: 'Paul',  tournamentName: 'AT&T Pebble Beach Pro-Am', golferName: 'Sepp Straka',        earnings: 1760000 },
  { contestant: 'Mitch', tournamentName: 'AT&T Pebble Beach Pro-Am', golferName: 'Scottie Scheffler',  earnings: 877500 },

  // Week 6 — The Genesis Invitational
  { contestant: 'Ben',   tournamentName: 'The Genesis Invitational', golferName: 'Patrick Cantlay',    earnings: 92250 },
  { contestant: 'Matt',  tournamentName: 'The Genesis Invitational', golferName: 'Matt Fitzpatrick',   earnings: 178250 },
  { contestant: 'Todd',  tournamentName: 'The Genesis Invitational', golferName: 'Rory McIlroy',       earnings: 1800000 },
  { contestant: 'Luke',  tournamentName: 'The Genesis Invitational', golferName: 'Scottie Scheffler',  earnings: 603200 },
  { contestant: 'Ryan',  tournamentName: 'The Genesis Invitational', golferName: 'Hideki Matsuyama',   earnings: 136500 },
  { contestant: 'Horse', tournamentName: 'The Genesis Invitational', golferName: 'Collin Morikawa',    earnings: 603200 },
  { contestant: 'Rich',  tournamentName: 'The Genesis Invitational', golferName: 'Ludvig Aberg',       earnings: 259500 },
  { contestant: 'Paul',  tournamentName: 'The Genesis Invitational', golferName: 'Harris English',     earnings: 224500 },
  { contestant: 'Mitch', tournamentName: 'The Genesis Invitational', golferName: 'Patrick Cantlay',    earnings: 92250 },
]

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log('🏌️  The Field of Greens — Seed Script\n')

  // 1. Create user accounts
  const userIds: Record<string, string> = {}

  console.log('📧 Creating user accounts...')
  for (const contestant of CONTESTANTS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: contestant.email,
      password: contestant.password,
      email_confirm: true,
      user_metadata: { display_name: contestant.display_name },
    })

    if (error && error.message.includes('already registered')) {
      // User exists — fetch their ID
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', contestant.email)
        .single()
      if (existing) {
        userIds[contestant.display_name] = existing.id
        console.log(`  ⚠️  ${contestant.display_name} already exists (id: ${existing.id.slice(0, 8)}...)`)
      }
      continue
    }

    if (error) {
      console.error(`  ✗ Failed to create ${contestant.display_name}: ${error.message}`)
      continue
    }

    const userId = data.user.id
    userIds[contestant.display_name] = userId

    // Upsert profile
    await supabase.from('profiles').upsert({
      id: userId,
      display_name: contestant.display_name,
      email: contestant.email,
      is_admin: (contestant as any).is_admin ?? false,
    })

    console.log(`  ✓ ${contestant.display_name} (${contestant.email})`)
  }

  // 2. Fetch tournament IDs
  console.log('\n📅 Fetching tournament IDs...')
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name')

  if (!tournaments) {
    console.error('No tournaments found. Run seed.sql first.')
    process.exit(1)
  }

  const tournamentMap: Record<string, number> = {}
  tournaments.forEach((t) => { tournamentMap[t.name] = t.id })

  // 3. Fetch golfer IDs
  console.log('🏌️  Fetching golfer IDs...')
  const { data: golfers } = await supabase.from('golfers').select('id, name')
  if (!golfers) {
    console.error('No golfers found. Run seed.sql first.')
    process.exit(1)
  }

  const golferMap: Record<string, number> = {}
  golfers.forEach((g) => { golferMap[g.name] = g.id })

  // 4. Insert historical picks
  console.log('\n🎯 Seeding historical picks...')
  let successCount = 0
  let errorCount = 0

  for (const pick of HISTORICAL_PICKS) {
    const userId = userIds[pick.contestant]
    const tournamentId = tournamentMap[pick.tournamentName]
    const golferId = golferMap[pick.golferName]

    if (!userId) {
      console.warn(`  ⚠️  No user ID for ${pick.contestant}`)
      errorCount++
      continue
    }
    if (!tournamentId) {
      console.warn(`  ⚠️  No tournament ID for "${pick.tournamentName}"`)
      errorCount++
      continue
    }
    if (!golferId) {
      console.warn(`  ⚠️  No golfer ID for "${pick.golferName}"`)
      errorCount++
      continue
    }

    const { error } = await supabase.from('picks').upsert({
      user_id: userId,
      tournament_id: tournamentId,
      golfer_id: golferId,
      pick_number: pick.pickNumber ?? 1,
      earnings: pick.earnings,
      is_locked: true,
      submitted_at: new Date().toISOString(),
    }, { onConflict: 'user_id,tournament_id,pick_number' })

    if (error) {
      console.error(`  ✗ ${pick.contestant} / ${pick.tournamentName} / ${pick.golferName}: ${error.message}`)
      errorCount++
    } else {
      successCount++
    }
  }

  console.log(`\n  ✓ ${successCount} picks seeded`)
  if (errorCount > 0) console.log(`  ⚠️  ${errorCount} errors (see above)`)

  // 5. Summary
  console.log('\n📊 Seed Summary:')
  console.log(`  Users created/found: ${Object.keys(userIds).length}`)
  console.log(`  Picks seeded: ${successCount}`)
  console.log('\n✅ Done! The Field of Greens is ready.')
  console.log('\n🔑 Default credentials:')
  console.log('   Contestants: FieldOfGreens2026!')
  console.log('   Admin:       AdminPass2026!')
  console.log('\n   ⚠️  Change passwords after first login!')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
