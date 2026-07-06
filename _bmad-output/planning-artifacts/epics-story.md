---
stepsCompleted: ['step-01-validate-prerequisites']
inputDocuments: ['CLAUDE.md', 'docs/project-brief.md', 'docs/ai-planning-process.md']
---

# Internship Management Platform - Epic Breakdown

## Overview

Complete epic and story breakdown for the Sitech Internship Management & Mentorship Platform MVP. Requirements sourced from CLAUDE.md, Party Mode discovery sessions, and Trello workflow analysis.

---

## Requirements Inventory

### Functional Requirements

FR1: Users can log in with email and password via Supabase Auth
FR2: System detects and enforces user role (Admin, Mentor, Trainee) on login
FR3: Admin can add a new mentor (name, email, track assignment)
FR4: Admin can add a new trainee (name, email, track, assigned mentor)
FR5: Admin can reassign a trainee's mentor
FR6: Mentor or Admin can create a task (title, description) and assign it to a trainee
FR7: Tasks have 4 statuses: To Do, In Progress, Done, Accepted
FR8: Trainee can advance their own task status forward (To Do → In Progress → Done)
FR9: Mentor can set any task to any status via dropdown (including bumping back to In Progress)
FR10: Trainee dashboard shows only the logged-in trainee's own tasks
FR11: Mentor dashboard shows all assigned trainees and their task statuses at a glance
FR12: Admin/Mentor can create a configurable evaluation criteria list for the program
FR13: Mentor can score a trainee on each criterion on a scale of 0–7
FR14: System calculates and displays the average evaluation score per trainee automatically
FR15: Each user can only read/write data they are authorized for (role-based data isolation)

### Non-Functional Requirements

NFR1: Security — Role permissions enforced at Supabase RLS (database) level, not UI-only
NFR2: Responsiveness — All screens work on mobile (mentors check between meetings)
NFR3: Performance — Lighthouse performance score ≥ 85 on all main pages
NFR4: Accessibility — Lighthouse a11y score ≥ 80; keyboard navigable, proper ARIA labels
NFR5: Type Safety — TypeScript strict mode; all Supabase types auto-generated from schema
NFR6: UX Quality — Smooth animations and micro-interactions throughout; never feels corporate or static

### Additional Requirements (Architecture & Tech)

- Stack: Vue 3 + TypeScript + Vite + Tailwind CSS + Supabase
- UI components: shadcn-vue (buttons, dropdowns, modals, badges, cards)
- Icons: lucide-vue-next
- Animation: @vueuse/motion (page transitions, entrances) + @formkit/auto-animate (list animations)
- Database: 4 tables — profiles, tasks, task_progress, evaluations
- Auth: Supabase Auth with JWT; role stored in profiles table
- RLS: Row-Level Security policies per table per role (critical — budget 2-3 days)
- MCP: Supabase MCP + Lighthouse MCP active in Claude Code
- Routing: Vue Router 4 with navigation guards per role

### UX Design Requirements

UX-DR1: App layout — dark sidebar (navigation) + light main content area
UX-DR2: Status color language — To Do (gray), In Progress (blue), Done (amber/yellow), Accepted (green)
UX-DR3: Track color-coding — each of 7 tracks has a distinct accent color used consistently
UX-DR4: Page/route transitions — smooth fade+slide animation between views
UX-DR5: Task card status change — animated color shift + subtle bounce when status changes
UX-DR6: Trainee dashboard — progress ring component that animates fill as tasks are completed
UX-DR7: Dashboard stats — numbers animate/count up on first load
UX-DR8: Sidebar — smooth expand/collapse with icon-only collapsed state
UX-DR9: Empty states — friendly illustration + entrance animation; never a blank void
UX-DR10: Toast notifications — slide in from top-right for success/error/info feedback
UX-DR11: Role-aware first-login — each role gets a tailored welcome/onboarding moment

### FR Coverage Map

| FR | Epic | Story |
|---|---|---|
| FR1, FR2 | Epic 2 | Story 2.1 |
| FR3 | Epic 2 | Story 2.2 |
| FR4, FR5 | Epic 2 | Story 2.3 |
| FR6 | Epic 3 | Story 3.1 |
| FR7 | Epic 3 | Story 3.2 |
| FR8, FR9 | Epic 3 | Story 3.3 |
| FR10 | Epic 3 | Story 3.2 |
| FR11 | Epic 3 | Story 3.4 |
| FR12 | Epic 4 | Story 4.1 |
| FR13 | Epic 4 | Story 4.2 |
| FR14 | Epic 4 | Story 4.3 |
| FR15 | Epic 2 | Story 2.4 (RLS) |
| NFR6, UX-DR1–11 | Epic 1 + Epic 5 | Stories 1.3–1.6, 5.1–5.5 |

---

## Epic List

1. **Epic 1: Project Foundation & Design System** — Scaffold the app, set up design system, routing, Supabase client
2. **Epic 2: Authentication & User Management** — Login, role detection, admin pages to add mentors and trainees
3. **Epic 3: Task Management & Progress Flow** — Create tasks, track status, mentor + trainee dashboards
4. **Epic 4: End-of-Program Evaluation** — Criteria builder, 0–7 scoring, auto-calculated averages
5. **Epic 5: UI Polish & Animations** — Status colors, transitions, progress ring, empty states, toasts

---

## Epic 1: Project Foundation & Design System

**Goal:** Set up a working Vue 3 + TypeScript + Tailwind + Supabase project with routing, design system components, and animation libraries ready to use. Every story in every other epic depends on this foundation being solid.

---

### Story 1.1: Project Scaffolding

As a **developer (Hala)**,
I want a working Vue 3 + TypeScript + Tailwind project with Supabase connected,
So that I have a clean, typed foundation to build every feature on.

**Acceptance Criteria:**

**Given** I run the dev server
**When** I open localhost:5173
**Then** a working Vue 3 app loads with no TypeScript errors

**Given** the project is initialized
**When** I inspect the config
**Then** Tailwind CSS is configured with a custom color palette (status colors + track colors)
**And** TypeScript strict mode is enabled in tsconfig.json
**And** Supabase client is initialized with environment variables (not hardcoded keys)
**And** `.env.local` is in `.gitignore`

**Given** the Supabase project exists
**When** I run the type generation script
**Then** TypeScript types are auto-generated from the database schema into `src/types/supabase.ts`

---

### Story 1.2: App Layout — Sidebar + Main Content

As a **logged-in user**,
I want a consistent app layout with a dark sidebar and light main area,
So that navigation feels familiar and role-specific menu items are always visible.

**Acceptance Criteria:**

**Given** I am logged in as any role
**When** the app loads
**Then** a dark sidebar is visible on the left with navigation links relevant to my role
**And** the main content area is light and fills the remaining width

**Given** I am on a desktop screen
**When** I view the sidebar
**Then** it shows icon + label for each navigation item

**Given** I am on a mobile screen
**When** I view the layout
**Then** the sidebar collapses to a hamburger menu
**And** the main content fills the full width

**Given** I click the collapse button on the sidebar
**When** the animation completes
**Then** the sidebar shows icons only (no labels)
**And** the transition is smooth (not a jump)

---

### Story 1.3: Routing & Navigation Guards

As a **user of any role**,
I want the app to redirect me to the right page based on my role,
So that I only see screens relevant to me and can't access unauthorized routes.

**Acceptance Criteria:**

**Given** I am not logged in
**When** I try to visit any protected route
**Then** I am redirected to /login

**Given** I am logged in as a Trainee
**When** I try to visit /admin or /mentor routes
**Then** I am redirected to my Trainee dashboard with a "not authorized" toast

**Given** I am logged in
**When** the app loads after auth
**Then** I am automatically sent to my role's default dashboard
**And** the navigation items shown match my role only

---

### Story 1.4: Supabase Database Schema Setup

As a **developer (Hala)**,
I want the 4 MVP tables created in Supabase with correct relationships and RLS,
So that all feature stories can read and write data securely.

**Acceptance Criteria:**

**Given** I open Supabase dashboard
**When** I check the tables
**Then** these 4 tables exist with correct columns:
- `profiles` (id, user_id, role, full_name, email, track, mentor_id, created_at)
- `tasks` (id, title, description, created_by, assigned_to, status, created_at, updated_at)
- `task_progress` (id, task_id, trainee_id, status, updated_at)
- `evaluations` (id, trainee_id, mentor_id, criteria, scores, average_score, created_at)

**Given** a trainee is logged in
**When** they query the tasks table
**Then** RLS only returns tasks assigned to them (not other trainees' tasks)

**Given** a mentor is logged in
**When** they query the tasks table
**Then** RLS returns only tasks they created or tasks for their assigned trainees

**Given** an admin is logged in
**When** they query any table
**Then** RLS allows full read access

---

### Story 1.5: Design System — Components & Tokens

As a **developer (Hala)**,
I want shadcn-vue installed and Tailwind configured with the design tokens,
So that all UI components are consistent, accessible, and match the design direction.

**Acceptance Criteria:**

**Given** the project is set up
**When** I check the component library
**Then** shadcn-vue is installed with at least these components ready: Button, Card, Badge, DropdownMenu, Dialog, Input, Label, Toast, Avatar

**Given** I inspect the Tailwind config
**When** I look at the theme
**Then** these custom tokens are defined:
- Status colors: `status-todo` (gray), `status-inprogress` (blue), `status-done` (amber), `status-accepted` (green)
- Track colors: 7 named track accent colors
- Sidebar background: dark (slate-900 or similar)

**Given** I install lucide-vue-next
**When** I use an icon component
**Then** icons render correctly at defined sizes (16, 20, 24px)

---

### Story 1.6: Animation Foundation

As a **user of the platform**,
I want smooth animations when navigating and interacting,
So that the platform feels polished and modern — not like a corporate HR tool.

**Acceptance Criteria:**

**Given** @vueuse/motion and @formkit/auto-animate are installed
**When** I navigate between routes
**Then** a fade+slide transition plays (≤ 300ms, no layout shift)

**Given** a list of tasks renders on screen
**When** a task changes status and re-orders
**Then** AutoAnimate handles the list transition automatically with no extra code per list

**Given** the app loads a dashboard for the first time
**When** stat numbers appear
**Then** they count up from 0 to their value over ~800ms

---

## Epic 2: Authentication & User Management

**Goal:** Secure login with role detection, and admin pages to add mentors and trainees. Every user has a role. Every role has a different experience.

---

### Story 2.1: Login Page

As a **user (Admin, Mentor, or Trainee)**,
I want to log in with my email and password,
So that I can access my role-specific dashboard securely.

**Acceptance Criteria:**

**Given** I visit the app while logged out
**When** the login page loads
**Then** I see an email input, password input, and a Sign In button
**And** the design is clean, centered, not cluttered (not a boring form)

**Given** I enter correct credentials
**When** I click Sign In
**Then** Supabase Auth logs me in and my role is fetched from the profiles table
**And** I am redirected to my role's default dashboard

**Given** I enter incorrect credentials
**When** I click Sign In
**Then** a toast notification slides in from top-right with "Incorrect email or password"
**And** I remain on the login page

**Given** I am already logged in
**When** I visit /login
**Then** I am redirected to my dashboard automatically

---

### Story 2.2: Admin — Add Mentor

As an **Admin**,
I want to add a new mentor to the platform,
So that mentors can log in and manage their assigned trainees.

**Acceptance Criteria:**

**Given** I am logged in as Admin and on the Mentors page
**When** I click "Add Mentor"
**Then** a modal/dialog opens with fields: Full Name, Email, Track (dropdown of 7 tracks), Temporary Password

**Given** I fill in all fields and click Save
**When** the request completes
**Then** a Supabase Auth user is created for the mentor
**And** a row is inserted in the profiles table with role = 'mentor'
**And** a success toast appears: "Mentor added successfully"
**And** the mentor appears in the mentors list immediately

**Given** I enter an email already in the system
**When** I click Save
**Then** an error toast appears: "This email is already registered"

**Given** the mentors list has entries
**When** I view the page
**Then** each mentor card shows: name, track badge (with track accent color), email

---

### Story 2.3: Admin — Add Trainee & Assign Mentor

As an **Admin**,
I want to add a new trainee and assign them a mentor,
So that the trainee can log in and their mentor can manage their progress.

**Acceptance Criteria:**

**Given** I am logged in as Admin and on the Trainees page
**When** I click "Add Trainee"
**Then** a dialog opens with fields: Full Name, Email, Track (dropdown), Assign Mentor (dropdown of mentors on the same track), Temporary Password

**Given** I fill in all required fields and click Save
**When** the request completes
**Then** a Supabase Auth user is created
**And** a profiles row is inserted with role = 'trainee' and the selected mentor_id
**And** a success toast appears
**And** the trainee appears in the trainees list

**Given** the trainees list has entries
**When** I view it
**Then** I can see each trainee's name, track, and assigned mentor name
**And** I can click a trainee to change their assigned mentor via a reassign dropdown

---

### Story 2.4: Row-Level Security Policies

As a **developer (Hala)**,
I want RLS policies written and tested for all 4 tables,
So that no user can access another user's data — enforced at the database, not just the UI.

**Acceptance Criteria:**

**Given** RLS is enabled on all 4 tables
**When** a trainee queries tasks
**Then** only rows where assigned_to = their user_id are returned

**Given** a mentor queries tasks
**When** the query runs
**Then** only tasks they created OR assigned to their trainees are returned

**Given** a mentor queries profiles
**When** the query runs
**Then** only their own profile and their assigned trainees' profiles are returned

**Given** an admin queries any table
**When** the query runs
**Then** all rows are returned (full access)

**Given** an unauthenticated request hits Supabase
**When** any table is queried
**Then** 0 rows are returned (anon role has no SELECT grants)

---

## Epic 3: Task Management & Progress Flow

**Goal:** Mentors create tasks, trainees work through them, both see progress clearly. Replaces the 120-card Trello chaos with a clean, role-aware view.

---

### Story 3.1: Mentor — Create & Assign Task

As a **Mentor**,
I want to create a task and assign it to one of my trainees,
So that the trainee knows exactly what to do and I can track their progress.

**Acceptance Criteria:**

**Given** I am logged in as a Mentor
**When** I click "New Task"
**Then** a dialog opens with fields: Title (required), Description (optional, rich text or plain), Assign To (dropdown of my trainees only)

**Given** I fill in Title and select a trainee, then click Create
**When** the task is saved
**Then** a row is inserted in `tasks` with status = 'todo'
**And** a row is inserted in `task_progress` linking the task to the trainee
**And** the task appears on my dashboard immediately (with AutoAnimate transition)
**And** a success toast appears

**Given** I view my task list
**When** looking at created tasks
**Then** each task shows: title, assigned trainee name + avatar, current status badge (color-coded), created date

---

### Story 3.2: Trainee — My Tasks Dashboard

As a **Trainee**,
I want to see all my assigned tasks with their current status,
So that I always know what to do today and how I'm progressing overall.

**Acceptance Criteria:**

**Given** I am logged in as a Trainee
**When** my dashboard loads
**Then** I see only my own tasks (RLS enforced)
**And** a progress ring animates to show my completion percentage (Accepted tasks / total tasks)
**And** tasks are grouped or sortable by status

**Given** I have no tasks yet
**When** the page loads
**Then** an empty state with illustration and animation appears: "Your mentor hasn't assigned tasks yet — check back soon!"

**Given** I have tasks in multiple statuses
**When** I view the dashboard
**Then** each task card shows its status badge with the correct color (gray/blue/amber/green)
**And** tasks I can act on (To Do, In Progress) are visually prominent

---

### Story 3.3: Task Status Dropdown

As a **Trainee or Mentor**,
I want to change a task's status from a dropdown,
So that progress is updated instantly without drag-and-drop complexity.

**Acceptance Criteria:**

**Given** I am a Trainee viewing my task in "To Do" status
**When** I open the status dropdown
**Then** I only see: "In Progress", "Done" (cannot skip to Accepted; cannot go backward)

**Given** I am a Mentor viewing any task
**When** I open the status dropdown
**Then** I see all 4 statuses: To Do, In Progress, Done, Accepted

**Given** I select a new status from the dropdown
**When** the update saves
**Then** the task card color and badge animate to the new status (color shift + subtle bounce)
**And** the progress ring on the Trainee dashboard updates to reflect the change
**And** a toast confirms: "Task updated to [Status]"

**Given** I am a Trainee and try to set a task to "Accepted" via the API directly
**When** the request hits Supabase
**Then** RLS rejects the update (Trainees cannot write 'accepted' status)

---

### Story 3.4: Mentor — Trainees Progress Dashboard

As a **Mentor**,
I want to see all my trainees' task progress in one view,
So that I can spot who needs help without clicking into each trainee individually.

**Acceptance Criteria:**

**Given** I am logged in as a Mentor
**When** my dashboard loads
**Then** I see a grid/table: one row per trainee, columns for task status counts (To Do, In Progress, Done, Accepted)

**Given** a trainee has tasks in various statuses
**When** I view their row
**Then** I see their name, track badge, and progress at a glance
**And** if a trainee has tasks stuck in "Done" (awaiting my acceptance) they are visually flagged

**Given** I click on a trainee's row
**When** the detail view opens
**Then** I see all their individual tasks with status dropdowns I can act on directly

**Given** I have no trainees assigned yet
**When** the dashboard loads
**Then** an empty state appears: "No trainees assigned yet — contact your admin"

---

## Epic 4: End-of-Program Evaluation

**Goal:** Replace informal end-of-program feedback with a structured, consistent evaluation system. Criteria are configurable. Scoring is 0–7. Average is automatic.

---

### Story 4.1: Configure Evaluation Criteria

As an **Admin or Mentor**,
I want to define the list of evaluation criteria for the program,
So that all trainees are assessed on the same dimensions fairly.

**Acceptance Criteria:**

**Given** I am on the Evaluation Settings page
**When** it loads
**Then** I see any previously saved criteria listed
**And** an "Add Criterion" button

**Given** I click "Add Criterion"
**When** the input appears
**Then** I can type the criterion name (e.g., "Technical Skills", "Communication", "Consistency")
**And** press Enter or click Add to save it

**Given** I have a list of criteria
**When** I want to reorder or delete one
**Then** I can drag to reorder or click a delete icon per criterion

**Given** criteria are saved
**When** any mentor opens the evaluation form for a trainee
**Then** they see the same criteria list

---

### Story 4.2: Mentor — Score a Trainee

As a **Mentor**,
I want to score my trainee on each criterion at the end of the program,
So that HR has a structured, data-backed assessment of every trainee.

**Acceptance Criteria:**

**Given** I open a trainee's evaluation form
**When** it loads
**Then** I see each configured criterion with a score input (0–7 scale, clearly labeled)
**And** a description field for optional written feedback per criterion

**Given** I enter scores for all criteria and click Submit
**When** the evaluation saves
**Then** a row is inserted in the `evaluations` table with the scores as JSON and the calculated average
**And** a success toast appears: "Evaluation submitted for [Trainee Name]"

**Given** I already submitted an evaluation for a trainee
**When** I open their evaluation form again
**Then** my previous scores are shown and I can edit and resubmit

---

### Story 4.3: Evaluation Results View

As an **Admin or Mentor**,
I want to see each trainee's evaluation score summary,
So that we can identify top performers and make informed end-of-program decisions.

**Acceptance Criteria:**

**Given** I am on the Evaluations page
**When** evaluations have been submitted
**Then** I see a list of trainees with their average score prominently displayed
**And** scores are color-coded: 0–3 (red), 4–5 (amber), 6–7 (green)

**Given** I click on a trainee's evaluation summary
**When** the detail view opens
**Then** I see the breakdown: each criterion with its score out of 7
**And** the overall average calculated automatically

**Given** a trainee has no evaluation submitted yet
**When** they appear in the list
**Then** their score shows as "— Pending"

---

## Epic 5: UI Polish & Animations

**Goal:** Make the platform feel like a product people enjoy opening — not corporate HR software. Every interaction should feel smooth and intentional.

---

### Story 5.1: Status Color System & Track Colors

As a **user of any role**,
I want consistent color language throughout the platform,
So that I can read task status and track at a glance without reading text.

**Acceptance Criteria:**

**Given** any task appears anywhere in the app
**When** I look at its status badge
**Then** it uses the exact color: To Do = gray, In Progress = blue, Done = amber, Accepted = green

**Given** a track label appears anywhere in the app
**When** I look at it
**Then** it uses that track's unique accent color consistently (e.g., Frontend = indigo, Security = red, QA = teal)

**Given** I look at the evaluation scores
**When** they are displayed
**Then** 0–3 = red/rose, 4–5 = amber, 6–7 = green — matching the status language

---

### Story 5.2: Page Transition Animations

As a **user navigating the app**,
I want smooth transitions between pages,
So that navigation feels fluid, not like a hard page flash.

**Acceptance Criteria:**

**Given** @vueuse/motion is configured with a global route transition
**When** I navigate from any page to any other page
**Then** the outgoing page fades+slides out (left, ≤150ms)
**And** the incoming page fades+slides in (≤200ms)
**And** there is no layout flash or white screen between transitions

---

### Story 5.3: Progress Ring Component

As a **Trainee**,
I want to see my task completion visualized as a circular progress ring,
So that I feel my progress is real and motivating — not just a number.

**Acceptance Criteria:**

**Given** I open my dashboard
**When** the progress ring component loads
**Then** it animates from 0% to my actual completion percentage over ~1 second

**Given** my completion is 0%
**When** the ring displays
**Then** it is empty (gray ring) with "0% Complete" in the center

**Given** my completion is 100% (all tasks Accepted)
**When** the ring displays
**Then** it shows a full green ring with a checkmark and "Complete!" text

---

### Story 5.4: Empty States

As a **user who has no data yet**,
I want a friendly, illustrated empty state instead of a blank screen,
So that the platform feels alive and warm even before data exists.

**Acceptance Criteria:**

**Given** a Trainee has no tasks
**When** they view their dashboard
**Then** an empty state shows with an illustration and message: "Your mentor is setting up your tasks — check back soon!"

**Given** a Mentor has no trainees assigned
**When** they view their dashboard
**Then** an empty state shows: "No trainees assigned yet — contact your admin"

**Given** any empty state loads
**When** the illustration and text appear
**Then** they entrance-animate in (fade + slight rise from below, ~400ms)

---

### Story 5.5: Toast Notification System

As a **user performing any action**,
I want immediate feedback when something succeeds or fails,
So that I know my action worked without refreshing or guessing.

**Acceptance Criteria:**

**Given** any action completes successfully (task created, status changed, user added, evaluation saved)
**When** the response returns
**Then** a success toast slides in from the top-right with a green icon and clear message

**Given** any action fails (network error, validation error, auth error)
**When** the error is caught
**Then** an error toast slides in from the top-right with a red icon and specific message (not "Something went wrong")

**Given** a toast is showing
**When** 4 seconds pass or I click the X
**Then** the toast slides out smoothly

**Given** multiple actions happen quickly
**When** multiple toasts appear
**Then** they stack vertically without overlapping
