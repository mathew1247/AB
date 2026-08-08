# AI Adaptive Interviewer — Backend

Backend for an AI-powered adaptive interview platform: the interviewer starts from a candidate's weakest topic, adapts difficulty as the candidate answers, and generates a full feedback report at the end.

**Stack:** Node.js + Express + Socket.IO + TypeScript + MongoDB (Mongoose). REST + real-time events share the same service layer.

> Frontend lives in `../FRONTEND` and is deployed separately on Render. This backend is deployed on Vercel (serverless + long-lived Socket.IO instance).

---

## Architecture

```
FRONTEND (React, Render)
   |  HTTPS + Socket.IO
   v
Express app (Vercel, single long-lived instance)
   |- REST   /health, /api/candidates, /api/curricula, /api/interviews...
   |- Socket.IO  interview:start / answer / end / question / evaluation / completed / error
   |- InterviewService  (async, repository-backed, double-submit lock)
   |- CandidateService / CurriculumService  (static mock data)
   |- AiService  (openai or mock provider)
   |- Repository  InMemoryInterviewRepository  OR  MongoInterviewRepository (Mongoose)
```

**Repository selection** (`src/services/index.ts`):
- `MONGODB_URI` set → `MongoInterviewRepository` (Mongoose, `findOneAndUpdate` upsert).
- `MONGODB_URI` empty/missing → `InMemoryInterviewRepository` (dev/tests; data lost on restart).

---

## Getting started

```bash
npm install
cp .env.example .env   # then edit
npm run dev            # tsx watch
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Local dev server (tsx watch) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled server |
| `npm test` | Run the vitest suite |
| `npm run typecheck` | `tsc --noEmit` |

### Environment variables

See `.env.example`. Key ones:

| Variable | Description |
| --- | --- |
| `PORT` | Local listen port (default `5000`) |
| `CLIENT_URL` | Comma-separated allowed CORS origins. **Required in production** (server refuses to boot without it). |
| `MONGODB_URI` | MongoDB Atlas connection string. Leave empty for in-memory persistence. |
| `AI_PROVIDER` | `mock` (built-in, no key) or `openai` (any OpenAI-compatible API). |
| `AI_API_KEY` / `AI_MODEL` / `AI_BASE_URL` / `AI_TIMEOUT_MS` | Only needed with `openai`. |
| `DEFAULT_TOTAL_QUESTIONS` | Default interview length (1–20). |
| `MAX_ANSWER_LENGTH` | Max answer characters (default 4000). |
| `RATE_LIMIT_MAX` | API requests per minute per IP (default 100). |

---

## REST API

All responses: `{ success, data }` or `{ success: false, error: { code, message } }`.

| Method | Path | Body | Description |
| --- | --- | --- | --- |
| GET | `/health` | — | Liveness check |
| GET | `/api/candidates` | — | List candidates with 1–5 ratings per skill |
| GET | `/api/curricula` | — | List curricula with topics → sub-topics |
| POST | `/api/interviews` | `{ candidateId, curriculumId, totalQuestions }` | Start interview, returns `{ interview, question }` |
| GET | `/api/interviews/:id` | — | Current interview state |
| POST | `/api/interviews/:id/answer` | `{ answer }` | Submit answer; returns evaluation + next question or completion |
| POST | `/api/interviews/:id/end` | — | End early; returns feedback |
| GET | `/api/interviews/:id/feedback` | — | Final feedback report |

**Error codes:** `VALIDATION_ERROR`, `NOT_FOUND`, `INVALID_INTERVIEW_STATE`, `INTERVIEW_NOT_FOUND`, `INTERVIEW_NOT_COMPLETED`, `CORS_DENIED`, `RATE_LIMITED`, `AI_MALFORMED_RESPONSE`, `AI_PROVIDER_FAILURE`, `AI_INVALID_RESPONSE`, `AI_QUESTION_GENERATION_FAILED`, `AI_EVALUATION_FAILED`, `AI_FEEDBACK_GENERATION_FAILED`, `INTERNAL_ERROR`.

---

## Socket.IO events

| Event (client → server) | Payload | Ack |
| --- | --- | --- |
| `interview:start` | `{ candidateId, curriculumId, totalQuestions }` | `(error, { interviewId, question, questionNumber, totalQuestions, topic, difficulty })` |
| `interview:answer` | `{ interviewId, answer }` | `(error)` |
| `interview:end` | `{ interviewId }` | `(error)` |

| Event (server → client) | Payload |
| --- | --- |
| `interview:question` | `{ interviewId, question, questionNumber, totalQuestions, topic, difficulty }` |
| `interview:evaluation` | `{ interviewId, evaluation, questionNumber }` |
| `interview:next-question` | `{ interviewId, question, questionNumber, topic, difficulty }` |
| `interview:completed` | `{ interviewId, feedback }` |
| `interview:error` | `{ code, message }` |

**Contract:** after every `interview:start`, the server emits `interview:question` before acking. Each `interview:answer` is followed by exactly one `interview:evaluation` and then either `interview:next-question` or `interview:completed` (determined by `totalQuestions` vs `questionNumber`).

---

## Deployment

**Vercel (this backend):**
- `api/index.ts` exports the captured HTTP server (Socket.IO must stay in a single long-lived instance — enable the "Increase request concurrency" / long-lived function setting; WebSocket support via `vercel.json`).
- Build command `npm run build`; set env vars (`CLIENT_URL=https://<frontend>.onrender.com`, `MONGODB_URI`, `AI_PROVIDER`, ...) in the Vercel dashboard.
- Route config (`vercel.json`): `/api` + `/health` and `/socket.io/*` → `api/index`.

**Render (frontend):** static site pointing at the Vercel backend URL; the frontend origin must be in the backend's `CLIENT_URL`.

**MongoDB Atlas:** set `MONGODB_URI` (SRV string, password URL-encoded). Add the deploy environment's IPs (or `0.0.0.0/0`) to the cluster's network access allowlist.

---

## Testing

`npm test` (vitest, 30 tests across 7 files):

- `difficulty.test.ts` — difficulty progression logic
- `data-services.test.ts` — candidate/curriculum services
- `interview.service.test.ts` — start/answer/end flow, double-submit lock, AI failure recovery
- `repository.test.ts` — in-memory repository durability across service instances
- `mongo.repository.test.ts` — Mongo session↔document mapping (model mocked; offline)
- `socket.test.ts` — full Socket.IO flow on an ephemeral port
- `cors.test.ts` — allowed/denied origins, preflight

Tests run with `NODE_ENV=test` (dotenv skipped) so they never touch MongoDB or a real AI provider.

---

## Known limitations

- **Atlas IP allowlist:** the local machine's IP must be added to the Atlas cluster's network access allowlist before a real DB round-trip can be verified locally.
- Real OpenAI evaluation is not exercised by the suite; `mock` provider is used (deterministic scores). Swap `AI_PROVIDER=openai` to validate end-to-end.
- In-memory fallback loses interview state on restart (intended for dev only).
