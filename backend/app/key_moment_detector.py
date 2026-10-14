from collections import defaultdict
from typing import List, Dict
from app.models import BallEvent, FactsObject, KeyMoment

def detect_key_moments(events: List[BallEvent], facts: FactsObject) -> List[KeyMoment]:
    if not events:
        return []

    target_innings = events[-1].innings
    innings_events = [e for e in events if e.innings == target_innings]
    if not innings_events:
        return []

    candidate_moments = []
    batter_runs: Dict[str, int] = defaultdict(int)
    partnership_runs = 0
    consecutive_wickets: Dict[str, int] = defaultdict(int)

    over_runs_map: Dict[int, int] = defaultdict(int)
    for e in innings_events:
        over_runs_map[e.over] += e.runs_total

    for idx, e in enumerate(innings_events):
        over_ball_label = f"{e.over}.{e.ball}"
        runs_before = batter_runs[e.batter]
        runs_now = runs_before + e.runs_batter
        batter_runs[e.batter] = runs_now
        partnership_runs += e.runs_total

        if runs_before < 50 <= runs_now:
            candidate_moments.append({
                "index": e.index,
                "over_ball": over_ball_label,
                "description": f"{e.batter} reaches a fighting half-century (50 runs)",
                "weight": 2.5,
                "reason": "Fifty milestone reached under match pressure"
            })
        elif runs_before < 100 <= runs_now:
            candidate_moments.append({
                "index": e.index,
                "over_ball": over_ball_label,
                "description": f"{e.batter} completes a masterclass century (100 runs)",
                "weight": 3.5,
                "reason": "Century milestone reached"
            })

        if e.is_wicket:
            consecutive_wickets[e.bowler] += 1
            w = 3.0
            player = e.player_out or e.batter
            batter_total = batter_runs.get(player, 0)
            reason_parts = ["Dismissal of batter"]

            if batter_total >= 40:
                w += 1.0
                reason_parts.append(f"set batter on {batter_total}")

            if partnership_runs >= 40:
                w += 1.0
                reason_parts.append(f"broke {partnership_runs} run stand")

            if e.wicket_kind == "run out":
                w += 1.5
                desc = f"Vital run out: {player} dismissed for {batter_total}"
                reason_parts.append("costly run out miscommunication")
            else:
                desc = f"{player} dismissed ({e.wicket_kind}) by {e.bowler}"

            if consecutive_wickets[e.bowler] >= 2:
                w += 1.5
                desc = f"Consecutive wickets! {e.bowler} removes {player}"
                reason_parts.append("double strike / hat-trick chance")

            candidate_moments.append({
                "index": e.index,
                "over_ball": over_ball_label,
                "description": desc,
                "weight": w,
                "reason": " - ".join(reason_parts)
            })

            partnership_runs = 0
        else:
            consecutive_wickets[e.bowler] = 0

        is_pressure_over = (
            (facts.required_run_rate is not None and facts.required_run_rate > facts.run_rate + 2.0)
            or e.over >= 14
        )

        if e.runs_batter == 6:
            w = 1.5 + (0.5 if is_pressure_over else 0.0)
            candidate_moments.append({
                "index": e.index,
                "over_ball": over_ball_label,
                "description": f"Massive six by {e.batter} off {e.bowler}",
                "weight": w,
                "reason": "Six in crunch phase" if is_pressure_over else "Maximum cleared the ropes"
            })
        elif e.runs_batter == 4 and is_pressure_over:
            candidate_moments.append({
                "index": e.index,
                "over_ball": over_ball_label,
                "description": f"Clutch boundary: {e.batter} finds the gap off {e.bowler}",
                "weight": 1.2,
                "reason": "Boundary struck during high required run rate"
            })

        is_last_ball_of_over = (e.ball == 6 or idx == len(innings_events) - 1 or (idx + 1 < len(innings_events) and innings_events[idx + 1].over != e.over))
        if is_last_ball_of_over:
            total_in_over = over_runs_map[e.over]
            if total_in_over >= 15:
                candidate_moments.append({
                    "index": e.index,
                    "over_ball": f"{e.over + 1}.0",
                    "description": f"Big over: {total_in_over} runs plundered in over {e.over + 1}",
                    "weight": 2.2,
                    "reason": "High-scoring over shifting momentum"
                })
            elif total_in_over == 0 and e.innings == 2 and e.ball >= 6:
                candidate_moments.append({
                    "index": e.index,
                    "over_ball": f"{e.over + 1}.0",
                    "description": f"Stifling maiden bowled by {e.bowler} in over {e.over + 1}",
                    "weight": 1.8,
                    "reason": "Scoreless maiden over mounting scoreboard pressure"
                })

    candidate_moments.sort(key=lambda m: m["weight"], reverse=True)
    top_picks = candidate_moments[:4]
    top_picks.sort(key=lambda m: m["index"])

    return [
        KeyMoment(
            over_ball=m["over_ball"],
            description=m["description"],
            weight=round(m["weight"], 1),
            reason=m["reason"]
        )
        for m in top_picks
    ]
