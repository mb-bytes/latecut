from collections import defaultdict
from typing import List, Optional, Dict
from app.models import (
    BallEvent,
    MatchMeta,
    FactsObject,
    BatterStat,
    BowlerStat,
    OverSummary,
    Partnership,
    InningsSummary
)

def compute_overs_str(over_index: int, ball_in_over: int) -> str:
    if ball_in_over >= 6:
        return f"{over_index + 1}.0"
    return f"{over_index}.{ball_in_over}"

def compute_overs_decimal(over_index: int, ball_in_over: int) -> float:
    if ball_in_over >= 6:
        return float(over_index + 1)
    return over_index + (ball_in_over / 6.0)

def extract_batter_stats(events: List[BallEvent]) -> List[BatterStat]:
    runs_map: Dict[str, int] = defaultdict(int)
    balls_map: Dict[str, int] = defaultdict(int)
    fours_map: Dict[str, int] = defaultdict(int)
    sixes_map: Dict[str, int] = defaultdict(int)
    out_set = set()

    for event in events:
        runs_map[event.batter] += event.runs_batter
        balls_map[event.batter] += 1
        if event.runs_batter == 4:
            fours_map[event.batter] += 1
        elif event.runs_batter == 6:
            sixes_map[event.batter] += 1
        if event.is_wicket and event.player_out:
            out_set.add(event.player_out)

    batters = []
    for name in runs_map.keys():
        batters.append(
            BatterStat(
                name=name,
                runs=runs_map[name],
                balls=balls_map[name],
                fours=fours_map[name],
                sixes=sixes_map[name],
                is_out=name in out_set
            )
        )

    batters.sort(key=lambda b: (b.runs, -b.balls), reverse=True)
    return batters

def extract_bowler_stats(events: List[BallEvent]) -> List[BowlerStat]:
    balls_map: Dict[str, int] = defaultdict(int)
    runs_map: Dict[str, int] = defaultdict(int)
    wickets_map: Dict[str, int] = defaultdict(int)
    overs_by_bowler: Dict[str, Dict[int, int]] = defaultdict(lambda: defaultdict(int))

    for event in events:
        bowler = event.bowler
        balls_map[bowler] += 1
        runs_map[bowler] += event.runs_total
        overs_by_bowler[bowler][event.over] += event.runs_total
        if event.is_wicket and event.wicket_kind != "run out":
            wickets_map[bowler] += 1

    maidens_map: Dict[str, int] = defaultdict(int)
    for bowler, overs_dict in overs_by_bowler.items():
        for ov, r in overs_dict.items():
            over_events = [e for e in events if e.bowler == bowler and e.over == ov]
            if len(over_events) >= 6 and r == 0:
                maidens_map[bowler] += 1

    bowlers = []
    for name in balls_map.keys():
        b_count = balls_map[name]
        r_conceded = runs_map[name]
        w_taken = wickets_map[name]
        overs_decimal = b_count / 6.0
        econ = round(r_conceded / overs_decimal, 2) if overs_decimal > 0 else 0.0
        overs_str = f"{b_count // 6}.{b_count % 6}"

        bowlers.append(
            BowlerStat(
                name=name,
                overs=overs_str,
                maidens=maidens_map[name],
                runs=r_conceded,
                wickets=w_taken,
                economy=econ
            )
        )

    bowlers.sort(key=lambda b: (b.wickets, -b.economy), reverse=True)
    return bowlers

def extract_last_overs(events: List[BallEvent], count: int = 3) -> List[OverSummary]:
    if not events:
        return []

    overs_list = sorted(list(set(e.over for e in events)))
    recent_overs = overs_list[-count:]

    summaries = []
    for ov in recent_overs:
        ov_events = [e for e in events if e.over == ov]
        runs = sum(e.runs_total for e in ov_events)
        wickets = sum(1 for e in ov_events if e.is_wicket)
        bowler = ov_events[-1].bowler if ov_events else ""
        summaries.append(
            OverSummary(
                over_number=ov + 1,
                runs=runs,
                wickets=wickets,
                bowler=bowler
            )
        )
    return summaries

def extract_active_partnership(events: List[BallEvent]) -> Optional[Partnership]:
    if not events:
        return None

    last_wicket_idx = -1
    for idx, e in enumerate(events):
        if e.is_wicket:
            last_wicket_idx = idx

    partnership_events = events[last_wicket_idx + 1:] if last_wicket_idx != -1 else events
    if not partnership_events:
        return None

    current_event = events[-1]
    striker = current_event.batter
    non_striker = current_event.non_striker
    runs = sum(e.runs_total for e in partnership_events)
    balls = len(partnership_events)

    return Partnership(
        batter1=striker,
        batter2=non_striker,
        runs=runs,
        balls=balls
    )

def extract_facts(events: List[BallEvent], meta: MatchMeta) -> FactsObject:
    if not events:
        batting_t = meta.teams[0] if meta.teams else ""
        bowling_t = meta.teams[1] if len(meta.teams) > 1 else ""
        return FactsObject(
            score=0,
            wickets=0,
            overs="0.0",
            run_rate=0.0,
            required_run_rate=None,
            top_batters=[],
            top_bowlers=[],
            last_3_overs=[],
            active_partnership=None,
            first_innings_summary=None,
            target=None,
            current_batters=[],
            current_bowler="",
            batting_team=batting_t,
            bowling_team=bowling_t
        )

    last_event = events[-1]
    current_innings = last_event.innings
    current_inn_events = [e for e in events if e.innings == current_innings]

    score = last_event.running_score
    wickets = last_event.running_wickets
    overs_str = compute_overs_str(last_event.over, last_event.ball)
    overs_dec = compute_overs_decimal(last_event.over, last_event.ball)

    run_rate = round(score / overs_dec, 2) if overs_dec > 0 else 0.0

    target = last_event.target
    req_rate = None
    if current_innings == 2 and target is not None:
        runs_needed = max(0, target - score)
        overs_remaining = max(0.0, 20.0 - overs_dec)
        req_rate = round(runs_needed / overs_remaining, 2) if overs_remaining > 0 else 0.0

    all_batters = extract_batter_stats(current_inn_events)
    top_batters = all_batters[:3]

    all_bowlers = extract_bowler_stats(current_inn_events)
    top_bowlers = all_bowlers[:3]

    last_3 = extract_last_overs(current_inn_events, 3)
    partnership = extract_active_partnership(current_inn_events)

    first_innings_summary = None
    if current_innings == 2:
        first_inn_events = [e for e in events if e.innings == 1]
        if first_inn_events:
            last_first = first_inn_events[-1]
            first_innings_summary = InningsSummary(
                team=meta.teams[0] if meta.teams else "",
                score=last_first.running_score,
                wickets=last_first.running_wickets,
                overs=compute_overs_str(last_first.over, last_first.ball)
            )

    batting_team = meta.teams[0] if current_innings == 1 else (meta.teams[1] if len(meta.teams) > 1 else "")
    bowling_team = meta.teams[1] if current_innings == 1 else (meta.teams[0] if meta.teams else "")

    current_batters = [last_event.batter, last_event.non_striker]
    current_bowler = last_event.bowler

    is_match_over = False
    match_result = None

    if current_innings == 2 and target is not None:
        if score >= target:
            is_match_over = True
            wickets_in_hand = 10 - wickets
            match_result = f"{batting_team} won by {wickets_in_hand} wickets"
        elif wickets >= 10 or overs_dec >= 20.0 or (last_event.over >= 19 and last_event.ball >= 6):
            is_match_over = True
            if score < target - 1:
                runs_diff = (target - 1) - score
                match_result = f"{bowling_team} won by {runs_diff} runs"
            elif score == target - 1:
                match_result = "Match tied"

    return FactsObject(
        score=score,
        wickets=wickets,
        overs=overs_str,
        run_rate=run_rate,
        required_run_rate=req_rate,
        top_batters=top_batters,
        top_bowlers=top_bowlers,
        last_3_overs=last_3,
        active_partnership=partnership,
        first_innings_summary=first_innings_summary,
        target=target,
        current_batters=current_batters,
        current_bowler=current_bowler,
        batting_team=batting_team,
        bowling_team=bowling_team,
        is_match_over=is_match_over,
        match_result=match_result
    )
