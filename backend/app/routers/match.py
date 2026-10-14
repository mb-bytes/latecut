import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Request
from app.models import StateSnapshot, BallEvent
from app.facts_extractor import extract_facts, extract_batter_stats, extract_bowler_stats

router = APIRouter()

def build_snapshot(request: Request) -> StateSnapshot:
    replay = request.app.state.replay
    events = request.app.state.events
    meta = request.app.state.meta

    current_idx = replay._current_index
    events_now = events[:current_idx + 1] if events else []
    replay_state = asyncio.run(replay.get_state()) if not asyncio.iscoroutinefunction(replay.get_state) else None

    facts = extract_facts(events_now, meta)
    all_batters = extract_batter_stats(events_now)
    all_bowlers = extract_bowler_stats(events_now)

    current_batters_stats = []
    for p_name in facts.current_batters:
        matched = next((b for b in all_batters if b.name == p_name), None)
        if matched:
            current_batters_stats.append(matched)

    current_bowler_stat = next((bw for bw in all_bowlers if bw.name == facts.current_bowler), None)
    current_innings = events_now[-1].innings if events_now else 1
    is_finished = (current_idx >= len(events) - 1) if events else False

    from app.models import ReplayState
    r_state = ReplayState(
        current_index=replay._current_index,
        is_playing=replay._is_playing,
        speed_multiplier=replay._speed_multiplier,
        total_balls=len(events)
    )

    return StateSnapshot(
        score=facts.score,
        wickets=facts.wickets,
        overs_str=facts.overs,
        run_rate=facts.run_rate,
        required_rate=facts.required_run_rate,
        current_batters=current_batters_stats,
        current_bowler=current_bowler_stat,
        batting_team=facts.batting_team,
        bowling_team=facts.bowling_team,
        innings=current_innings,
        target=facts.target,
        is_finished=is_finished,
        replay=r_state
    )

@router.get("/api/state", response_model=StateSnapshot)
async def get_state(request: Request):
    return build_snapshot(request)

@router.websocket("/ws/match")
async def match_websocket(websocket: WebSocket):
    await websocket.accept()
    replay = websocket.app.state.replay
    events = websocket.app.state.events
    meta = websocket.app.state.meta

    queue = asyncio.Queue(maxsize=100)
    replay.register_queue(queue)

    try:
        current_idx = replay._current_index
        events_now = events[:current_idx + 1] if events else []
        last_ball = events_now[-1] if events_now else None
        facts = extract_facts(events_now, meta)
        all_batters = extract_batter_stats(events_now)
        all_bowlers = extract_bowler_stats(events_now)

        current_batters_stats = [
            b for b in all_batters if b.name in facts.current_batters
        ]
        current_bowler_stat = next((bw for bw in all_bowlers if bw.name == facts.current_bowler), None)
        r_state = await replay.get_state()

        initial_payload = {
            "type": "init",
            "ball": last_ball.model_dump() if last_ball else None,
            "snapshot": {
                "score": facts.score,
                "wickets": facts.wickets,
                "overs_str": facts.overs,
                "run_rate": facts.run_rate,
                "required_rate": facts.required_run_rate,
                "current_batters": [b.model_dump() for b in current_batters_stats],
                "current_bowler": current_bowler_stat.model_dump() if current_bowler_stat else None,
                "batting_team": facts.batting_team,
                "bowling_team": facts.bowling_team,
                "innings": events_now[-1].innings if events_now else 1,
                "target": facts.target,
                "is_finished": current_idx >= len(events) - 1,
                "replay": r_state.model_dump()
            }
        }
        await websocket.send_text(json.dumps(initial_payload))

        while True:
            new_ball = await queue.get()
            cur_idx = replay._current_index
            ev_now = events[:cur_idx + 1]
            f = extract_facts(ev_now, meta)
            b_stats = extract_batter_stats(ev_now)
            bw_stats = extract_bowler_stats(ev_now)

            cur_b = [b for b in b_stats if b.name in f.current_batters]
            cur_bw = next((bw for bw in bw_stats if bw.name == f.current_bowler), None)
            rep_state = await replay.get_state()

            payload = {
                "type": "ball",
                "ball": new_ball.model_dump(),
                "snapshot": {
                    "score": f.score,
                    "wickets": f.wickets,
                    "overs_str": f.overs,
                    "run_rate": f.run_rate,
                    "required_rate": f.required_run_rate,
                    "current_batters": [b.model_dump() for b in cur_b],
                    "current_bowler": cur_bw.model_dump() if cur_bw else None,
                    "batting_team": f.batting_team,
                    "bowling_team": f.bowling_team,
                    "innings": new_ball.innings,
                    "target": f.target,
                    "is_finished": cur_idx >= len(events) - 1,
                    "replay": rep_state.model_dump()
                }
            }
            await websocket.send_text(json.dumps(payload))

    except WebSocketDisconnect:
        replay.unregister_queue(queue)
    except Exception:
        replay.unregister_queue(queue)
