# ZombieCoder — Stream Status (Admin + MCP + Editor Integration)

## 1) বর্তমান অবস্থা (High-level)

- সার্ভার চলছে: `http://localhost:8000`
- WebSocket চলছে: `ws://localhost:8000/ws`
- MCP Gateway চলছে:
  - `GET /mcp/tools` (public)
  - `POST /mcp/execute` (protected: `X-API-Key`)
- VS Code/Windsurf extension থেকে MCP:
  - `MCP: List Tools`
  - `MCP: Execute Tool`

## 2) Admin থেকে কী করা যাচ্ছে (section-by-section)

### 2.1 Agents

- `GET /agents` থেকে agents list পাওয়া যাচ্ছে।
- Agent persona আপডেট API (protected):
  - `PUT /settings/agents/:agentId/persona`

### 2.2 Settings

- Default model getter/setter আছে:
  - `GET /settings/default-model`
  - `PUT /settings/default-model` (protected)

### 2.3 Prompt Templates

- CRUD endpoint আছে এবং write route গুলো protected।

### 2.4 MCP Gateway

- Admin panel থেকে সরাসরি কোনো “connected editor list” view এখনো নেই।
- তবে সার্ভারের API audit logs এবং WebSocket logs থেকে ব্যবহার পর্যবেক্ষণ করা যায় (এটা UI হিসেবে পরে যোগ করা যাবে)।

## 3) MCP কীভাবে editor-এর সাথে যুক্ত হচ্ছে

### 3.1 বর্তমান wiring (VS Code/Windsurf extension)

- Extension settings:
  - `zombie-dance.serverUrl` = `http://localhost:8000`
  - `zombie-dance.apiKey` = backend-এর `UAS_API_KEY`

- Extension commands:
  - `MCP: List Tools` → `GET /mcp/tools`
  - `MCP: Execute Tool` → `POST /mcp/execute`

### 3.2 নতুনভাবে connect করতে হলে

- Backend চালু রাখো (port 8000)
- Extension settings-এ `serverUrl` এবং `apiKey` সেট করো
- Command Palette থেকে MCP commands চালাও

## 4) সার্ভার থেকে কী ধরনের response পাওয়া যাচ্ছে

### 4.1 MCP tools list

- `GET /mcp/tools` → `200 OK` এবং tool registry JSON

### 4.2 MCP execute security

- `POST /mcp/execute` → API key ছাড়া `401 Unauthorized`
- API key সহ tool execute হলে `200 OK` এবং payload:
  - `success`, `toolName`, `output`, `latency_ms`

## 5) Agent Persona — DB আপডেট স্ট্যাটাস

এই persona/ethical docs অনুযায়ী DB তে ৪টা agent আপডেট করা হয়েছে:

- Chat Assistant → persona_name: `ZombieCoder Chat Assistant`
- Code Editor Agent → persona_name: `ZombieCoder Dev Agent`
- Code Reviewer → persona_name: `ZombieCoder Code Reviewer`
- Documentation Writer → persona_name: `ZombieCoder Documentation Writer`

এগুলো `PUT /settings/agents/:id/persona` দিয়ে সেট করা হয়েছে এবং `metadata.system_prompt`-এ guardrails apply হয়েছে।

## 6) Session metadata / identity / tool বাস্তবায়ন বাস্তবে কাজ করছে কি না

### 6.1 Identity anchoring

- Server response header এ `X-Powered-By: ZombieCoder-by-SahonSrabon` আছে।
- Prompt build এ identity inject হয় (`PromptTemplateService`, `OllamaService.buildSystemPrompt`)।

### 6.2 Tool execution

- MCP tools registry থেকে tool execute হয়।
- `calculator` / `datetime` / `file_read` smoke test passed.

### 6.3 Session metadata

- WebSocket `agent_stream` payload এ `agentId`, `prompt/messages`, optional `model` যেতে পারে।
- Memory subsystem route initialize আছে; তবে MCP tool list-এ “agents” দেখা যাবে না (কারণ MCP tools ≠ agents)।

## 7) Latency (প্রাথমিক পর্যবেক্ষণ)

- WebSocket ping/pong smoke test: ~17ms (লোকাল)
- MCP tool execution:
  - calculator: ~0ms
  - datetime: ~50-60ms
  - file_read: ~0-5ms

Model inference latency আলাদা (Ollama model + prompt length উপর নির্ভরশীল)।

## 8) কেন MCP list-এ agents দেখা যাচ্ছে না

- `GET /mcp/tools` ইচ্ছাকৃতভাবে শুধু “tools registry” দেখায়।
- Agents list দেখতে endpoint: `GET /agents`.

## 9) যেকোনো ফোল্ডার থেকে editor দিয়ে এজেন্ট ব্যবহার (Experience)

- Editor থেকে মূল experience:
  - tool list → tool execute → output channel এ ফলাফল
  - file read/write + shell (allowlist) দিয়ে “cursor-like” workflow

- সীমাবদ্ধতা (বর্তমান):
  - Admin UI তে connected editor/session presence dashboard নেই
  - MCP execute endpoint এ এখন tool-level audit log/permissions hardening আরও শক্ত করা যেতে পারে

## 10) MCP gateway কোন কোন editor-এর সাথে কাজ করবে

- নিশ্চিতভাবে:
  - VS Code / Windsurf (আমাদের extension দিয়ে)

- তাত্ত্বিকভাবে:
  - যেকোনো editor/IDE যেখানে HTTP client বা MCP client adapter লেখা যায় (Neovim, JetBrains, web editor)

বর্তমানে আমরা HTTP bridge দিয়েছি; full MCP stdio transport bridging পরে যোগ করা যাবে।

## 11) Next

- Admin panel এ MCP usage monitor (audit log view)
- MCP hardening: `file_write`/`shell_exec` stricter policies + per-tool permissions
- Git commit + push
