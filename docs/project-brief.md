# Internship Management & Mentorship Platform
**Project Brief — Sitech Internal Tool**
*Prepared by: Hala Khawaldeh | May 2026*

---

## The Problem

Every year Sitech runs a 3-month internship program across multiple technical tracks. Right now the entire program is managed through Trello — a general-purpose task board that was never designed for this workflow.

The result:
- A separate Trello card is created manually for every trainee, for every week, for every part — resulting in **120+ cards per cycle** that become impossible to track
- Mentors have no clear view of which trainees need attention without scanning dozens of cards
- There is **no structured evaluation system** — end-of-program assessments happen informally with no standard criteria or scoring
- HR has no consolidated view of trainee progress or performance across the cohort

This is a real operational pain that the team experiences every cycle.

---

## The Idea

Build a purpose-built internal platform that replaces Trello with a system designed specifically for Sitech's internship workflow.

The key insight: we don't need a generic project management tool. We need a system that understands **who** is in the program, **what track** they're on, **who their mentor is**, and **how they're progressing** — all in one place.

---

## From Idea to Plan: How We Got Here

The project went through a structured discovery process before a single line of code was written:

**1. Problem Validation**
The idea emerged from direct experience with the current workflow. The pain points — card duplication, no evaluation system, no mentor visibility — were confirmed by reviewing the actual Trello board and how it's used today.

**2. Scope Definition**
Using a structured product planning methodology (BMad), the project was broken down into roles, features, and user journeys. Each feature was challenged: *does this solve a real pain, or is it just nice to have?* The result is a focused MVP scope.

**3. Technical Planning**
The technology stack was chosen based on the team's existing strengths (frontend development) and the need to move fast without a backend engineering team. The selected stack is modern, production-grade, and maintainable.

**4. Documentation**
All decisions — scope, architecture, design principles — are documented in a living project document that will evolve as the system grows.

---

## What We're Building (MVP)

A web application with four core features:

### 1. User Management
Admin can add mentors and trainees to the system. Each user logs in with a role — Admin, Mentor, or Trainee — and sees only what's relevant to them.

### 2. Task Management
Mentors create tasks and assign them to trainees. Tasks have a clear lifecycle:

```
To Do → In Progress → Done → Accepted
```

Trainees move their tasks forward. Mentors review and accept — or push back with a status change. Simple, visible, no card duplication.

### 3. Progress Tracking
Every mentor sees a clear view of their trainees' progress. No more scanning 120 cards — one screen shows who is on track, who is behind, and who needs attention.

### 4. End-of-Program Evaluation
At the end of the 3-month program, mentors evaluate each trainee using a configurable criteria list. Each criterion is scored on a **0–7 scale**. The system calculates the average automatically, giving HR a fair, consistent, and data-backed assessment of every trainee.

---

## Design Direction

The platform is designed to feel like a modern SaaS product — think Linear, Vercel's dashboard, or Notion. Clean, fast, and satisfying to use. **Not** corporate HR software.

Key design decisions:
- **Smooth animations throughout** — task status changes animate, dashboards load with motion, page transitions feel fluid
- **Role-aware UI** — each role sees a completely tailored experience. A trainee's dashboard looks nothing like a mentor's.
- **Status color language** — To Do (gray) → In Progress (blue) → Done (amber) → Accepted (green). Consistent across every screen.
- **Track color-coding** — each of the 7 technical tracks has its own accent color for instant visual recognition
- **Dark sidebar + light content** — modern SaaS layout that feels familiar and professional
- **Animated progress** — a trainee's progress ring fills as tasks are completed. Numbers count up. Empty states have personality — not blank voids.

---

## Technical Approach

| Area | Technology | Why |
|---|---|---|
| Frontend | Vue 3 + TypeScript | Team's existing expertise |
| UI Styling | Tailwind CSS + shadcn-vue | Fast, consistent, beautiful component system |
| Animations | @vueuse/motion + AutoAnimate | Smooth transitions and micro-interactions with minimal code |
| Icons | Lucide Icons | Clean, consistent, 1000+ icons |
| Backend & Database | Supabase (PostgreSQL) | Production-grade database with built-in auth and role-based security — no separate backend team needed |
| Quality Auditing | Lighthouse MCP | Automated performance and accessibility checks built into the development workflow |

The system is built with **role-based security at the database level** — not just the UI. A trainee cannot see another trainee's data. A mentor cannot see trainees outside their assignment. This is enforced by the database itself, not just the interface.

---

## What Comes After MVP

Once the core system is live and in use, the platform can grow to include:

- **Learning Roadmap System** — structured weekly learning paths per track (replacing the current Trello card descriptions)
- **Mentor Assignment Interface** — team leads can assign and rebalance mentors and trainees
- **Talent Ranking** — aggregate performance scores to help HR identify top performers
- **Analytics Dashboard** — cohort-level insights: completion rates, track performance, mentor effectiveness
- **AI Assistants per Track** — embedded AI coaches for each technical track (TypeScript, Performance, Security, etc.)

These are designed but deliberately deferred. The MVP ships first, gets used, and the roadmap grows from real feedback.

---

## Timeline Approach

The project follows a **plan-first, build-second** approach:

| Phase | Activity | Status |
|---|---|---|
| Discovery | Problem validation, scope definition, user journeys | ✅ Complete |
| Planning | Product Requirements Document (PRD) | 🔄 In Progress |
| Architecture | Database schema, component structure, API design | Upcoming |
| Development | Feature-by-feature implementation with testing | Upcoming |
| Launch | Internal deployment at Sitech for next internship cycle | Target: before next cohort |

---

## Why This Matters

This platform solves a problem Sitech has every year. It:

- **Saves mentor time** — less manual card management, more actual mentoring
- **Gives HR visibility** — consolidated progress and evaluation data in one place
- **Creates a fair evaluation standard** — consistent criteria and scoring across all trainees and tracks
- **Scales with the program** — as the internship grows to more trainees and tracks, the system grows with it

It is built by someone who has been inside the process — which means every feature exists because it solves a real pain, not because it sounds good on paper.

---

*For questions or to discuss the project further, contact Hala Khawaldeh — hala.khawaldeh@sitech.me*
