from typing import List, Optional, Dict
from pydantic import BaseModel, Field

class BallEvent(BaseModel):
    index: int
    innings: int
    over: int
    ball: int
    batter: str
    bowler: str
    non_striker: str
    runs_batter: int
    runs_extras: int
    runs_total: int
    is_wicket: bool
    wicket_kind: Optional[str] = None
    player_out: Optional[str] = None
    running_score: int
    running_wickets: int
    target: Optional[int] = None

class MatchMeta(BaseModel):
    teams: List[str]
    venue: str
    date: str
    toss_winner: str
    toss_decision: str
    players: Dict[str, List[str]]

class BatterStat(BaseModel):
    name: str
    runs: int
    balls: int
    fours: int
    sixes: int
    is_out: bool

class BowlerStat(BaseModel):
    name: str
    overs: str
    maidens: int
    runs: int
    wickets: int
    economy: float

class OverSummary(BaseModel):
    over_number: int
    runs: int
    wickets: int
    bowler: str

class Partnership(BaseModel):
    batter1: str
    batter2: str
    runs: int
    balls: int

class InningsSummary(BaseModel):
    team: str
    score: int
    wickets: int
    overs: str

class FactsObject(BaseModel):
    score: int
    wickets: int
    overs: str
    run_rate: float
    required_run_rate: Optional[float] = None
    top_batters: List[BatterStat]
    top_bowlers: List[BowlerStat]
    last_3_overs: List[OverSummary]
    active_partnership: Optional[Partnership] = None
    first_innings_summary: Optional[InningsSummary] = None
    target: Optional[int] = None
    current_batters: List[str]
    current_bowler: str
    batting_team: str
    bowling_team: str
    is_match_over: bool = False
    match_result: Optional[str] = None

class KeyMoment(BaseModel):
    over_ball: str
    description: str
    weight: float
    reason: str

class VerifiedItem(BaseModel):
    value: str
    found: bool

class GroundingResult(BaseModel):
    grounded: bool
    verified_numbers: List[VerifiedItem]
    verified_names: List[VerifiedItem]

class TelemetryData(BaseModel):
    model: str
    prompt_tokens: int
    completion_tokens: int
    time_to_first_token_ms: int
    total_latency_ms: int
    cached: bool
    ai: bool

class CatchupResponse(BaseModel):
    story: str
    turning_point: str
    watch_next: str
    grounded: bool
    grounding_details: Optional[GroundingResult] = None
    telemetry: TelemetryData

class ReplayControlRequest(BaseModel):
    action: str
    over: Optional[int] = None
    speed: Optional[float] = None

class ReplayState(BaseModel):
    current_index: int
    is_playing: bool
    speed_multiplier: float
    total_balls: int

class StateSnapshot(BaseModel):
    score: int
    wickets: int
    overs_str: str
    run_rate: float
    required_rate: Optional[float] = None
    current_batters: List[BatterStat]
    current_bowler: Optional[BowlerStat] = None
    batting_team: str
    bowling_team: str
    innings: int
    target: Optional[int] = None
    is_finished: bool
    match_result: Optional[str] = None
    replay: ReplayState

class CatchupRequest(BaseModel):
    language: str = "en"
    away_minutes: Optional[int] = 0
