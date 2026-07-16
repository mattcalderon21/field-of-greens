/**
 * Creates an auth user + profile for a historical contestant who never signed up
 * through the normal flow (e.g. Ted Brown, who played in 2025 but not 2026).
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Usage:
 *   npm run create:user -- --name "Ted Brown" --email "ted@example.com"
 *
 * The email can be a placeholder — it's only used as the auth identifier.
 * The display_name must match exactly what's in the season JSON picks file.
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

const args = process.argv.slice(2)
const nameIdx = args.indexOf('--name')
const emailIdx = args.indexOf('--email')

if (nameIdx === -1 || !args[nameIdx + 1] || emailIdx === -1 || !args[emailIdx + 1]) {
  console.error('Usage: npm run create:user -- --name "Ted Brown" --email "ted@example.com"')
  process.exit(1)
}

const displayName = args[nameIdx + 1]
const email = args[emailIdx + 1]

async function run() {
  console.log(`\nCreating historical user:`)
  console.log(`  display_name : ${displayName}`)
  console.log(`  email        : ${email}`)
  console.log('')

  // Check if a profile with this display_name already exists
  const { data: existing } = await supabase
    .from('profiles')
    .select('id, display_name, email')
    .ilike('display_name', displayName)
    .maybeSingle()

  if (existing) {
    console.log(`✓ Profile already exists (id=${existing.id}, display_name="${existing.display_name}")`)
    console.log('  Nothing to do.')
    process.exit(0)
  }

  // Create the auth user — the on_auth_user_created trigger will auto-create the profile
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  })

  if (error) {
    console.error('Error creating auth user:', error.message)
    process.exit(1)
  }

  const userId = data.user.id
  console.log(`✓ Auth user created (id=${userId})`)

  // Give the trigger a moment, then verify the profile row exists
  await new Promise((r) => setTimeout(r, 500))

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id, display_name, email')
    .eq('id', userId)
    .single()

  if (profileErr || !profile) {
    // Trigger may not have run — insert manually
    console.log('  Profile not created by trigger, inserting manually...')
    const { error: insertErr } = await supabase
      .from('profiles')
      .insert({ id: userId, email, display_name: displayName })
    if (insertErr) {
      console.error('  Error inserting profile:', insertErr.message)
      process.exit(1)
    }
    console.log(`✓ Profile inserted manually`)
  } else {
    // Trigger ran — make sure display_name is exactly right
    if (profile.display_name !== displayName) {
      await supabase.from('profiles').update({ display_name: displayName }).eq('id', userId)
      console.log(`✓ Profile created by trigger, display_name corrected to "${displayName}"`)
    } else {
      console.log(`✓ Profile created by trigger (display_name="${profile.display_name}")`)
    }
  }

  console.log(`\nDone! "${displayName}" is ready for historical import.`)
}

run().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
