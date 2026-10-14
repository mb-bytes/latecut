import json
import time
import asyncio
from typing import AsyncGenerator, List, Optional
from openai import AsyncOpenAI
from app.config import settings
from app.models import FactsObject, KeyMoment, MatchMeta
from app.grounding import check_grounding
from app.cache import catchup_cache

def build_system_prompt(language: str, facts: FactsObject, is_strict_retry: bool = False) -> str:
    lang_inst = "Use English."
    if language.lower() == "hinglish":
        lang_inst = "Use natural Roman-script Hinglish (mix of conversational Hindi and English)."

    strict_note = ""
    if is_strict_retry:
        strict_note = "CRITICAL: Under no circumstances mention any player, score, number, or event not directly listed in the provided facts JSON. Violating this will corrupt the stream."

    try:
        cur_over_float = float(facts.overs)
    except Exception:
        cur_over_float = 0.0

    if facts.is_match_over:
        return (
            "You are a friendly, cricket-loving friend explaining the final match result to a casual fan who just joined. "
            f"{lang_inst} "
            f"The match has completely finished with final result: '{facts.match_result}'. "
            "Strict rules: "
            "1. In 'story', state this final result clearly along with the final score. "
            "2. In 'turning_point', identify the decisive match-winning moment. "
            "3. In 'watch_next', discuss the post-match presentation, trophy celebrations, and player of the match awards. "
            "4. NEVER mention upcoming overs, future bowling spells, or remaining deliveries—the match has concluded. "
            "5. Maximum 70 words in total across all fields. "
            f"{strict_note} "
            "6. Return strict JSON with exactly three keys: 'story', 'turning_point', 'watch_next'."
        )

    # Ongoing LIVE match:
    if cur_over_float < 6.0:
        phase_name = "POWERPLAY"
        batters_list = ", ".join(facts.current_batters) if facts.current_batters else "batters"
        phase_focus = f"Focus on how {facts.batting_team} openers ({batters_list}) tackle field restrictions against {facts.bowling_team}'s opening attack ({facts.current_bowler})."
    elif cur_over_float < 15.0:
        phase_name = "MIDDLE OVERS"
        batters_list = ", ".join(facts.current_batters) if facts.current_batters else "batters"
        target_str = f"chasing {facts.target} (RRR: {facts.required_run_rate})" if facts.target else "building a strong total"
        phase_focus = f"Focus on active batters ({batters_list}) stabilizing the partnership against {facts.current_bowler} and the spinners while {target_str}."
    else:
        phase_name = "DEATH OVERS"
        target_str = f"needing {max(0, facts.target - facts.score)} runs with RRR {facts.required_run_rate}" if facts.target else "launching a final boundary onslaught"
        phase_focus = f"Focus on death bowling execution by {facts.bowling_team} and aggressive boundary hitting with {facts.batting_team} {target_str}."

    return (
        "You are a friendly, cricket-loving friend explaining the match situation to a casual fan who just joined. "
        f"{lang_inst} "
        f"The match is LIVE AND CURRENTLY IN PROGRESS at over {facts.overs} (score {facts.score}/{facts.wickets})! "
        "CRITICAL MANDATORY INSTRUCTION: The match has NOT finished. Under NO circumstances mention post-match presentation, player of the match awards, tournament standings, or match conclusion! Doing so is a hallucination error. "
        "Strict rules: "
        f"1. Current Phase: {phase_name} (Over {facts.overs}). "
        f"2. For 'watch_next': {phase_focus} Tell the fan what to look out for in the immediate upcoming overs of this live match right now! "
        "3. For 'story': Summarize the situation up to over {facts.overs}. "
        "4. For 'turning_point': Highlight a key dismissal or momentum swing that shaped the game so far. "
        "5. Use ONLY the facts and key moments JSON provided in the prompt. Maximum 70 words in total across all fields. "
        f"{strict_note} "
        "6. Return strict JSON with exactly three keys: 'story', 'turning_point', 'watch_next'."
    )

def build_user_prompt(facts: FactsObject, moments: List[KeyMoment]) -> str:
    payload = {
        "facts": facts.model_dump(),
        "key_moments": [m.model_dump() for m in moments]
    }
    return json.dumps(payload, indent=2)

def build_fallback(facts: FactsObject, moments: list[KeyMoment], language: str) -> dict[str, str]:
    try:
        cur_over_float = float(facts.overs)
    except Exception:
        cur_over_float = 0.0

    if facts.is_match_over:
        if language.lower() == "hinglish":
            story = f"{facts.match_result}! {facts.batting_team} ne {facts.score}/{facts.wickets} score kiya in {facts.overs} overs."
            turning_point = moments[0].description if moments else "Match bohot thrilling tareeqe se khatam hua."
            watch_next = "Match khatam ho chuka hai! Post-match presentation aur player of the match awards dekhein."
        else:
            story = f"{facts.match_result}! {facts.batting_team} finished at {facts.score}/{facts.wickets} in {facts.overs} overs."
            turning_point = moments[0].description if moments else "A thrilling finish to the contest."
            watch_next = "The match has concluded! Tune in for the post-match presentation and player of the match honors."
    elif language.lower() == "hinglish":
        score_str = f"{facts.batting_team} ka score {facts.score}/{facts.wickets} hai in {facts.overs} overs."
        target_str = f" Target {facts.target} runs ka hai." if facts.target else ""
        story = f"{score_str}{target_str} Abhi match bohot exciting phase me hai."
        turning_point = moments[0].description if moments else "Match dono teams ke beech evenly poised hai."
        if cur_over_float < 6.0:
            watch_next = f"Powerplay overs chal rahe hain, dekhein {facts.batting_team} nayi ball ka kaisa faayda uthati hai aur {facts.bowling_team} early wickets le paati hai ya nahi."
        elif cur_over_float < 15.0:
            watch_next = f"Middle overs me spinners aur run-rate acceleration ka kadi takkar dekhne ko milegi."
        else:
            watch_next = (
                f"Death overs chal rahe hain, required rate {facts.required_run_rate} hai! Har ball decisive hogi."
                if facts.required_run_rate
                else f"Death overs me boundaries aur bowling execution par sabki nigahein rahengi."
            )
    else:
        score_str = f"{facts.batting_team} are {facts.score}/{facts.wickets} in {facts.overs} overs."
        target_str = f" Chasing a target of {facts.target} runs." if facts.target else ""
        story = f"{score_str}{target_str} The game is in a vital phase."
        turning_point = moments[0].description if moments else "The contest has seen momentum swings on both sides."
        if cur_over_float < 6.0:
            watch_next = f"Powerplay restrictions are in play—watch how {facts.batting_team} attacks the new ball while {facts.bowling_team} hunts for breakthrough wickets."
        elif cur_over_float < 15.0:
            watch_next = f"Crucial middle overs ahead—watch how the spinners operate and whether the batting pair can accelerate."
        else:
            watch_next = (
                f"Death overs are underway with a required run rate of {facts.required_run_rate}. Every boundary is decisive!"
                if facts.required_run_rate
                else f"Entering the death overs—watch for yorker precision and boundary power-hitting."
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

    full_text = "".join(accumulated_chunks)
    return full_text, prompt_tokens, completion_tokens, time_to_first_token

async def stream_catchup(
    facts: FactsObject,
    moments: List[KeyMoment],
    language: str,
    meta: MatchMeta
) -> AsyncGenerator[str, None]:
    start_overall = time.time()
    cache_key = f"{facts.score}:{facts.overs}:{language.lower()}:{facts.is_match_over}"

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
        simulated_json = json.dumps({
            "story": fallback_data["story"],
            "turning_point": fallback_data["turning_point"],
            "watch_next": fallback_data["watch_next"]
        })
        chunk_sz = 14
        for i in range(0, len(simulated_json), chunk_sz):
            await asyncio.sleep(0.03)
            yield f"event: token\ndata: {json.dumps({'delta': simulated_json[i:i+chunk_sz]})}\n\n"
        yield f"event: done\ndata: {json.dumps(result_payload)}\n\n"
        return

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY, timeout=15.0)
    system_prompt = build_system_prompt(language, facts, is_strict_retry=False)
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

        # Safeguard: If match is NOT over, ensure watch_next has zero post-match presentation hallucination
        if not facts.is_match_over:
            forbidden_tokens = ["post-match", "presentation", "standings", "player of the match will be", "ceremony", "concluded"]
            wn_lower = parsed_json.get("watch_next", "").lower()
            if any(tok in wn_lower for tok in forbidden_tokens):
                fb = build_fallback(facts, moments, language)
                parsed_json["watch_next"] = fb["watch_next"]

        grounding_result = check_grounding(parsed_json, facts, meta, moments)

        if not grounding_result.grounded:
            stricter_sys = build_system_prompt(language, facts, is_strict_retry=True)
            retry_raw, r_p_tokens, r_c_tokens, _ = await execute_openai_call(
                stricter_sys,
                user_prompt,
                client
            )
            try:
                retry_json = json.loads(retry_raw)
                if not facts.is_match_over:
                    forbidden_tokens = ["post-match", "presentation", "standings", "player of the match will be", "ceremony", "concluded"]
                    wn_lower = retry_json.get("watch_next", "").lower()
                    if any(tok in wn_lower for tok in forbidden_tokens):
                        fb = build_fallback(facts, moments, language)
                        retry_json["watch_next"] = fb["watch_next"]

                second_check = check_grounding(retry_json, facts, meta, moments)
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
        simulated_json = json.dumps({
            "story": fallback_data["story"],
            "turning_point": fallback_data["turning_point"],
            "watch_next": fallback_data["watch_next"]
        })
        chunk_sz = 14
        for i in range(0, len(simulated_json), chunk_sz):
            await asyncio.sleep(0.03)
            yield f"event: token\ndata: {json.dumps({'delta': simulated_json[i:i+chunk_sz]})}\n\n"
        yield f"event: done\ndata: {json.dumps(fallback_response)}\n\n"
