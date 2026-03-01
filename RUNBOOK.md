# Zombie-dance / UAS Admin — Runbook

## মূল উদ্দেশ্য (Current Objective)

- Providers UI refactor:
  - কোনো popup (dialog/toast/confirm) থাকবে না
  - page-based navigation: list → view → edit → new
  - providers list: industry practice অনুযায়ী 2-cards-per-row grid
- Runtime provider switching:
  - `system_settings` থেকে active provider, request timeout, prefer streaming চালানো
  - Provider routing: Google Gemini / Ollama Cloud / local Ollama / llama.cpp
- TypeScript strict type-check clean:
  - `npm run type-check` pass করা
  - archived/work ফোল্ডার compile scope থেকে exclude
- No demo/mock responses:
  - UI/proxy/backend-এ demo response বাদ দিয়ে real backend call + streaming preference সাপোর্ট

---

## বর্তমান অবস্থা (Project State)

### UI (Next.js)

- Providers:
  - `GET /providers` → 2-card grid layout
  - `GET /providers/new` → add provider page
  - `GET /providers/[id]` → view page
  - `GET /providers/[id]/edit` → edit page
  - Provider delete: inline two-step confirm (popup নয়)
  - Provider actions status: inline banner (toast নয়)

- Settings:
  - Runtime provider settings UI wired:
    - `active_provider_id`
    - `model_request_timeout_ms`
    - `prefer_streaming`

- Sidebar:
  - Missing routes fix করা হয়েছে (যেমন `/todo`, `/music`) যাতে sidebar থেকে পেজ ওপেন হয়

### Backend (Express)

- `ProviderGateway`:
  - `system_settings.active_provider_id` থেকে active provider resolve
  - Request timeout + prefer streaming runtime overrides প্রয়োগ
  - Provider type alias normalization:
    - `llama.cpp`, `llama-cpp`, `llamacpp`, `llama_cpp` → `llama_cpp`

- Runtime settings endpoints:
  - `GET /settings/runtime`
  - `PUT /settings/runtime`

- Ollama service:
  - runtime overrides: baseURL/timeout/preferStreaming
  - preferStreaming enable হলে streaming fallback path

---

## গুরুত্বপূর্ণ কনফিগ (Environment)

Frontend `.env.local` (example):

- `UAS_API_URL=http://localhost:8000`
- `UAS_API_KEY=...`

Backend environment:

- `UAS_API_KEY=...`
- `GOOGLE_GEMINI_API_KEY=...` (Gemini ব্যবহার করলে)
- `OLLAMA_BASE_URL=http://localhost:11434`

Security policy:

- DB-তে raw API key persist করা হয় না
- Provider config-এ শুধুমাত্র env var reference (`apiKeyEnvVar`) রাখা হয়

---

## Verification / Smoke Test (Next Steps)

### 1) Type-check

- `npm run type-check`

### 2) Backend + Frontend run

- Backend: `server/` থেকে start (তোমার existing scripts অনুযায়ী)
- Frontend: root থেকে Next dev

### 3) Providers smoke test

1) UI → `/providers/new`:
   - llama.cpp provider add
   - `type`: `llama.cpp` বা `llama_cpp`
   - `endpoint`: তোমার llama.cpp OpenAI-compatible base URL (উদা: `http://127.0.0.1:8080`)

2) UI → `/settings`:
   - Active Provider নির্বাচন
   - Timeout সেট করো
   - Prefer streaming on/off করো

3) UI → `/chat` অথবা `/agents`:
   - prompt পাঠিয়ে verify করো

### 4) Expected outcomes

- UI কোথাও popup/confirm dialog/toast থাকবে না
- Provider switch করলে backend routing active provider অনুযায়ী হবে
- llama.cpp type mismatch থাকলেও routing fail করবে না (normalize করা আছে)

---

## Known follow-ups

- Runtime streaming endpoint (SSE/WebSocket) কে ProviderGateway-aware করা (যদি আলাদা path থাকে)
- Google/Ollama Cloud latency/cost metrics dashboard (Operational Intelligence)
- Tool registry + MCP execution pipeline hardening
- JWT user identity + audit logs (tool execution)
