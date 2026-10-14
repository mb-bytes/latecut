from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from app.models import CatchupRequest
from app.facts_extractor import extract_facts
from app.key_moment_detector import detect_key_moments
from app.catchup_service import (
    stream_catchup,
    build_system_prompt,
    build_user_prompt
)

router = APIRouter()

@router.post("/api/catchup")
async def get_catchup_stream(req: CatchupRequest, request: Request):
    replay = request.app.state.replay
    events = request.app.state.events
    meta = request.app.state.meta

    current_idx = replay._current_index
    events_now = events[:current_idx + 1] if events else []

    facts = extract_facts(events_now, meta)
    moments = detect_key_moments(events_now, facts)

    return StreamingResponse(
        stream_catchup(facts, moments, req.language, meta),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.get("/api/catchup/inspect")
async def inspect_catchup(request: Request, language: str = "en"):
    replay = request.app.state.replay
    events = request.app.state.events
    meta = request.app.state.meta

    current_idx = replay._current_index
    events_now = events[:current_idx + 1] if events else []

    facts = extract_facts(events_now, meta)
    moments = detect_key_moments(events_now, facts)

    system_prompt = build_system_prompt(language, facts=facts, is_strict_retry=False)
    user_message = build_user_prompt(facts, moments)

    return {
        "facts": facts.model_dump(),
        "key_moments": [m.model_dump() for m in moments],
        "system_prompt": system_prompt,
        "user_message": user_message
    }
