import asyncio
from typing import List, Optional
from app.models import BallEvent, ReplayState

class ReplayEngine:
    def __init__(self, events: List[BallEvent]):
        self._events = events
        self._current_index = 0
        self._is_playing = False
        self._speed_multiplier = 1.0
        self._lock = asyncio.Lock()
        self._task: Optional[asyncio.Task] = None
        self._subscribers: List[asyncio.Queue] = []

    async def start(self):
        async with self._lock:
            if self._task is None or self._task.done():
                self._task = asyncio.create_task(self._run_loop())

    async def stop(self):
        async with self._lock:
            if self._task and not self._task.done():
                self._task.cancel()
                try:
                    await self._task
                except asyncio.CancelledError:
                    pass

    async def play(self):
        async with self._lock:
            self._is_playing = True

    async def pause(self):
        async with self._lock:
            self._is_playing = False

    async def restart(self):
        async with self._lock:
            self._current_index = 0
            self._is_playing = True

    async def seek(self, over: int, innings: Optional[int] = None):
        async with self._lock:
            target_innings = innings
            if target_innings is None:
                has_second_innings = any(e.innings == 2 for e in self._events)
                target_innings = 2 if has_second_innings else 1

            target_index = None
            for idx, event in enumerate(self._events):
                if event.innings == target_innings and event.over == over:
                    target_index = idx
                    break

            if target_index is None:
                for idx, event in enumerate(self._events):
                    if event.over == over:
                        target_index = idx
                        break

            if target_index is not None:
                self._current_index = target_index

    async def set_speed(self, speed: float):
        async with self._lock:
            if speed in [1.0, 5.0, 10.0, 30.0]:
                self._speed_multiplier = speed

    async def get_state(self) -> ReplayState:
        async with self._lock:
            return ReplayState(
                current_index=self._current_index,
                is_playing=self._is_playing,
                speed_multiplier=self._speed_multiplier,
                total_balls=len(self._events)
            )

    async def get_current_ball(self) -> Optional[BallEvent]:
        async with self._lock:
            if 0 <= self._current_index < len(self._events):
                return self._events[self._current_index]
            return None

    async def get_events_up_to_now(self) -> List[BallEvent]:
        async with self._lock:
            if not self._events:
                return []
            end_index = min(self._current_index + 1, len(self._events))
            return list(self._events[:end_index])

    def register_queue(self, queue: asyncio.Queue):
        if queue not in self._subscribers:
            self._subscribers.append(queue)

    def unregister_queue(self, queue: asyncio.Queue):
        if queue in self._subscribers:
            self._subscribers.remove(queue)

    async def _notify_subscribers(self, event: BallEvent):
        for queue in list(self._subscribers):
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                pass

    async def _run_loop(self):
        while True:
            sleep_duration = 1.0 / self._speed_multiplier
            await asyncio.sleep(sleep_duration)

            current_event = None
            async with self._lock:
                if self._is_playing:
                    if self._current_index < len(self._events) - 1:
                        self._current_index += 1
                        current_event = self._events[self._current_index]
                    else:
                        self._is_playing = False

            if current_event:
                await self._notify_subscribers(current_event)
