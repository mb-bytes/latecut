# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Casual and passionate cricket fans who join a live match late (during commutes, work breaks, or evening catch-up) and want an immediate, grounded orientation without parsing spreadsheets of raw scorecards.

## Product Purpose

Deliver a grounded, one-tap AI catch-up of any live or replayed cricket match:
- A clear narrative story of the innings so far.
- The single pivotal turning point that shifted win probability.
- Tactical guidance on what to watch in the upcoming overs.
- Bilingual commentary in English and natural conversational Hinglish.

## Positioning

Unlike generic sports apps that only display raw numbers (e.g. 132/4 in 16.2 ov) or ungrounded generative AI summaries that hallucinate player figures, I Just Joined pairs deterministic pure-math fact extraction with weighted key-moment detection and an automated post-generation grounding verification check. If any number or player name cannot be verified from the match data, the system flags it transparently or regenerates it under stricter constraints.

## Operating Context

- Mobile and desktop web browsers during live game action.
- Fast-paced sports consumption: users want instant orientation within 5 to 10 seconds.
- Second-screen companion to television or live streaming broadcasts.

## Capabilities and Constraints

- Capabilities:
  - Real-time WebSocket match state and delivery feed streaming.
  - Server-Sent Events (SSE) AI narrative generation with typewriter streaming.
  - Ball-by-ball replay engine with runtime speed adjustments (1x, 5x, 10x, 30x) and late-join seek slider (0–20 overs).
  - Deterministic template fallback summary when AI API is unavailable or offline.
  - Deep AI auditability panel exposing pure facts JSON, weighted key moments, prompt construction, entity verification checklist, and latency/token telemetry.
- Constraints:
  - Replay simulation mode alongside future live match feed ingestion.
  - Strict grounding verification: all numbers (runs, wickets, overs) and player names cross-referenced against ground truth.
  - Zero comments in source code: code self-documents through intentional naming and typing.

## Brand Commitments

- Name: I Just Joined (LateCut).
- Tone: Knowledgeable, enthusiastic cricket friend speaking naturally to a fan.
- Aesthetic: Sports-modern dark mode, high-contrast green accents, clean typography, and elevated micro-interactions.

## Evidence on Hand

- Cricsheet ball-by-ball match dataset (`backend/data/match.json`) featuring ICC T20 World Cup 2022 (India vs Pakistan at the Melbourne Cricket Ground).
- Full 8-test unit suite verifying facts extraction, moment weighting, and grounding verification.

## Product Principles

1. Grounding Over Speculation: Never invent players, scores, or events; trust is lost the moment an AI hallucinates a non-existent six or wrong batter.
2. Narrative Clarity: Explain the "why" behind the numbers (the turning point, the momentum swing, the required run rate pressure).
3. Radical Transparency: The fan should always be able to inspect the exact facts and prompt that produced the commentary.
4. Seamless Fallback: The product remains 100% usable as an interactive live scoreboard and template summary even if AI APIs fail.

## Accessibility & Inclusion

- Responsive, mobile-first design usable on high and low screen resolutions.
- High-contrast color scales for boundary indicators (emerald 4s, amber 6s, rose wickets).
- Clear typography hierarchy with mono fonts for numeric statistics and sans-serif for narrative text.
