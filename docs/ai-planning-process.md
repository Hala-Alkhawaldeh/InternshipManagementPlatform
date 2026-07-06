# How We Used AI Agents to Plan This Project
**Sitech Internship Management Platform — Planning Process**
*Prepared by: Hala Khawaldeh | May 2026*

---

## Overview

Before writing a single line of code, the project went through a structured AI-assisted planning process using a framework called **BMad (Breakthrough Method of Agile AI-Driven Development)**. This framework uses specialized AI agents — each with a distinct role and personality — to help think through a product from multiple expert perspectives simultaneously.

This document explains what that process looked like, which agents were involved, and what each one contributed to the project.

---

## What Are BMad Agents?

BMad agents are AI personas, each modeled after a specific professional role — a Product Manager, a UX Designer, a System Architect, and so on. Each agent has a distinct personality, expertise, and way of thinking. They don't just answer questions; they challenge assumptions, ask sharp follow-up questions, and disagree with each other when their perspectives differ.

The agents used in this project's planning session:

| Agent | Name | Role | Personality |
|---|---|---|---|
| 📋 | **John** | Product Manager | Asks "why" until the real problem is clear. Focused on user value, not feature lists. |
| 🎨 | **Sally** | UX Designer | Thinks in user stories and scenes. Designs for how people actually feel when using a product. |
| 🏗️ | **Winston** | System Architect | Honest about trade-offs. Chooses boring, proven technology over clever solutions. |
| 💻 | **Amelia** | Senior Software Engineer | Precise and direct. Thinks in code, tests, and commit messages. |
| ⚡ | **Victor** | Innovation Strategist | Thinks 5 years ahead. Asks the strategic question nobody else thought to ask. |

---

## How Party Mode Works

**Party Mode** is a feature of BMad where multiple agents join a roundtable discussion simultaneously. Instead of asking one AI the same question, Party Mode spawns each agent as an independent process — so they genuinely think for themselves and can disagree with each other.

Here's how it worked in our session:

1. The project vision was presented to the roundtable
2. 4 agents were selected based on relevance to the current question
3. Each agent was spawned independently and responded without seeing the others' answers first
4. Their responses were presented together — sometimes aligned, sometimes in direct conflict
5. The user (Hala) reacted, pushed back, or confirmed — and the conversation deepened

This is fundamentally different from asking one AI assistant a question. Because each agent is independent, they produce genuinely different perspectives — one might validate your idea while another challenges the entire framing.

---

## What Each Agent Did in This Project

### 📋 John — Product Manager
**His job:** Challenge scope before a single feature gets built.

When the initial vision was presented (6 features, 7 AI agents, 4 roles, one frontend developer, no backend experience), John immediately pushed back:

> *"That's not a product. That's a wishlist."*

His key contributions:
- **Identified the 3 real pain points** from the full feature list: card duplication in Trello, no mentor visibility, no structured evaluation
- **Defined the MVP scope** — stripped everything down to 4 features that solve the actual pain
- **Asked the question nobody else thought to ask** when shown the Trello board: *"When a trainee finishes all checklist items — what is supposed to happen next?"* This exposed that the current workflow had no defined answer.
- **Challenged the AI agents idea** — asked why a trainee needs an AI coach if they already have a human mentor. What is the mentor failing to provide?

**Outcome:** A focused, buildable MVP instead of an ambitious system that would take a year to ship.

---

### 🎨 Sally — UX Designer
**Her job:** Make the product feel real before it exists.

Sally thought in scenes — she painted what each role's experience would look and feel like, moment by moment. Rather than talking about features, she described what a trainee named Aisha experiences on her first Monday, what a mentor named Layla needs between her morning standup and her first meeting.

Her key contributions:
- **Exposed the Trello replacement challenge** — Trello's drag-and-drop is satisfying. The platform shouldn't try to replicate it feature-for-feature; it should beat it on *context* (Trello doesn't know who the task belongs to or what track they're on).
- **Designed the 3-month arc** — once she learned the program is 3 months, she reframed the entire UX as a narrative: *inciting incident (Day 1) → rising action (Weeks 2-8) → climax (Week 10-11) → resolution (Week 12)*. The platform should breathe with the calendar.
- **Proposed the mentor dashboard flip** — instead of one card per trainee per week (Trello's chaos), she pitched a grid: one row per trainee, one column per week, color-coded by status. One glance = everything.
- **Defined the "Accepted" UX moment** — the green checkmark when a mentor accepts a trainee's work is a *sacred* moment. It should feel like validation, not just a status change.

**Outcome:** A clear UX direction for each role's dashboard, with emotional design as a guiding principle.

---

### 🏗️ Winston — System Architect
**His job:** Be honest about the technology trade-offs, especially given Hala's frontend background.

When the backend question came up — a real challenge since Hala is a frontend developer — Winston didn't sugarcoat it or recommend a generic approach. He assessed the constraint (frontend developer, limited backend experience) and recommended the most pragmatic path.

His key contributions:
- **Recommended Supabase over Firebase** — with a detailed, honest comparison. Firebase feels easier on Day 1 but becomes painful by Week 2 when your data is relational (mentor-trainee-task-evaluation relationships need SQL joins, which Firebase doesn't support natively).
- **Explained Row-Level Security (RLS)** — the system's 4-role permission model needs to be enforced at the database level, not just in the UI. RLS does this inside PostgreSQL — it cannot be bypassed from the frontend. He flagged this as the real learning curve: *"Budget 2-3 days to understand RLS before building features."*
- **Clarified GraphQL** — when Hala asked about GraphQL as a database option, Winston gently clarified: GraphQL is not a database. It's a query language that sits in front of a database. And for this project's scope, it's unnecessary complexity.
- **Sketched the 4-table schema** — profiles, tasks, task_progress, evaluations. Simple, clean, buildable.

**Outcome:** A confirmed technology stack (Vue 3 + TypeScript + Tailwind + Supabase) with a clear understanding of the one technical investment needed before building (RLS).

---

### 💻 Amelia — Senior Software Engineer
**Her job:** Translate architecture into what a developer actually experiences day-to-day.

While Winston explained the trade-offs conceptually, Amelia made it concrete — showing what code actually looks like, how many hours each learning curve takes, and where the first wall will be hit.

Her key contributions:
- **Showed what "using PostgreSQL" actually looks like** for a frontend developer:
  ```typescript
  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('trainee_id', userId)
  ```
  That's TypeScript. Not SQL. The Supabase client abstracts the database into something that feels like frontend code.
- **Gave an honest hour-by-hour learning curve comparison** between Supabase and Firebase — confirming that Firebase's easier Day 1 becomes a harder Week 2 for this specific data model.
- **Confirmed the 4-table schema** is clean and buildable — no hidden complexity or gotchas.

**Outcome:** Confidence that the recommended stack is achievable for a frontend developer, with realistic expectations for the learning curve.

---

### ⚡ Victor — Innovation Strategist
**His job:** Ask the question that reframes everything.

Victor's contribution was the most unexpected. While other agents were focused on the MVP, Victor stepped back and asked a strategic question: *"Who owns the data after the internship ends?"*

His key contributions:
- **Reframed the product's long-term value** — this platform isn't just a task tracker. After 2-3 cohorts, it holds longitudinal behavioral data on technical talent at the exact moment before they enter the job market. That's a talent intelligence system, not an intern tracker.
- **Challenged the data schema design** — design it for what the data will be worth in 5 years, not just what's on the dashboard today. The difference: if you design for "what do I show today," you lock yourself out of "what patterns do I surface in year 3."
- **Advocated for transparent rankings** — the Talent Ranking feature is dangerous if opaque (breeds resentment) but powerful if transparent (becomes a developmental mirror where trainees see exactly what moves them up).

**Outcome:** A Phase 2 roadmap grounded in strategic long-term value, not just feature additions.

---

## What the Trello Board Revealed

A key moment in the planning session was when Hala shared a screenshot of the actual Trello board currently in use.

What the agents found:

- **The 4-stage workflow was already there:** To Do → In Progress → Done → Accepted. "Done" means the trainee finished. "Accepted" means the mentor verified it. The platform should mirror this flow — it's already the mental model the team uses.
- **The card explosion was confirmed:** Multiple cards visible for the same week with different trainee names (leen, Tala, Anas) — exactly the duplication problem identified as the core pain.
- **An unassigned template card was visible** — "Week 1 Part 1 (0/5)" with no trainee name. A sign of the workflow breaking under its own weight.
- **The data model was hiding in the card structure:** The platform needs `Week → Part → Topic → Resource` as a proper hierarchy, not a flat Trello card title.

This one screenshot turned abstract requirements into concrete evidence. It confirmed the MVP scope and directly shaped the task status flow in the platform.

---

## Key Decisions Made Through This Process

| Decision | Who surfaced it | What was decided |
|---|---|---|
| MVP scope | John | 4 features only: user management, tasks, progress flow, evaluation |
| Tech stack | Winston + Amelia | Vue 3 + TypeScript + Tailwind + Supabase |
| Task status flow | Hala (from Trello) | To Do → In Progress → Done → Accepted (dropdown, not drag-and-drop) |
| Evaluation system | Hala | Configurable criteria list, 0–7 scale, auto-calculated average |
| Backend approach | Winston | Supabase (BaaS) — no custom backend needed |
| Permission model | Winston | Row-Level Security at database level |
| UX direction | Sally | Role-aware dashboards; mentor grid view; 3-month narrative arc |
| Long-term vision | Victor | Talent intelligence system built from compounding cohort data |

---

## Why This Approach

Most projects start with a developer opening a code editor. This project started with a structured conversation — before any technical decisions were made — that challenged every assumption, validated the real pain points, and produced a clear scope.

The result: a documented plan, a confirmed tech stack, and an MVP scope that is small enough to ship and meaningful enough to matter — all before writing a single line of code.

---

*For questions about the planning process or the project, contact Hala Khawaldeh — hala.khawaldeh@sitech.me*
