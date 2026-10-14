from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.data_loader import load_match_data
from app.replay_engine import ReplayEngine
from app.routers import match, replay, catchup

@asynccontextmanager
async def lifespan(app: FastAPI):
    meta, events = load_match_data(settings.MATCH_JSON_PATH)
    replay_engine = ReplayEngine(events)
    await replay_engine.start()

    app.state.meta = meta
    app.state.events = events
    app.state.replay = replay_engine

    yield

    await replay_engine.stop()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(match.router)
app.include_router(replay.router)
app.include_router(catchup.router)

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}
