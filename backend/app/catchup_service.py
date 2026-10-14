import json
import time
from typing import AsyncGenerator, Dict, Any, List, Optional
from openai import AsyncOpenAI
from app.config import settings
from app.models import (
    FactsObject,
    KeyMoment,
    MatchMeta,
    GroundingResult,
    TelemetryData,
    CatchupResponse
)
from app.grounding import check_grounding
from app.cache import catchup_cache

def build_system_prompt(language: str, is_strict_retry: bool = False) -> str:
    lang_inst = "Use English."
    if language.lower() == "hinglish":
        lang_inst = "Use natural Roman-script Hinglish (mix of conversational Hindi and English)."

    strict_note = ""
    if is_strict_retry:
        strict_note = "CRITICAL: Under no circumstances mention any player, score, number, or event not directly listed in the provided facts JSON. Violating this will corrupt the stream."

    return (
        "You are a friendly, cricket-loving friend explaining the current match situation to a casual fan who just joined. "
        f"{lang_inst} "
        "Strict rules: "
        "1. Use ONLY the facts and key moments JSON provided in the prompt. "
        "2. Never invent players, scores, boundaries, or events. "
        "3. Maximum 70 words in total across all fields. "
        f"{strict_note} "
        "4. Return strict JSON with exactly three keys: 'story', 'turning_point', 'watch_next'."
    )

def build_user_prompt(facts: FactsObject, moments: List[KeyMoment]) -> str:
    payload = {
        "facts": facts.model_dump(),
        "key_moments": [m.model_dump() for m in moments]
    }
    return json.dumps(payload, indent=2)

def build_fallback(facts: FactsObject, moments: List[KeyMoment], language: str) -> Dict[str, str]:
    if language.lower() == "hinglish":
        score_str = f"{facts.batting_team} ka score {facts.score}/{facts.wickets} hai in {facts.overs} overs."
        target_str = f" Target {facts.target} runs ka hai." if facts.target else ""
        story = f"{score_str}{target_str} Abhi match bohot exciting phase me hai."
        turning_point = moments[0].description if moments else "Match dono sides ke beech evenly poised hai."
        watch_next = (
            f"Required rate {facts.required_run_rate} chal raha hai, Har ball decisive hogi."
            if facts.required_run_rate
            else f"{facts.current_bowler} ka current spell decisive hoga."
        )
    else:
        score_str = f"{facts.batting_team} are {facts.score}/{facts.wickets} in {facts.overs} overs."
        target_str = f" Chasing a target of {facts.target} runs." if facts.target else ""
        story = f"{score_str}{target_str} The game is at a critical juncture."
        turning_point = moments[0].description if moments else "The game has been evenly contested."
        watch_next = (
            f"Required run rate is {facts.required_run_rate}, every delivery matters."
            if facts.required_run_rate
            else f"Watch how {facts.current_bowler} bowls the remainder of this spell."
        )

    return {
        "story": story,
        "turning_point": turning_point,
        "watch_next": watch_next
    }

async def execute_openai_call(
    system_prompt: str,
    user_prompt: str,
    client: AsyncOpenAI
) -> tuple[str, int, int, int]:
    start_time = time.time()
    time_to_first_token: Optional[int] = None
    accumulated_chunks: List[str] = []
    prompt_tokens = 0
    completion_tokens = 0

    response_stream = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.3,
        stream=True,
        stream_options={"include_usage": True},
        response_format={"type": "json_object"}
    )

    async for chunk in response_stream:
        if chunk.usage:
            prompt_tokens = chunk.usage.prompt_tokens or 0
            completion_tokens = chunk.usage.completion_tokens or 0

        if chunk.choices and len(chunk.choices) > 0:
            delta = chunk.choices[0].delta.content or ""
            if delta:
                if time_to_first_token is None:
                    time_to_first_token = int((time.time() - start_time) * 1000)
                accumulated_chunks.append(delta)

    if time_to_first_token is None:
        time_to_first_token = int((time.time() - start_time) * 1000)

    full_text = "".join(accumulated_chunks)
    return full_text, prompt_tokens, completion_tokens, time_to_first_token

async def stream_catchup(
    facts: FactsObject,
    moments: List[KeyMoment],
    language: str,
    meta: MatchMeta
) -> AsyncGenerator[str, None]:
    start_overall = time.time()
    over_bucket = int(float(facts.overs.split(".")[0])) // 2 if facts.overs else 0
    ball_bucket = int(float(facts.overs.split(".")[1])) // 3 if "." in facts.overs else 0
    cache_key = f"{facts.score}:{over_bucket}:{ball_bucket}:{language.lower()}"

    cached_response = catchup_cache.get(cache_key)
    if cached_response:
        cached_response["telemetry"]["cached"] = True
        yield f"event: done\ndata: {json.dumps(cached_response)}\n\n"
        return

    if not settings.OPENAI_API_KEY:
        fallback_data = build_fallback(facts, moments, language)
        result_payload = {
            "story": fallback_data["story"],
            "turning_point": fallback_data["turning_point"],
            "watch_next": fallback_data["watch_next"],
            "grounded": True,
            "grounding_details": None,
            "telemetry": {
                "model": "deterministic-fallback",
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "time_to_first_token_ms": 10,
                "total_latency_ms": 15,
                "cached": False,
                "ai": False
            }
        }
        for word in fallback_data["story"].split():
            yield f"event: token\ndata: {json.dumps({'delta': word + ' '})}\n\n"
        yield f"event: done\ndata: {json.dumps(result_payload)}\n\n"
        return

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY, timeout=15.0)
    system_prompt = build_system_prompt(language, is_strict_retry=False)
    user_prompt = build_user_prompt(facts, moments)

    try:
        start_time = time.time()
        time_to_first_token = 0
        prompt_tokens = 0
        completion_tokens = 0
        accumulated_chunks: List[str] = []

        response_stream = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,
            stream=True,
            stream_options={"include_usage": True},
            response_format={"type": "json_object"}
        )

        async for chunk in response_stream:
            if chunk.usage:
                prompt_tokens = chunk.usage.prompt_tokens or 0
                completion_tokens = chunk.usage.completion_tokens or 0

            if chunk.choices and len(chunk.choices) > 0:
                delta = chunk.choices[0].delta.content or ""
                if delta:
                    if time_to_first_token == 0:
                        time_to_first_token = int((time.time() - start_time) * 1000)
                    accumulated_chunks.append(delta)
                    yield f"event: token\ndata: {json.dumps({'delta': delta})}\n\n"

        full_raw = "".join(accumulated_chunks)
        parsed_json = json.loads(full_raw)

        grounding_result = check_grounding(parsed_json, facts, meta)

        if not grounding_result.grounded:
            stricter_sys = build_system_prompt(language, is_strict_retry=True)
            retry_raw, r_p_tokens, r_c_tokens, _ = await execute_openai_call(
                stricter_sys,
                user_prompt,
                client
            )
            try:
                retry_json = json.loads(retry_raw)
                second_check = check_grounding(retry_json, facts, meta)
                parsed_json = retry_json
                grounding_result = second_check
                prompt_tokens += r_p_tokens
                completion_tokens += r_c_tokens
            except Exception:
                pass

        total_latency = int((time.time() - start_overall) * 1000)
        telemetry = {
            "model": settings.OPENAI_MODEL,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "time_to_first_token_ms": time_to_first_token,
            "total_latency_ms": total_latency,
            "cached": False,
            "ai": True
        }

        final_response = {
            "story": parsed_json.get("story", ""),
            "turning_point": parsed_json.get("turning_point", ""),
            "watch_next": parsed_json.get("watch_next", ""),
            "grounded": grounding_result.grounded,
            "grounding_details": grounding_result.model_dump(),
            "telemetry": telemetry
        }

        catchup_cache.set(cache_key, final_response, settings.CACHE_TTL_SECONDS)
        yield f"event: done\ndata: {json.dumps(final_response)}\n\n"

    except Exception:
        fallback_data = build_fallback(facts, moments, language)
        total_latency = int((time.time() - start_overall) * 1000)
        fallback_response = {
            "story": fallback_data["story"],
            "turning_point": fallback_data["turning_point"],
            "watch_next": fallback_data["watch_next"],
            "grounded": True,
            "grounding_details": None,
            "telemetry": {
                "model": "deterministic-fallback",
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "time_to_first_token_ms": 20,
                "total_latency_ms": total_latency,
                "cached": False,
                "ai": False
            }
        }
        for word in fallback_data["story"].split():
            yield f"event: token\ndata: {json.dumps({'delta': word + ' '})}\n\n"
        yield f"event: done\ndata: {json.dumps(fallback_response)}\n\n"
