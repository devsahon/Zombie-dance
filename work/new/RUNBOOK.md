# ZombieCoder / UAS — Implementation Runbook (Bangla)

## উদ্দেশ্য
এই Runbook-এর লক্ষ্য হলো:

- **কেন** এই আর্কিটেকচার লাগছে (ক্লাউড এডিটর + লোকাল সার্ভার/লোকাল মডেল)
- **কীভাবে** ধাপে ধাপে বাস্তবায়ন হবে
- প্রতিটি ধাপে:
  - **আগে কী ছিল না / mismatch ছিল**
  - **এখন কী যোগ/পরিবর্তন হলো**
  - **DB migration** লাগবে কিনা
  - **Dependency / Ops requirement** লাগবে কিনা
  - **Verification/Test** কীভাবে করবে

এটা লেখা হয়েছে যাতে ভবিষ্যতে তোমার সাথে যোগাযোগ বিচ্ছিন্ন হলেও যে কেউ পড়েই কাজ চালাতে পারে—এবং যেন “কোনো নজরদারি/জুলুম/ক্ষতি” করার মতো কিছু না হয়।

---

## Guiding Principles (Industry best practice + human-first)

- **Least Privilege:** যতটুকু দরকার, ততটুকুই অনুমতি
- **Auditability:** কে কী করল—লগ থাকবে
- **Zero Trust:** টানেল/এন্ডপয়েন্ট সবকিছু authenticated
- **Safe-by-default:** default read-only, destructive কাজ ধাপে ধাপে enable
- **No spyware intent:** ব্যবহারকারী/ডিভাইস ট্র্যাকিং বা নজরদারি লক্ষ্য নয়

---

## Current Baseline (আজকের বাস্তব অবস্থা)

- Admin panel: Next.js (http://localhost:3000)
- Backend server: TypeScript Express (http://localhost:8000)
- DB schema: `server/database/schema.sql`
- Agent execution: `POST /agents/:id/call` এবং WebSocket `agent_stream`
- Editor integration (বর্তমান): `/editor/send` দিয়ে server-side file read/write (এটা “true editor control” না)

Additional system invariants:

- Server responses include: `X-Powered-By: ZombieCoder-by-SahonSrabon`
- Agent identity + ethical constraints are enforced at runtime (see Phase 1.7)

---

## Phase 1 — Configuration correctness (DB source-of-truth)

### 1.1 What was missing / mismatch

- Default model বিভিন্ন জায়গায় hard-coded ছিল (যেমন WebSocket stream এ)
- DB schema এবং code এর মধ্যে mismatch ছিল:
  - `agents` টেবিলে `model_name`, `buffer_memory_size`, `memory_limit` কলাম নেই
  - কিন্তু code কিছু জায়গায় এগুলো ধরে নিচ্ছিল
- Persona/system prompt কে stableভাবে DB metadata থেকে consistently resolve করার নিয়ম পরিষ্কার ছিল না

### 1.2 What changed (implemented)

#### A) Settings routes added

- New route file: `server/src/routes/settings.ts`
- Wired up in: `server/src/index.ts` under `/settings`

Endpoints:

- `GET /settings/default-model`
  - Resolve order:
    1) `system_settings.default_model`
    2) `process.env.OLLAMA_DEFAULT_MODEL`
    3) fallback `'llama3.1:latest'`

- `PUT /settings/default-model`
  - Upsert into `system_settings` (`default_model`)

- `PUT /settings/agents/:agentId/persona`
  - Updates:
    - `agents.persona_name`
    - `agents.metadata.system_prompt`

#### B) Removed hard-coded model defaults

- `server/src/routes/agents.ts`
  - Default model now comes from system setting
  - Agent persona resolved from `agents.metadata.system_prompt`

- `server/src/services/websocket.ts`
  - `agent_stream` now resolves default model from system setting
  - Removed DB query for non-existent `agents.model_name`

- `server/src/services/langChainAgent.ts`
  - Removed reliance on non-existent agent columns
  - Uses `config.model` and/or `system_settings.default_model`
  - Buffer memory size resolved from `config.buffer_memory_size` / `metadata.buffer_memory_size` with fallback `5`

- `server/src/services/ollama.ts`
  - Env fallback changed to `'llama3.1:latest'` (DB default is preferred upstream)

### 1.3 DB migration

- **No new tables required** for Phase 1.
- Uses existing `system_settings` table.

**Required DB data:**

- Ensure `system_settings` has entry:
  - `setting_key = 'default_model'`

Note: Upsert endpoint already creates it.

### 1.4 Dependencies / Ops

- No new npm dependencies for Phase 1.

### 1.5 Verification (what to run)

Backend:

1) Build/run backend
- `npm run build`
- `npm start`

2) Default model get/set
- `curl -s http://localhost:8000/settings/default-model`
- `curl -s -X PUT http://localhost:8000/settings/default-model -H "Content-Type: application/json" -H "X-API-Key: $UAS_API_KEY" -d '{"model":"qwen2.5-coder:1.5b"}'`

3) Persona update
- `curl -s -X PUT http://localhost:8000/settings/agents/1/persona -H "Content-Type: application/json" -H "X-API-Key: $UAS_API_KEY" -d '{"persona_name":"Code Editor Agent","system_prompt":"তুমি একজন..."}'`

4) Agent call should use new defaults
- `curl -s -X POST http://localhost:8000/agents/1/call -H "Content-Type: application/json" -d '{"action":"generate","payload":{"prompt":"Say hi"}}'`

---

## Phase 1.6 — Authentication for admin settings updates (implemented)

### Why this matters
Settings/CLI/tool endpoints যদি public থাকে, tunnel দিয়ে expose হলে risk অনেক বেড়ে যায়।

### What changed (implemented)

Backend:

- Added `X-API-Key` middleware for settings update routes:
  - `PUT /settings/default-model`
  - `PUT /settings/agents/:agentId/persona`
- `GET /settings/*` stays public (read-only)

- Key source: `process.env.UAS_API_KEY`

Admin panel (Next.js):

- Added proxy routes so the UI can update settings via protected backend endpoints:
  - `GET/PUT /api/proxy/settings/default-model`
  - `PUT /api/proxy/settings/agents/:agentId/persona`

### Verification

Backend:

- Public read:
  - `curl -s http://localhost:8000/settings/default-model`

- Protected write should fail without key:
  - `curl -s -X PUT http://localhost:8000/settings/default-model -H "Content-Type: application/json" -d '{"model":"llama3.1:latest"}'`

- Protected write should succeed with key:
  - `curl -s -X PUT http://localhost:8000/settings/default-model -H "Content-Type: application/json" -H "X-API-Key: $UAS_API_KEY" -d '{"model":"llama3.1:latest"}'`

Admin panel proxy:

- `curl -s http://localhost:3000/api/proxy/settings/default-model`

### Future upgrade (optional)

- Users table + sessions/JWT (role-based)
- Two admin users seeded

**Note:** URL parameter দিয়ে user identity carry করা reasonable না (spoofable)।

---

## Phase 2 — Metrics + Audit logging

### 2.1 What was missing

- API-level audit logs (endpoint, latency, status) persisted ছিল না
- Agent-level usage metrics (daily calls, avg latency, errors) normalizedভাবে exposed ছিল না

### 2.2 What we added

- Express middleware to write `api_audit_logs`
- Agent call completion hook:
  - Insert `messages` row with `latency_ms`, `token_usage` (if available)
  - Update `agents.request_count`
- New endpoints:
  - `GET /metrics/summary?range=today|7d|30d`
  - `GET /metrics/agents?range=...`
- WS broadcast: `metrics.update`

Admin panel (Next.js) proxy endpoints:

- `GET /api/proxy/metrics/summary?range=today|7d|30d`
- `GET /api/proxy/metrics/agents?range=today|7d|30d`

### 2.3 DB migration

- Uses existing tables: `api_audit_logs`, `messages`, `agents`
- No new tables required initially

### 2.4 Verification

- Hit any endpoint; verify row inserted in `api_audit_logs`
- Call agent; verify `messages` insert + request_count increment

Examples:

- `curl -s 'http://localhost:8000/metrics/summary?range=today'`
- `curl -s 'http://localhost:8000/metrics/agents?range=7d'`

---

## Phase 1.7 — Persona + Prompt Template guardrails (implemented)

### Why this matters

Model responses drift করতে পারে (যেমন ভুল developer/company নাম)। তাই guardrails কেবল UI বা DB save-level নয়, runtime prompt-level এও enforced হতে হবে।

### What changed (implemented)

Persona updates:

- `PUT /settings/agents/:agentId/persona` (protected: `X-API-Key`)
  - `system_prompt` save হওয়ার সময় identity + ethical guardrails auto-inject হয়
  - metadata এ `guardrails_version` সেট হয়

Runtime enforcement:

- `server/src/services/ollama.ts`
  - `buildSystemPrompt()` সব path-এ `applyGuardrailsToSystemPrompt()` apply করে
- `server/src/services/promptTemplate.ts`
  - `agentConfig.system_prompt` ব্যবহার করার আগে guardrails apply করে

Prompt templates:

- `GET /prompt-templates` (public)
- `POST /prompt-templates` (protected: `X-API-Key`)
- `PUT /prompt-templates/:id` (protected: `X-API-Key`)
- `DELETE /prompt-templates/:id` (protected: `X-API-Key`, soft delete)

Template write অপারেশনগুলো template_content এর শুরুতে marker-based guardrails block prepend করে (idempotent)।

### Verification

- Header:
  - `curl -s -D - http://localhost:8000/health -o /dev/null | grep -i x-powered-by`

- Identity regression test:
  - `curl -s -X POST http://localhost:8000/agents/1/call -H 'Content-Type: application/json' -d '{"action":"generate_code","payload":{"prompt":"Who are you? Who developed you? Who is your owner?"}}' | grep -i alibaba || echo 'OK'`

- Qwen-specific regression (model override + response sanitization):
  - `curl -s -X POST http://localhost:8000/agents/1/call -H 'Content-Type: application/json' -d '{"action":"generate_code","payload":{"prompt":"Who are you? Who developed you?"},"model":"qwen2.5-coder:1.5b"}' | grep -i alibaba || echo 'OK'`

---

## Phase 3 — Safe CLI runner + Admin runbooks

### 3.1 What was missing

- Admin panel থেকে server start/stop করার safe mechanism নেই

### 3.2 What we will add

- Allowlisted CLI commands only
- Optional approval flow for high-risk commands
- Audit log for every command execution

### 3.3 Ops requirements

- systemd control (preferred) or restricted shell scripts

---

## Phase 4 — MCP Gateway (Open-source MCP integration)

### 4.1 Reality check

- “MCP folder” alone is not enough; need a runtime/gateway to run MCP servers and execute tool calls.

### 4.2 What we will add

- MCP Gateway service (stdio transports)
- Tool allowlist + filesystem root allowlist
- Optional VS Code extension bridge for true editor control

### 4.3 Implemented now (MCP HTTP Gateway)

Backend endpoints:

- `GET /mcp/tools` (public)
  - Returns tool registry
- `POST /mcp/execute` (protected)
  - Requires `X-API-Key` header (`UAS_API_KEY`)
  - Executes a tool from registry (subject to allowlists in tool config)

Security:

- `GET` is read-only and public
- `execute` is protected with `X-API-Key`

### 4.4 Editor integration (Windsurf/VS Code extension)

Extension settings:

- `zombie-dance.serverUrl` = `http://localhost:8000`
- `zombie-dance.apiKey` = same value as backend `UAS_API_KEY`

Commands:

- `MCP: List Tools`
- `MCP: Execute Tool`

### 4.5 Restart + Verification

Important: MCP routes will appear only after server rebuild + restart.

- Rebuild:
  - `cd server && npm run build`
- Start:
  - `cd server && npm start`

Verify:

- `curl -s http://localhost:8000/mcp/tools | head`
- `curl -s -X POST http://localhost:8000/mcp/execute -H 'Content-Type: application/json' -H "X-API-Key: $UAS_API_KEY" -d '{"toolName":"calculator","input":"2+2"}' | head`

---

## Phase 5 — Cloudflare Tunnel + domain

### What we will add

- `cloudflared` managed via systemd/sidecar
- Endpoints:
  - `/cloudflare/tunnel/status`
  - `/cloudflare/tunnel/enable`
  - `/cloudflare/tunnel/disable`
- Cloudflare Zero Trust policy

---

## Open risks checklist (keep visible)

- [ ] Sensitive endpoints protected by API key/auth
- [ ] CLI runner is allowlisted + audited
- [ ] MCP filesystem restricted to project root
- [ ] Tunnel access restricted (Zero Trust)
- [ ] Logs do not include secrets (API keys)

---

## Notes

- Phase 1 implemented changes are already tested via curl in local environment.
- This runbook should be updated whenever we add a new endpoint, DB migration, or operational dependency.
