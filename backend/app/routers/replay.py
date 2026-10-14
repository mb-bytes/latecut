from fastapi import APIRouter, Request, HTTPException
from app.models import ReplayControlRequest, ReplayState

router = APIRouter()

@router.post("/api/replay/control", response_model=ReplayState)
async def control_replay(req: ReplayControlRequest, request: Request):
    replay = request.app.state.replay

    if req.action == "play":
        await replay.play()
    elif req.action == "pause":
        await replay.pause()
    elif req.action == "restart":
        await replay.restart()
    elif req.action == "seek":
        if req.over is None:
            raise HTTPException(status_code=400, detail="Over parameter required for seek")
        await replay.seek(req.over)
    elif req.action == "speed":
        if req.speed is None:
            raise HTTPException(status_code=400, detail="Speed parameter required")
        await replay.set_speed(req.speed)

    if req.speed is not None and req.action != "speed":
        await replay.set_speed(req.speed)

    return await replay.get_state()
