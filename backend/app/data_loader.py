import json
import os
from typing import List, Tuple
from app.models import BallEvent, MatchMeta

def load_match_data(file_path: str) -> Tuple[MatchMeta, List[BallEvent]]:
    resolved_path = file_path
    if not os.path.isabs(resolved_path) and not os.path.exists(resolved_path):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        alt_path = os.path.normpath(os.path.join(current_dir, "..", file_path))
        if os.path.exists(alt_path):
            resolved_path = alt_path

    with open(resolved_path, "r", encoding="utf-8") as file_handle:
        data = json.load(file_handle)

    info = data.get("info", {})
    toss = info.get("toss", {})
    meta = MatchMeta(
        teams=info.get("teams", []),
        venue=info.get("venue", ""),
        date=info.get("dates", [""])[0] if info.get("dates") else "",
        toss_winner=toss.get("winner", ""),
        toss_decision=toss.get("decision", ""),
        players=info.get("players", {}),
        event_name=info.get("event", {}).get("name", "") if isinstance(info.get("event"), dict) else str(info.get("event", "")),
        match_type=info.get("match_type", "")
    )

    innings_list = data.get("innings", [])
    first_innings_total = 0
    if len(innings_list) > 0:
        first_inn = innings_list[0]
        for over_item in first_inn.get("overs", []):
            for delivery in over_item.get("deliveries", []):
                first_innings_total += delivery.get("runs", {}).get("total", 0)

    target_score = first_innings_total + 1 if len(innings_list) > 1 else None

    events: List[BallEvent] = []
    global_index = 0

    for inn_index, inn in enumerate(innings_list, start=1):
        running_score = 0
        running_wickets = 0
        current_target = target_score if inn_index > 1 else None

        for over_item in inn.get("overs", []):
            over_num = over_item.get("over", 0)
            deliveries = over_item.get("deliveries", [])
            for ball_num, deliv in enumerate(deliveries, start=1):
                runs_obj = deliv.get("runs", {})
                runs_batter = runs_obj.get("batter", 0)
                runs_extras = runs_obj.get("extras", 0)
                runs_total = runs_obj.get("total", 0)
                running_score += runs_total

                wickets_raw = deliv.get("wickets") or deliv.get("wicket")
                is_wicket = False
                wicket_kind = None
                player_out = None

                if wickets_raw:
                    is_wicket = True
                    running_wickets += 1
                    first_w = wickets_raw[0] if isinstance(wickets_raw, list) else wickets_raw
                    wicket_kind = first_w.get("kind")
                    player_out = first_w.get("player_out")

                event = BallEvent(
                    index=global_index,
                    innings=inn_index,
                    over=over_num,
                    ball=ball_num,
                    batter=deliv.get("batter", ""),
                    bowler=deliv.get("bowler", ""),
                    non_striker=deliv.get("non_striker", ""),
                    runs_batter=runs_batter,
                    runs_extras=runs_extras,
                    runs_total=runs_total,
                    is_wicket=is_wicket,
                    wicket_kind=wicket_kind,
                    player_out=player_out,
                    running_score=running_score,
                    running_wickets=running_wickets,
                    target=current_target
                )
                events.append(event)
                global_index += 1

    return meta, events
