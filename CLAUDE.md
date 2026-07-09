# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Internship Management & Mentorship Platform — Project Context

## What This Is
An internal SaaS-style platform for Sitech's annual internship program. Built by Hala (frontend developer at Sitech) to replace the current Trello-based workflow. This solves a real operational problem she lives every day.

## Owner
- **Name:** Hala Khawaldeh
- **Email:** hala.khawaldeh@sitech.me
- **Role:** Frontend Developer
- **Stack expertise:** Vue 3, TypeScript, Tailwind CSS, HTML, SCSS, Git/GitHub
- **Backend knowledge:** Limited — use Supabase (BaaS) to minimize backend complexity
- **Always:** Explain backend concepts clearly. Suggest pragmatic approaches she can actually ship.

---

## Tech Stack (Decided)
| Layer | Technology |
|---|---|
| Frontend | Vue 3 + TypeScript |
| Styling | Tailwind CSS |
| Backend / DB | Supabase (PostgreSQL + Row-Level Security) |
| Auth | Supabase Auth |
| Deployment | TBD |

---

## Development Commands
```bash
npm run dev          # Vite dev server → http://localhost:5173
npm run build         # vue-tsc type-check, then production build to dist/
npm run type-check     # vue-tsc --build --force (no emit, checks whole project)
npm run lint            # eslint . --fix
npm run format          # prettier --write src/
npm run preview          # serve the production build locally
```
- No test suite is configured yet (no vitest/jest/cypress/playwright in `package.json`) — there is no "run a single test" command to give until one is added.
- Env setup: copy `.env.example` → `.env.local` and fill in `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from the Supabase project dashboard. `.env.local` is gitignored.

---

## Code Architecture

**Path alias:** `@` → `src/` (defined in both `vite.config.ts` and `tsconfig.app.json`).

**Layered data flow** — follow this for any new feature:
`services/*.service.ts` (thin Supabase query wrappers, return raw `{data, error}`) → `composables/use*.ts` (business logic, call services through `useApi().execute()`) → pages/components.

- `composables/useApi.ts` is the single error-handling chokepoint: `execute()` wraps a Supabase call, maps Postgres/Supabase error codes to human-readable messages (the `knownCodes` map there — add new codes as they're encountered), shows a toast unless `showErrorToast: false` is passed, and auto-redirects to `/login` on a 401. New composables should call services through `execute()`, not call `supabase` or a `*.service.ts` straight from a component.
- Auth state lives in the Pinia store `stores/auth.store.ts` (session/user/profile + `isAdmin`/`isMentor`/`isTrainee`/`isTeamLead` computed booleans). `composables/useAuth.ts` orchestrates login/logout/session-restore and writes into that store — components should use `useAuth()` / `useAuthStore()`, not `services/auth.service.ts` directly.
- `router/index.ts` gates access with one `beforeEach` guard driven by route `meta: { requiresAuth, roles }`: unauthenticated → `/login`; authenticated-but-wrong-role → own dashboard via `roleDashboard()`.
- `enums/roles.enum.ts`, `enums/status.enum.ts`, `enums/tracks.enum.ts` are the source of truth for role names and task-status transitions (`TraineeTransitions` is forward-only; `MentorTransitions` allows any status), plus status labels/colors — read from these instead of hardcoding role/status strings.
- `types/supabase.ts` is generated from the live Supabase schema (Supabase CLI codegen) — don't hand-edit; regenerate after any migration. `types/app.types.ts` holds the hand-written domain types (`Profile`, `Task`, `Evaluation`, …) layered on top of it.
- Pages are grouped by role under `pages/{admin,mentor,trainee,evaluations}/`, rendered inside `layouts/AppLayout.vue` (+ `AppSidebar.vue`); `LoginPage.vue` and `NotFoundPage.vue` sit outside that authenticated shell.
- UI runtime is wired in `main.ts`: PrimeVue (Aura theme, dark mode via `.dark` class, `ToastService` + `ConfirmationService`) + Tailwind + `@vueuse/motion` + `@formkit/auto-animate`. See the note under "UI Component Strategy" below — PrimeVue replaced the originally-planned shadcn-vue.

---

## Skills & Agents Installed

### How Skills Work
- **Auto-trigger:** Design and frontend skills activate automatically when you describe UI work
- **Manual invoke:** Type `/skill-name` to force a specific skill
- **BMad workflows:** Always invoked manually with `/bmad-skill-name`

### Skills (invoke with `/skill-name`)

| Skill | Command | Triggers | Use When |
|---|---|---|---|
| **Frontend Design** | `/frontend-design` | Auto on UI requests | Building any screen, component, or layout — forces bold aesthetic choices |
| **Senior Frontend** | `/senior-frontend` | Auto on frontend tasks | Performance optimization, bundle analysis, best practices review — NOTE: React-focused, apply concepts to Vue |
| **Security Review** | `/security-review` | Manual | After writing RLS policies, before deployment, after any form input added |
| **BMad Quick Dev** | `/bmad-quick-dev` | Manual | Implementing a story from epics.md |
| **BMad Code Review** | `/bmad-code-review` | Manual | Reviewing code quality after implementing a story |
| **BMad Architecture** | `/bmad-create-architecture` | Manual | Continuing the architecture document |
| **BMad Party Mode** | `/bmad-party-mode` | Manual | Multi-agent roundtable discussion on any topic |

### Agents (persistent, memory-capable)

| Agent | Location | Use When |
|---|---|---|
| **Security Auditor** | `.claude/agents/security-auditor.md` | Run after RLS (Story 2.4), before deployment, before leadership demo |
| **TypeScript Pro** | `.claude/agents/typescript-pro.md` | Auto-triggers on complex TypeScript — composables, generics, Supabase types, strict mode |

### When to Use `/frontend-design`
```
✅ Building any new page or screen (login, dashboard, evaluation form)
✅ Creating any reusable component (task card, progress ring, status badge)
✅ Styling an existing component that looks plain or boring
✅ Designing empty states, loading states, or error screens
✅ Any time you want the UI to feel intentional — not AI-generated

How it works:
  1. Commits to a bold aesthetic direction BEFORE writing code
  2. Chooses distinctive typography (never Inter/Roboto/Arial)
  3. Uses motion, depth, and layout to make it memorable
  4. Writes production-ready Vue 3 + Tailwind code
```

### When to Use `/senior-frontend`
```
✅ After building a component — review for performance or quality issues
✅ When a page feels slow or re-renders too much
✅ Before marking any story as Done — final code quality pass
✅ Analyze Vite bundle size: python .claude/skills/senior-frontend/scripts/bundle_analyzer.py .
✅ When unsure about the best TypeScript pattern for a composable or store

Configured for Vue 3 + TypeScript + Tailwind — React/Next.js files removed.

Key scripts:
  python .claude/skills/senior-frontend/scripts/bundle_analyzer.py .
  python .claude/skills/senior-frontend/scripts/component_generator.py .
```

### When to Run Security Auditor
```
✅ After completing Story 2.4 (RLS policies)
✅ After any form that takes user input
✅ Before first deployment
✅ Before demo to leadership / HR
```

### BMad Planning Skills (Manual Only)
```
/bmad-create-prd          ← resume PRD workflow
/bmad-create-architecture ← continue architecture (in progress)
/bmad-create-epics-and-stories ← update stories
/bmad-create-story        ← create a single story file
/bmad-dev-story           ← implement one story end-to-end
/bmad-sprint-planning     ← plan a sprint
/bmad-retrospective       ← post-sprint review
```

---

## MCP Integrations (Configured)
All MCPs are configured in `.mcp.json` at the project root (**not** `.claude/settings.json` — that was a real bug: all three sat unused there for the whole project history because Claude Code only reads project-scoped MCP servers from `.mcp.json`, corrected 2026-07-08). After any change to `.mcp.json`, restart the Claude Code session, then run `/mcp` to confirm each server shows `✓ Connected` — don't assume "configured" means "connected."

### Supabase MCP
- Package: `@supabase/mcp-server-supabase`
- Token: set in `.claude/settings.local.json` (gitignored) as `SUPABASE_ACCESS_TOKEN`
- Use for: creating tables, writing RLS policies, querying data, managing the database
- Token source: supabase.com/dashboard/account/tokens

### Lighthouse MCP
- Package: `lighthouse-mcp`
- Use for: performance audits, accessibility scores, best practices checks on running app
- Run against: `localhost:5173` (Vue dev server default)

### Playwright MCP
- Package: `@playwright/mcp`
- Use for: driving a real browser against the running dev server — clicking through login/task-status flows, verifying mobile responsiveness (see `feedback_check_mobile_view` memory), screenshotting UI states
- Swapped in 2026-07-08 to replace the filesystem MCP (removed — it was redundant with native Read/Write/Edit/Glob/Grep)
- Run against: `localhost:5173` (Vue dev server default)

---

## BMad Workflow Status
Using BMad methodology to plan and build the platform.

### PRD Creation — IN PROGRESS
- File: `_bmad-output/planning-artifacts/prd.md`
- Steps completed: step-01-init, (step-02 classification done in Party Mode)
- Current step: step-02b (Vision) — ready to continue to Executive Summary
- Skill: `bmad-create-prd` → steps-c/

### After PRD: Next BMad Steps
1. `bmad-create-architecture` — database schema, API design, component structure
2. `bmad-create-epics-and-stories` — break into buildable user stories
3. `bmad-quick-dev` — implement story by story

---

## Internship Program Context
- **Company:** Sitech
- **Duration:** 3 months (12 weeks) per cohort
- **Cohort-based:** fixed intake, not rolling
- **Announcement:** after Eid break (2026)

### Technical Tracks (4)
1. Frontend Development (Vue.js / JS / TS / HTML / CSS / SCSS / Git)
2. Backend Development
3. Quality Assurance (QA)
4. DevOps

---

## Roles
| Role | Permissions |
|---|---|
| **Admin / HR** | Add mentors, add trainees, create program cycles |
| **Team Lead** | Assign mentors to trainees, view all progress |
| **Mentor** | Create tasks, change task status (any), do final evaluation |
| **Trainee** | View tasks, move status to Done |

---

## MVP Scope (v1 — Keep It Simple)
These 4 features only. Everything else is Phase 2.

### 1. User Management
- Admin page to add mentors
- Admin page to add trainees
- Login with role-based access (Admin / Mentor / Trainee)

### 2. Task Creation
- Mentor or Admin creates tasks and assigns to trainee(s)

### 3. Progress Flow
- Task statuses: **To Do → In Progress → Done → Accepted**
- Trainee can move: To Do → In Progress → Done
- Mentor can set any status via dropdown (can bump back to In Progress)
- No drag-and-drop — simple dropdown selector like Trello columns

### 4. End-of-Program Evaluation
- Admin/Mentor configures a list of evaluation criteria
- Mentor scores each criterion on a scale of **0–7**
- System calculates and displays the average score per trainee
- Done once at end of 3-month program

---

## Phase 2 Features (NOT in MVP — do not build yet)
- Learning Roadmap System (Week → Part → Topic → Resource)
- Mentor Assignment System (workload balancing UI)
- Talent Ranking System
- Analytics Dashboard
- AI Agents per track (TypeScript Coach, Performance Agent, Security Advisor, etc.)
- Slack / email notifications
- GitHub submission integration

---

## Database Schema (Rough — 4 tables for MVP)
```
profiles        — user_id, role, name, track, mentor_id
tasks           — id, title, description, created_by, assigned_to, program_id
task_progress   — task_id, trainee_id, status (todo/in_progress/done/accepted), updated_at
evaluations     — trainee_id, mentor_id, criteria (jsonb), scores (jsonb), average, created_at
```
Row-Level Security enforced at DB level — not just UI checks.

---

## Key Architectural Decisions
- **Why Supabase over Firebase:** data is relational (mentor-trainee-task-evaluation). Firebase's NoSQL model causes pain with joins.
- **Why not raw PostgreSQL backend:** Hala is a frontend developer. Supabase's JS client is TypeScript-native and feels like frontend code.
- **RLS is critical:** spend 2-3 days understanding Row-Level Security before building features. It's the real learning curve, not SQL.
- **No GraphQL for now:** unnecessary complexity. Supabase REST client is sufficient. Supabase has a built-in GraphQL endpoint if needed later.

---

## Current Trello Workflow (What We're Replacing)
- Board: "FE Roadmap" — 4 columns: To Do / In Progress / Done / Accepted
- Cards duplicated per trainee per week (e.g., "Week 1 Part 1 — Leen", "Week 1 Part 1 — Tala")
- Pain: 10 trainees × 6 weeks × 2 parts = 120+ cards, unmanageable
- Labels used for skills: html, css, git, scss, JSON, javascript
- "Done" = trainee self-reports; "Accepted" = mentor verifies

---

## Design Principles
- Keep it simple — ship the MVP before adding complexity
- Role-aware UI — each role sees exactly what they need, nothing more
- Mobile-friendly — mentors check on phone between meetings
- Structure is a suggestion — adapt to what makes sense, not rigid patterns
- **Smooth, cool, NOT boring** — animations, micro-interactions, polished UI throughout

## UI Design Direction
**Vibe:** Modern SaaS — think Linear.app, Vercel dashboard, Notion. Clean, fast, satisfying to use.
**NOT:** corporate HR software. This should feel like a product people enjoy opening.

### Animation & Motion Libraries
- **`@vueuse/motion`** — primary animation library for Vue 3. Page transitions, element entrances, hover effects
- **`AutoAnimate`** (`@formkit/auto-animate`) — zero-config list animations. When a task moves from To Do → Done, it animates automatically. One line of code.
- **Vue `<Transition>` / `<TransitionGroup>`** — built-in, use for route transitions and list re-ordering

### UI Component Strategy
- **`primevue`** (Aura theme) — base component library (buttons, dropdowns, modals, toasts, confirmations). Superseded the originally-planned shadcn-vue; registered in `main.ts` with `ToastService` and `ConfirmationService`. Dark mode toggles via a `.dark` class on the root element.
- **`lucide-vue-next`** — icon library. Clean, consistent, 1000+ icons.
- Custom Tailwind components for anything domain-specific (task cards, progress rings, evaluation grids)

### Specific Animations to Build
- Page/route transitions — smooth fade+slide between views
- Task status change — card animates when status changes (color shift + subtle bounce)
- Progress ring on trainee dashboard — animated fill as tasks are completed
- Dashboard stats — numbers count up on first load
- Sidebar — smooth expand/collapse
- Empty states — subtle illustration + entrance animation (not a blank void)
- Notifications/toasts — slide in from top-right

### Color & Visual Approach
- Dark sidebar + light main content area (modern SaaS standard)
- Status colors: To Do (gray) → In Progress (blue) → Done (amber) → Accepted (green)
- Track color-coding — each of the 7 tracks gets a distinct accent color
- Tailwind CSS variables for theming consistency

### Tools Reference
All of the following are already installed as dependencies — no setup needed:
```bash
@vueuse/motion   @formkit/auto-animate   lucide-vue-next   primevue   @primevue/themes   primeicons
```
