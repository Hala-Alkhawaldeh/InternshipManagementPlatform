---
date: '2026-07-06'
project_name: 'Internship Management Platform'
user_name: 'hala'
changeType: 'new-scope-addition'
mode: 'batch'
---

# Sprint Change Proposal — AI-Assisted Task Planning for Mentors

## 1. Issue Summary

**Trigger:** New feature request from the project owner (not a defect in a shipped story). All 5 MVP epics are marked `done` in `sprint-status.yaml`. The request:

> A Mentor should be able to press a "Generate Plan" button on the Mentor Dashboard, get an AI-suggested task (based on the selected trainee's track), have it pre-fill the existing New Task form, edit it, and create it as a normal task.

**Issue type:** New requirement emerged from stakeholder (product owner), not a technical failure or misunderstanding.

**Context:** The PRD (`prd.md`, Out of Scope — Phase 2) explicitly lists **"AI agents per track"** as a deferred, post-MVP capability. This request is a deliberately small slice of that Phase-2 idea — one generated task suggestion, not a full roadmap/agent system — being pulled forward now.

## 2. Impact Analysis

### Epic Impact
- **Epic 3 (Task Management & Progress Flow) — unaffected.** Its stories (3.1–3.4) stay `done` as-is. The new feature *reuses* Story 3.1's task-creation path (same `tasks` + `task_progress` insert, same dialog) — it does not modify it.
- **No existing epic fits this cleanly** — it's not task management (already shipped), not evaluation, not UI polish. Cleanest fit is a **new Epic 6**, so completed epics stay untouched and this stays trackable/reversible on its own.
- **Epics 1–5: no changes required.**

### Artifact Conflicts

**PRD (`prd.md`):**
- Direct conflict with "Out of Scope — Phase 2 → AI agents per track." Needs an explicit addendum noting this specific, narrow slice (single generated task suggestion, not a full agent/roadmap system) is being brought into scope now, while the broader Phase 2 vision remains deferred.

**Architecture (`architecture.md`):**
- States: *"no custom backend server; Supabase BaaS handles auth, database, RLS, and storage."* A Supabase **Edge Function** is a new architectural element not previously used in this project. It stays inside the Supabase BaaS boundary (no separate server to host/deploy), so it's an *extension*, not a violation, of that constraint — but it should be documented as a new pattern.
- New integration point: Claude API called server-side from the Edge Function.
- New secret: `ANTHROPIC_API_KEY`, stored via `supabase secrets set`, never shipped to the frontend.
- No database schema changes — the "plan" is a plain `{ title, description }` pair inserted through the existing `tasks` table.

**Security (`docs/security-plan.md`):**
- New secret to track in the Secrets Management table (Section 7): `ANTHROPIC_API_KEY` → Supabase Edge Function secret → never in frontend.
- New requirement not covered by the existing plan: **the Edge Function must verify the caller's role (mentor/admin) from their Supabase JWT before calling the paid Claude API.** Without this, anyone with the public anon key could invoke the function directly and run up API costs — the Supabase-anon-key-is-public assumption that's safe for RLS-protected tables is *not* safe for an endpoint that spends real money per call.

**UI/UX:**
- New button ("✨ Generate Plan") inside the existing trainee-detail view on `MentorDashboard.vue`.
- New loading state while the Edge Function call is in flight.
- No new screens — extends the existing New Task dialog (Story 3.1) by pre-filling `title`/`description`; fields stay fully editable before submission.

**Other artifacts:** No CI/CD, IaC, or monitoring setup exists yet for this project, so none are impacted.

## 3. Recommended Approach

**Selected: Option 1 — Direct Adjustment.** Add one new epic (Epic 6) with two stories, additive to the current structure.

- **Option 2 (Rollback)** — not viable/applicable. Nothing failed; there's nothing to revert.
- **Option 3 (MVP Review)** — not applicable. The MVP is already shipped and unaffected; this isn't a scope *reduction*, it's a scoped-down pull-forward of one Phase-2 idea.

**Rationale:** The feature is small and self-contained — one new backend function, one new UI button, zero changes to shipped code paths, zero schema changes. Direct adjustment keeps the completed epics' status honest (`done` stays `done`) while giving this new work its own trackable home.

- **Effort:** Low–Medium (one Edge Function, one UI addition, reuses existing dialog/creation flow)
- **Risk:** Low, with one specific watch-item — the Edge Function auth check above. Without it, risk becomes Medium (cost-abuse exposure).

## 4. Detailed Change Proposals

### PRD (`prd.md`) — addendum under "Out of Scope — Phase 2"

```
OLD:
- AI agents per track

NEW:
- AI agents per track (full roadmap/coaching system)
  — NOTE: a narrow slice of this — a single AI-suggested starter task per
  trainee track, surfaced via a "Generate Plan" button on the Mentor
  Dashboard — was pulled into scope on 2026-07-06 as Epic 6. The full
  per-track agent/roadmap vision remains deferred.
```

### Architecture (`architecture.md`) — addendum under "Technical Constraints & Dependencies"

```
NEW bullet:
- Epic 6 introduces a Supabase Edge Function (Deno runtime) as a new
  architectural pattern — still within the Supabase BaaS boundary, not a
  separate hosted server. It calls the Claude API server-side using an
  ANTHROPIC_API_KEY stored as a Supabase secret, and must verify the
  caller's role (mentor/admin) from their JWT before calling the API.
```

### Security Plan (`docs/security-plan.md`) — addendum to Section 7 (Secrets Management)

```
NEW row:
| ANTHROPIC_API_KEY | Supabase Edge Function secret | No | Never in frontend;
set via `supabase secrets set`. Edge Function must check caller role before
calling the API to prevent unauthenticated cost abuse. |
```

### New Epic & Stories (`epics-story.md` — appended as Epic 6)

**Epic 6: AI-Assisted Task Planning**
Goal: Give mentors a fast way to generate a track-relevant starter task via AI, staying inside the existing task-creation flow, with the mentor always in control of the final content before it's created.

---

**Story 6.1: Supabase Edge Function — Generate Task Plan**

As a **developer (Hala)**,
I want a Supabase Edge Function that calls the Claude API server-side to generate a suggested task for a given track,
So that the Anthropic API key never reaches the frontend bundle and the endpoint can't be abused for free API usage.

Acceptance Criteria:

**Given** a POST request to the `generate-task-plan` Edge Function with `{ track }`
**When** the request includes a valid Supabase auth JWT for a user with role `mentor` or `admin`
**Then** the function calls the Claude API with a track-specific prompt and returns `{ title: string, description: string }`

**Given** the caller's JWT role is `trainee`, or the request has no valid JWT
**When** the function is invoked
**Then** it returns 403 Forbidden — the function checks role itself, not just relying on the anon key

**Given** `ANTHROPIC_API_KEY` is missing or the Claude API call fails
**When** the function runs
**Then** it returns a clear error response the frontend can show as a toast, not a crash

**Given** the codebase is inspected
**When** searching for the Anthropic key
**Then** it appears only in Supabase secrets configuration, never in `src/`

---

**Story 6.2: Mentor — Generate Plan Button & Editable Prefill**

As a **Mentor**,
I want to click "Generate Plan" for a selected trainee and get an editable, pre-filled task suggestion based on their track,
So that I can create relevant tasks faster without losing control over the final content.

Acceptance Criteria:

**Given** I am viewing a trainee's detail panel on my Mentor Dashboard
**When** I click "✨ Generate Plan"
**Then** the app calls the `generate-task-plan` Edge Function with that trainee's track, and the button shows a loading state

**Given** the Edge Function returns a suggestion
**When** it resolves
**Then** the existing New Task dialog opens with Title and Description pre-filled, both fully editable

**Given** the Edge Function call fails
**When** the error returns
**Then** a toast shows a specific error message, and I can still open the New Task dialog manually — no dead end

**Given** I edit the pre-filled fields and click "Create Task"
**When** the task is submitted
**Then** it goes through the exact same creation path as Story 3.1 (insert into `tasks` + `task_progress`, AutoAnimate entry, success toast) — no new/parallel task-creation code path

---

## 5. Implementation Handoff

**Scope classification: Moderate.**
Reasoning: this adds a new epic/stories (backlog reorganization) and a new infrastructure pattern (Edge Function + secret) that a fundamental-replan (Major) doesn't require, but goes slightly beyond a same-epic tweak a Developer agent would just implement solo (Minor) — it needs the planning artifacts above updated first, which this proposal does.

**Routed to:** Developer agent (via `/bmad-create-story` → `/bmad-dev-story` for Story 6.1, then 6.2) — no Architect/PM escalation needed; the architectural pattern (Edge Function calling a third-party API with a server-side secret) is well-understood and low-risk, not a fundamental pivot.

**Sequencing:** Story 6.1 (Edge Function) before Story 6.2 (UI) — the button has nothing to call until the function exists.

**Success criteria:**
- Mentor can generate, edit, and create a task in under ~10 seconds of AI latency, from the trainee detail view.
- No Anthropic key anywhere in `src/` or the shipped bundle.
- A trainee-role JWT calling the Edge Function directly gets 403, not a successful generation.
