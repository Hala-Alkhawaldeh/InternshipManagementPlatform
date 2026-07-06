---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-functional', 'step-04-nonfunctional', 'step-12-complete']
inputDocuments: ['CLAUDE.md', 'docs/project-brief.md', 'docs/ai-planning-process.md']
workflowType: 'prd'
classification:
  projectType: internal-enterprise-web-app
  domain: edtech-hrtech
  complexity: medium-high
  projectContext: greenfield
---

# Product Requirements Document — Internship Management Platform

**Author:** Hala Khawaldeh
**Company:** Sitech
**Date:** 2026-05-17
**Status:** Complete (MVP Scope)

---

## Executive Summary

Sitech runs an annual 3-month internship program across 7 technical tracks. The current workflow — managed entirely through Trello — has broken down under its own weight: 120+ cards per cohort (one per trainee per week), no structured evaluation system, and no unified visibility for mentors or HR.

This platform replaces Trello with a purpose-built, role-aware web application. It is designed by someone inside the process, for the people who live it every day.

**MVP delivers four things:** role-based user management, task creation and assignment, a structured progress flow (To Do → In Progress → Done → Accepted), and a configurable end-of-program evaluation system with 0–7 scoring and auto-calculated averages.

---

## Problem Statement

### Current Pain Points (Validated from Trello Board Analysis)

1. **Card explosion:** Every week/part gets a separate Trello card per trainee. With 10+ trainees across 6 weeks × 2 parts = 120+ cards per cycle. Unmanageable.
2. **No mentor visibility:** Mentors must open individual cards to check progress. No unified view of "which trainee needs attention right now."
3. **No structured evaluation:** End-of-program assessments are informal, inconsistent, and not data-backed. HR cannot compare trainees fairly.
4. **No role separation:** Trello treats everyone the same. Trainees see everything. Mentors have no dedicated workflow.

### Current Workflow (Being Replaced)
- Board: "FE Roadmap" — 4 columns: To Do / In Progress / Done / Accepted
- "Done" = trainee self-reports completion
- "Accepted" = mentor verifies (moves card manually)
- Cards named manually: "Week 1 Part 1 — Leen", "Week 1 Part 1 — Tala", etc.

---

## Product Vision

A simple, role-aware platform that gives every person in the internship program — admin, mentor, trainee — exactly the view and tools they need, nothing more.

**Not** a generic project management tool with an internship skin.
**Not** corporate HR software that feels like a chore to open.

A product built by someone who has been on both sides of the process, for the real workflows that Sitech's internship program actually runs on.

---

## Scope

### In Scope — MVP (v1)
1. User management (add mentors, add trainees, login with role)
2. Task creation and assignment
3. Task progress flow with status dropdown
4. End-of-program evaluation with configurable criteria and 0–7 scoring

### Out of Scope — Phase 2
- Learning Roadmap System (Week → Part → Topic → Resource)
- Mentor workload assignment UI
- Talent ranking system
- Analytics dashboard
- AI agents per track
- Slack / email notifications
- GitHub submission integration

---

## Users & Roles

| Role | Who They Are | Primary Need |
|---|---|---|
| **Admin / HR** | Program coordinators | Add users, configure program, view all results |
| **Mentor** | Senior developers assigned to trainees | Create tasks, track progress, submit evaluations |
| **Trainee** | Internship participants | See my tasks, update progress, receive feedback |

*(Team Lead role deferred to Phase 2)*

---

## Internship Program Context

- **Duration:** 3 months (12 weeks) per cohort
- **Structure:** Cohort-based (fixed intake), not rolling
- **Tracks (7):**
  1. Frontend Development (Vue.js / JS / TS / HTML / CSS / SCSS / Git)
  2. DevOps Basics
  3. Python
  4. Quality Assurance (QA)
  5. TypeScript (Advanced Topics)
  6. Performance Engineering
  7. Security

---

## Functional Requirements

### Authentication & User Management
- FR1: Users log in with email and password via Supabase Auth
- FR2: System detects and enforces user role (Admin, Mentor, Trainee) on login and redirects to role dashboard
- FR3: Admin can add a new mentor (name, email, track, temporary password)
- FR4: Admin can add a new trainee (name, email, track, assigned mentor, temporary password)
- FR5: Admin can reassign a trainee's mentor

### Task Management
- FR6: Mentor or Admin can create a task (title, description) and assign it to a trainee
- FR7: Tasks have 4 statuses: To Do, In Progress, Done, Accepted
- FR8: Trainee can advance their task status forward only (To Do → In Progress → Done)
- FR9: Mentor can set any task to any status via dropdown (full control including bump-back)
- FR10: Trainee dashboard shows only the logged-in trainee's own tasks
- FR11: Mentor dashboard shows all assigned trainees and their task statuses at a glance

### Evaluation
- FR12: Admin/Mentor can create a configurable evaluation criteria list
- FR13: Mentor can score a trainee on each criterion on a scale of 0–7
- FR14: System automatically calculates and displays the average score per trainee
- FR15: Each user can only access data authorized for their role (enforced at DB level)

---

## Non-Functional Requirements

- NFR1: **Security** — Role permissions enforced via Supabase Row-Level Security at database level, not UI-only
- NFR2: **Responsiveness** — All screens usable on mobile (mentors check between meetings on phone)
- NFR3: **Performance** — Lighthouse score ≥ 85 on all main pages
- NFR4: **Accessibility** — Lighthouse a11y score ≥ 80; keyboard navigable, ARIA labels on interactive elements
- NFR5: **Type safety** — TypeScript strict mode; Supabase types auto-generated from schema
- NFR6: **UX quality** — Smooth animations and micro-interactions throughout; platform must feel modern and engaging, not corporate

---

## UX & Design Requirements

- **Vibe:** Modern SaaS — Linear.app, Vercel dashboard. Clean, fast, satisfying.
- **Layout:** Dark sidebar + light main content area
- **Status colors:** To Do (gray), In Progress (blue), Done (amber), Accepted (green)
- **Track colors:** Each of 7 tracks has a distinct accent color
- **Animations:** Page transitions (fade+slide), task status change (color shift + bounce), progress ring (animated fill), dashboard stats (count-up), empty states (entrance animation), toasts (slide in from top-right)

---

## Technical Constraints

- Developer is a frontend specialist — backend must use BaaS (Supabase), no custom backend server
- Stack: Vue 3 + TypeScript + Vite + Tailwind CSS + Supabase
- UI: shadcn-vue + lucide-vue-next
- Animation: @vueuse/motion + @formkit/auto-animate
- MCP: Supabase MCP + Lighthouse MCP active in development

---

## Success Criteria

The MVP is successful when:
1. Mentors can manage trainee tasks without opening Trello
2. Trainees know exactly what to do without asking their mentor
3. HR can view every trainee's evaluation score at the end of a cohort
4. The platform is used for Sitech's next internship cycle
