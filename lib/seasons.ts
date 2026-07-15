import { createClient } from '@/lib/supabase/server'
import type { Season } from '@/lib/types'

export async function getCurrentSeason(): Promise<Season | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('seasons')
    .select('*')
    .eq('is_current', true)
    .single()
  return data ?? null
}

export async function getAllSeasons(): Promise<Season[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('seasons')
    .select('*')
    .order('year', { ascending: false })
  return data ?? []
}

export async function getSeasonByYear(year: number): Promise<Season | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('seasons')
    .select('*')
    .eq('year', year)
    .single()
  return data ?? null
}

export async function resolveSeasonParam(year: number | null): Promise<Season | null> {
  if (year === null) return getCurrentSeason()
  return getSeasonByYear(year)
}

export async function getSeasonTournamentIds(seasonId: number): Promise<number[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('tournaments')
    .select('id')
    .eq('season_id', seasonId)
    .eq('is_included_in_ond', true)
  return (data ?? []).map((t) => t.id)
}
