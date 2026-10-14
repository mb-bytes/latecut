export interface BallEvent {
  index: number
  innings: number
  over: number
  ball: number
  batter: string
  bowler: string
  non_striker: string
  runs_batter: number
  runs_extras: number
  runs_total: number
  is_wicket: boolean
  wicket_kind: string | null
  player_out: string | null
  running_score: number
  running_wickets: number
  target: number | null
}

export interface BatterStat {
  name: string
  runs: number
  balls: number
  fours: number
  sixes: number
  is_out: boolean
}

export interface BowlerStat {
  name: string
  overs: string
  maidens: number
  runs: number
  wickets: number
  economy: number
}

export interface OverSummary {
  over_number: number
  runs: number
  wickets: number
  bowler: string
}

export interface Partnership {
  batter1: string
  batter2: string
  runs: number
  balls: number
}

export interface InningsSummary {
  team: string
  score: number
  wickets: number
  overs: string
}

export interface FactsObject {
  score: number
  wickets: number
  overs: string
  run_rate: number
  required_run_rate: number | null
  top_batters: BatterStat[]
  top_bowlers: BowlerStat[]
  last_3_overs: OverSummary[]
  active_partnership: Partnership | null
  first_innings_summary: InningsSummary | null
  target: number | null
  current_batters: string[]
  current_bowler: string
  batting_team: string
  bowling_team: string
  is_match_over: boolean
  match_result: string | null
}

export interface KeyMoment {
  over_ball: string
  description: string
  weight: number
  reason: string
}

export interface VerifiedItem {
  value: string
  found: boolean
}

export interface GroundingResult {
  grounded: boolean
  verified_numbers: VerifiedItem[]
  verified_names: VerifiedItem[]
}

export interface TelemetryData {
  model: string
  prompt_tokens: number
  completion_tokens: number
  time_to_first_token_ms: number
  total_latency_ms: number
  cached: boolean
  ai: boolean
}

export interface CatchupResponse {
  story: string
  turning_point: string
  watch_next: string
  grounded: boolean
  grounding_details: GroundingResult | null
  telemetry: TelemetryData
}

export interface ReplayState {
  current_index: number
  is_playing: boolean
  speed_multiplier: number
  total_balls: number
}

export interface StateSnapshot {
  score: number
  wickets: number
  overs_str: string
  run_rate: number
  required_rate: number | null
  current_batters: BatterStat[]
  current_bowler: BowlerStat | null
  batting_team: string
  bowling_team: string
  innings: number
  target: number | null
  is_finished: boolean
  match_result: string | null
  replay: ReplayState
  toss_winner: string
  toss_decision: string
  venue: string
  match_date: string
  event_name: string
  has_two_innings: boolean
}

export interface InspectResponse {
  facts: FactsObject
  key_moments: KeyMoment[]
  system_prompt: string
  user_message: string
}
