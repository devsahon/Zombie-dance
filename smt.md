# Zombie-dance (windos/) – Handoff & Next Plan (Authoritative)

> This file is the single source of truth for continuing work on this repository.
> If an agent cannot follow this plan precisely, it must stop and ask for clarification.

## 1) Non-Negotiable Rules (Agent Guardrails)

- Do not introduce Bengali text in code, comments, UI labels, API responses, or documentation files.
- Do not add demo/fallback/mock responses anywhere.
- Do not add features outside the plan below.
- Do not change system identity branding (owner/identity) unless explicitly requested.
- Prefer minimal, reversible changes. If a change is risky or broad, propose the change first.
- If you do not understand the repository structure, stop and ask.
- If you do not know how to implement a requirement correctly, stop and ask.

## 2) Repository Overview

This repository contains a Next.js App Router frontend and a TypeScript/Express backend.

- Frontend (Next.js): `windos/app/*`
- Backend (Express): `windos/server/src/*`
- Next.js proxies (API gateway pattern): `windos/app/api/proxy/*`
- Database schema reference: `windos/server/database/schema.sql`

### Provider storage

Providers are stored in the MySQL table:

- `ai_providers`
  - `id`
  - `name`
  - `type` (includes `llama_cpp`)
  - `api_endpoint`
  - `config_json`
  - `is_active`

## 3) Completed Work (Current State)

### 3.1 Providers UI: NO MODALS

The Providers UI has been refactored to remove dialogs/modals and use dedicated pages:

- List: `GET /providers` → `windos/app/providers/page.tsx`
- Create: `GET /providers/new` → `windos/app/providers/new/page.tsx`
- View: `GET /providers/[id]` → `windos/app/providers/[id]/page.tsx`
- Edit: `GET /providers/[id]/edit` → `windos/app/providers/[id]/edit/page.tsx`

Actions are link-based:

- Add Provider → `/providers/new`
- View Provider → `/providers/[id]`
- Edit Provider → `/providers/[id]/edit`

### 3.2 Provider Test Endpoint

Backend endpoint added:

- `POST /providers/:id/test`

Behavior:

- Reads provider `api_endpoint` from DB.
- Attempts connectivity by requesting:
  - `${endpoint}/v1/models`
  - then `${endpoint}/models`
- Returns success with `responseTime` on the first 2xx response.

Backend file:

- `windos/server/src/routes/providers.ts`

### 3.3 Providers Proxy Normalization

Proxy endpoints used by UI:

- `GET /api/proxy/providers` → backend `GET /providers`
- `GET /api/proxy/providers/[id]` → backend `GET /providers/:id`
- `POST /api/proxy/providers/[id]/test` → backend `POST /providers/:id/test`
- `PUT /api/proxy/providers/[id]` → backend `PUT /providers/:id`
- `DELETE /api/proxy/providers/[id]` → backend `DELETE /providers/:id`

Normalization:

- List endpoint always returns `{ providers: Provider[] }` to the UI.
- Single endpoint returns `{ provider: Provider }` to the UI.

### 3.4 No Fallback/Mock Responses (Providers)

Fallback/demo providers were removed:

- Next.js proxy: `windos/app/api/proxy/providers/route.ts`
- Express backend: `windos/server/src/routes/providers.ts`

Current policy:

- If the DB is unavailable, Providers routes must return `503`.
- Do not serve hardcoded providers.

## 3.5 RBAC + Plans (Database Schema Added)

Role-based access and plan-based access control are now defined at the database level.

Schema file:

- `windos/server/database/schema.sql`

Tables:

- `roles`
  - `id`, `name` (unique), `description`, `is_system`
- `role_permissions`
  - `role_id` → `roles.id`
  - `permission_key` (unique per role)
- `users`
  - `email` (unique)
  - `password_hash`
  - `role_id` → `roles.id`
  - `is_active`, `last_login_at`
- `plans`
  - `name` (unique)
  - `duration_days` (controls access time window)
  - `features_json`
- `user_plan_subscriptions`
  - `user_id` → `users.id`
  - `plan_id` → `plans.id`
  - `status` (`active|expired|revoked`)
  - `starts_at`, `ends_at`
  - `created_by_user_id` → `users.id` (admin who created the subscription)

Intended access model:

- Admin access is role-based (via `roles` + `role_permissions`).
- Standard user access is plan/time-window based:
  - A user is considered to have an active plan when there exists a subscription with:
    - `status = 'active'`
    - `NOW()` between `starts_at` and `ends_at`

Demo seed data:

- System roles: `admin`, `user`
- Example permissions for admin and user roles
- Plans: `Free`, `Basic`, `Pro`
- Demo users:
  - `admin@example.com`
  - `user1@example.com`
- Demo subscription:
  - `user1@example.com` subscribed to `Basic`

Important:

- Seeded password hashes are placeholders and must be replaced by real bcrypt hashes during the authentication implementation.

## 4) Known Gaps / Technical Debt

### 4.1 CLI Agent payload mismatch

Frontend CLI page sends `{ cmd: "..." }`, but backend `cli-new` route expects:

- `command`
- `args`
- `workingDirectory`

This must be resolved before implementing registered admin commands and background jobs.

Relevant files:

- UI: `windos/app/cli-agent/page.tsx`
- Proxy: `windos/app/api/proxy/cli-agent/execute/route.ts`
- Backend: `windos/server/src/routes/cli-new.ts`

## 5) Tests Performed (What is verified)

- Providers list page renders without modals.
- Navigation exists for create/view/edit pages.
- Provider test endpoint exists on backend and is reachable through proxy.

Recommended verification commands (manual):

- `curl http://localhost:8000/providers`
- `curl -X POST http://localhost:8000/providers/1/test`
- Browser test:
  - `/providers`
  - `/providers/new`
  - `/providers/<id>`
  - `/providers/<id>/edit`

## 6) Dependencies

### 6.1 Backend

- `axios` is used for provider test.
- Confirmed present in: `windos/server/package.json`

### 6.2 Upcoming dependencies (NOT installed yet)

These are planned for later phases (User Management / JWT / embeddings):

- JWT libraries (Node): e.g. `jsonwebtoken`, `bcrypt` (exact choice to be decided)
- ChromaDB client (language choice to be decided)

Do not install new dependencies until the design is finalized.

## 7) Next Implementation Plan (Strict)

### Phase A (Immediate)

1) Documentation copy
- Copy `/home/sahon/Zombie-dance/work/*` docs into `/home/sahon/Zombie-dance/docs/` preserving structure.
- This may require terminal access depending on environment restrictions.

2) Create a dedicated User Management system
- Implement authentication with JWT (admin/user).
- Create a User Management page in the Next.js UI.
- Protect admin routes (providers write routes, CLI execution, tunnel control).

### Phase B

3) Provider independence & embeddings
- Add ChromaDB-based embedding storage.
- Select a lightweight embedding model that can run alongside the server.
- System must not break if Ollama is not installed.

4) Standardize API output for interoperability
- Ensure API output can be used as OpenAI-standard compatible responses where applicable.

### Phase C

5) Cloud tunnel control
- Admin can start/stop a tunnel.
- Tunnel start/stop must be executed by backend via registered commands.
- No arbitrary command execution exposed to non-admin users.

## 8) Security Requirements (Non-Negotiable)

- No unauthenticated admin operations.
- All sensitive actions must require JWT-based authorization.
- Provider keys (if stored) must be encrypted at rest.

## 9) If You Are a New Agent

Before doing anything:

1) Read this file fully.
2) Inspect current code for Providers pages and confirm there are no modals.
3) Confirm Providers routes have no fallback/mock responses.
4) Propose a concrete plan and confirm with the user.

If any part is unclear, stop and ask.
