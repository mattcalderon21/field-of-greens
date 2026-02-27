export type Profile = {
  id: string
  display_name: string
  email: string | null
  is_admin: boolean
  created_at: string
}

export type Tournament = {
  id: number
  name: string
  course: string
  location: string
  start_date: string
  end_date: string
  purse: number | null
  purse_rank: number | null
  is_active: boolean
  is_completed: boolean
  is_included_in_ond: boolean
  max_picks_per_user: number
}

export type Golfer = {
  id: number
  name: string
  world_rank: number | null
  primary_tour: string
  created_at: string
}

export type TournamentField = {
  id: number
  tournament_id: number
  golfer_id: number
  tee_time_r1: string | null
  earnings: number | null
  finish_position: string | null
  golfer?: Golfer
}

export type Pick = {
  id: number
  user_id: string
  tournament_id: number
  golfer_id: number
  pick_number: number
  submitted_at: string
  earnings: number
  is_locked: boolean
  golfer?: Golfer
  tournament?: Tournament
  profile?: Profile
}

export type LeaderboardEntry = {
  user_id: string
  display_name: string
  total_earnings: number
  last_pick?: {
    golfer_name: string
    earnings: number
    tournament_name: string
  }
  gap_to_leader: number
  rank: number
}

export type ResultsRow = {
  profile: Profile
  picks_by_tournament: Record<number, Pick[]>
  total_earnings: number
}

export type AdminStats = {
  total_contestants: number
  active_tournament: Tournament | null
  completed_tournaments: number
  pending_picks: number
}
