# LateCut

AI-powered live cricket catch-up app providing one-tap, fully grounded context for fans joining a match late.

---

## 1. The Fan Problem

Cricket matches last anywhere from 3 to 8 hours. Fans frequently join mid-game: during a commute, after work, or following a notification. When they open standard apps, they are greeted by raw numbers (e.g. `132/4 in 16.2 ov`) with no narrative context:
- *Why is the required rate suddenly 12?*
- *Who got out, and did it break a match-winning partnership?*
- *What is the exact match equation right now?*

**LateCut** solves this with a single tap:
1. **Story so far**: A grounded 2-3 sentence summary of the innings state and chase equation.
2. **Turning point**: The single most pivotal moment (breakthrough wicket, 20-run over, or milestone).
3. **What to watch next**: Immediate tactical stakes for the current over.
4. **Bilingual**: Seamless English or natural Roman-script Hinglish commentary.

---

## 2. Architecture

```
                  +----------------------------------------------+
                  |                 Fan Browser                  |
                  |   (React 19, TypeScript, Vite, Tailwind CSS, |
                  |            shadcn/ui primitives)             |
                  +-------+---------------+--------------+-------+
                          ^               |              ^
                          | WebSocket     | POST         | GET
                          | /ws/match     | /api/catchup | /api/catchup/inspect
                          |               | (SSE Stream) |
                          v               v              v
+-------------------------------------------------------------------------------+
|                             FastAPI Backend                                   |
|                                                                               |
|  +--------------------+   +-----------------------+   +--------------------+  |
|  | Cricsheet Data     |-->| Async Replay Engine   |-->| Realtime Streamer  |  |
|  | (backend/data/     |   | (Timer, Lock, Speed:  |   | (WebSocket clients |  |
|  |  match.json)       |   |  1x, 5x, 10x, 30x)    |   |  state snapshot)   |  |
|  +--------------------+   +-----------+-----------+   +--------------------+  |
|                                       |                                       |
|                                       v                                       |
|                    +------------------------------------+                     |
|                    | Pure Facts Extractor               |                     |
|                    | (Score, Overs, RRR, Batters,       |                     |
|                    |  Bowlers, Partnerships, Last 3 ov) |                     |
|                    +------------------+-----------------+                     |
|                                       |                                       |
|                                       v                                       |
|                    +------------------------------------+                     |
|                    | Key-Moment Weighted Detector       |                     |
|                    | (Wickets, Milestones, Sixes,       |                     |
|                    |  Pressure boundaries, Maidens)     |                     |
|                    +------------------+-----------------+                     |
|                                       |                                       |
|                                       v                                       |
|  +-------------------------------------------------------------------------+  |
|  | Catch-Up Engine & AI Transparency                                       |  |
|  | - In-memory bucket cache (TTL: 60s)                                     |  |
|  | - Strict prompt synthesis (role, max 70 words, strict JSON)             |  |
|  | - AsyncOpenAI streaming completions (temperature: 0.3)                 |  |
|  | - Grounding Verification Engine (numbers & player entities cross-check)  |  |
|  | - Automatic 1-attempt stricter re-generation if ungrounded              |  |
|  | - Deterministic template fallback on timeout/rate-limit/offline        |  |
|  +------------------------------------+------------------------------------+  |
+---------------------------------------|---------------------------------------+
                                        v
                            +-----------------------+
                            |      OpenAI API       |
                            |      gpt-4o-mini      |
                            +-----------------------+
```

---

## 3. How the AI is Grounded

Hallucinations in sports catch-ups destroy trust (e.g., inventing scores or mentioning benched players). Grounding is built into the architecture:

1. **Deterministic Fact Extraction**: Raw ball events are piped into pure mathematical extractors that compute exact running score, run rate, required run rate, top 3 batters, top 3 bowlers, last 3 overs summaries, and active partnerships.
2. **Weighted Key Moments**: Crucial deliveries are scored using transparent weights:
   - Base wicket: `3.0` (+`1.0` if set batter >=40, +`1.0` if breaks >=40 partnership, +`1.5` for run-outs)
   - Batter milestone (50/100): `2.5` - `3.5`
   - High-scoring over (15+ runs): `2.2`
   - Maiden in chase: `1.8`
   - Pressure six / boundary: `1.2` - `2.0`
3. **Strict Negative Constraints**: System prompts forbid inventing any statistics, players, or outcomes not found in the input JSON.
4. **Post-Generation Grounding Verification**:
   - The engine parses every digit/number and every capitalized player entity from the AI output.
   - Each item is cross-referenced against the ground-truth facts and match roster.
   - If an unverified player or number is detected, the engine automatically triggers a strict regeneration pass.
   - The full checklist is displayed live in the **Grounding** tab of the UI.
5. **Deterministic Fallback**: If OpenAI fails, times out, or has invalid credentials, a deterministic template-based summary is constructed instantly from the facts, tagged as `ai: false`.

---

## 4. How to Run Locally

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### Step 1: Clone and Setup Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```
Configure your `.env` (optional, fallback works without API key):
```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
MATCH_JSON_PATH=backend/data/match.json
CACHE_TTL_SECONDS=60
```

Run tests:
```bash
pytest tests/ -v
```

Start the backend:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 2: Setup and Start Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 5. Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Default |
|---|---|---|
| `OPENAI_API_KEY` | OpenAI API Secret Key | `""` (Triggers graceful template fallback) |
| `OPENAI_MODEL` | OpenAI Model | `gpt-4o-mini` |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowed origins | `http://localhost:5173,http://127.0.0.1:5173` |
| `MATCH_JSON_PATH` | Path to Cricsheet match JSON file | `backend/data/match.json` |
| `CACHE_TTL_SECONDS` | In-memory cache expiration | `60` |

### Frontend (`frontend/.env`)
| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | HTTP base URL for FastAPI backend | `http://localhost:8000` |
| `VITE_WS_URL` | WebSocket URL for match state stream | `ws://localhost:8000` |
