---
stepsCompleted: ['step-01-init', 'step-02-context']
inputDocuments: ['_bmad-output/planning-artifacts/prd.md', 'CLAUDE.md', '_bmad-output/planning-artifacts/epics.md', 'docs/project-brief.md']
workflowType: 'architecture'
project_name: 'Internship Management Platform'
user_name: 'hala'
date: '2026-05-17'
lastStep: 'step-01-init'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
15 FRs organized across 3 domains:
- **Auth & User Management (FR1–5):** Email/password login via Supabase Auth, role detection on login with redirect to role-specific dashboard, Admin CRUD for mentors and trainees.
- **Task Management (FR6–11):** Mentor/Admin creates and assigns tasks; 4-status workflow (To Do → In Progress → Done → Accepted); trainee can only advance forward; mentor has full status control; role-filtered dashboards (trainee sees only their tasks; mentor sees all assigned trainees at a glance).
- **Evaluation (FR12–15):** Configurable criteria list; 0–7 scale scoring per criterion; auto-calculated average per trainee; access enforced at DB level, not UI.

**Non-Functional Requirements:**
- NFR1 Security: RLS enforced at DB level for all data access — not just UI guards
- NFR2 Responsiveness: All screens usable on mobile (mentor checks phone between meetings)
- NFR3 Performance: Lighthouse score ≥ 85 on all main pages
- NFR4 Accessibility: Lighthouse a11y ≥ 80; keyboard-navigable; ARIA labels on interactive elements
- NFR5 Type Safety: TypeScript strict mode; Supabase types auto-generated from schema
- NFR6 UX Quality: Smooth animations and micro-interactions throughout; modern SaaS feel

**Scale & Complexity:**
- Primary domain: Full-stack web app (BaaS backend via Supabase)
- Complexity level: Medium — small user count but high correctness requirements (RLS, type safety)
- Expected concurrent users: ~20–30 (10–15 trainees, 3–5 mentors, 1–2 admins per cohort)
- No real-time requirements for MVP — all interactions are pull-based

### Technical Constraints & Dependencies

- Developer is a Vue 3 / TypeScript specialist — no custom backend server; Supabase BaaS handles auth, database, RLS, and storage
- Stack locked: Vue 3 + TypeScript + Vite + Tailwind CSS + Supabase
- UI layer: shadcn-vue + lucide-vue-next
- Animation: @vueuse/motion + @formkit/auto-animate
- Types are auto-generated from Supabase schema — `supabase gen types typescript` is the source of truth for all data types across the stack
- MCP tooling active in development: Supabase MCP (DB management) + Lighthouse MCP (perf audits)

### Cross-Cutting Concerns Identified

1. **Row-Level Security (RLS)** — Every table query is filtered by authenticated user role at the database level. Must be designed before any feature work begins. Affects all 4 tables.
2. **Role-Based Routing** — Client-side route guards redirect users to their role dashboard on login. Combined with RLS, this creates defense-in-depth.
3. **Global Auth & Role State** — Supabase session + user role must be reactive and globally accessible. Single Pinia store manages this; all composables derive from it.
4. **TypeScript Type Pipeline** — Supabase schema → auto-generated types → composables → components. Strict mode enforced throughout. No `any` without justification.
5. **Task Status State Machine** — Business rules (who can transition to which status) must be enforced both in the UI (disable/enable options) and validated via RLS on write.
6. **Animation Design System** — Motion is a first-class feature, not an afterthought. @vueuse/motion directives and AutoAnimate applied consistently at component level.
7. **Mobile Responsiveness** — Tailwind responsive breakpoints required on all screens. Sidebar collapses on mobile. Mentor dashboard grid adapts.
