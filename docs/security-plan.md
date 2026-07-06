# Security Plan — Internship Management & Mentorship Platform

**Date:** 2026-05-31
**Author:** Hala Khawaldeh
**Stack:** Vue 3 + TypeScript + Supabase (PostgreSQL + RLS)
**Audience:** Developer reference — read this before writing any feature code.

---

## 1. Overview

This platform handles employee data (names, emails, performance scores) and is an internal tool at Sitech. Even though user counts are small (~30 concurrent), the data is sensitive — evaluation scores are HR-grade records.

The security model is **defense in depth**: two independent layers that both must be bypassed to leak data.

```
Layer 1 — Frontend (Vue Router guards + UI restrictions)
  ↓ can be bypassed by a technically savvy user
Layer 2 — Database (Supabase Row-Level Security)
  ↓ cannot be bypassed — enforced at PostgreSQL level, not application code
```

The frontend guards are UX-quality gates. The RLS policies are the actual security boundary. Never trust the frontend alone.

---

## 2. Threat Model

### Assets to protect
| Asset | Sensitivity | Why |
|---|---|---|
| Trainee evaluation scores | High | HR records — career impact |
| User profiles (email, role, track) | Medium | Internal employee data |
| Task content | Low-Medium | Internal work records |
| Auth credentials | Critical | Full account access |

### Threat actors (realistic for this context)
| Actor | Motivation | Attack vector |
|---|---|---|
| Curious trainee | Sees another trainee's scores | Modifying API requests in browser DevTools |
| Curious trainee | Elevates own task to "Accepted" | Direct Supabase REST call bypassing UI |
| Mentor overreach | Reads another mentor's trainees | Direct API request with valid JWT |
| Misconfigured Supabase | No RLS → full table access | Forgetting to enable RLS on a table |
| Exposed service key | Full DB access, bypasses all RLS | Committing `.env.local` to git |

### Out of scope (MVP)
- External attackers (app is internal, no public registration)
- SQL injection (Supabase JS client uses parameterized queries)
- CSRF (Supabase uses JWT in Authorization header, not cookies by default)
- DDoS (internal tool, not exposed to public traffic)

---

## 3. Authentication

### How it works
Supabase Auth handles login. On success, it issues a **JWT** stored in `localStorage` (Supabase default). Every request to Supabase attaches this JWT in the `Authorization: Bearer <token>` header. PostgreSQL reads `auth.uid()` from this token inside RLS policies.

### What you must do

**Never create accounts through self-registration.** Only Admins create users. The Supabase Auth signup endpoint must be disabled for public use.

In Supabase Dashboard → Authentication → Settings:
```
☐ Disable "Enable email confirmations" — users get temp passwords from Admin
☑ Enable "Disable signup" — prevent self-registration
```

**Temporary passwords:** When Admin adds a mentor or trainee (Stories 2.2, 2.3), a temporary password is set. The user should be prompted to change it on first login. This is Phase 2 — for MVP, document this limitation clearly in the Admin UI.

**Session persistence:** Supabase stores the JWT in `localStorage`. This is acceptable for an internal tool. Do not move it to cookies without understanding the full CSRF implications.

**JWT expiry:** Supabase default is 1 hour with auto-refresh. Keep this default — do not extend JWT lifetime.

### Role is NOT in the JWT by default

The JWT contains `auth.uid()` (user ID) but NOT your custom role field. The `role` column lives in the `profiles` table. This means:

1. After login, the frontend must fetch the user's profile to get their role.
2. RLS policies must look up the role from the `profiles` table.
3. The lookup must use a security-definer function to avoid infinite recursion (see Section 5.1).

```typescript
// Correct pattern — fetch role after login
const { data: { user } } = await supabase.auth.getUser()
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('user_id', user.id)
  .single()

// Store role in Pinia — do not trust this for security, only for UX
authStore.setRole(profile.role)
```

---

## 4. Frontend Security

### 4.1 Route Guards (Vue Router)

Route guards redirect unauthorized users. They are a **UX layer only** — a user can bypass them via DevTools. RLS is the actual enforcement.

```typescript
// src/router/index.ts
router.beforeEach(async (to, from) => {
  const auth = useAuthStore()

  // Not logged in → redirect to login
  if (!auth.session && to.meta.requiresAuth) {
    return { name: 'login' }
  }

  // Wrong role → redirect to own dashboard + show toast
  if (to.meta.roles && !to.meta.roles.includes(auth.role)) {
    showToast('You are not authorized to view that page', 'error')
    return { name: `${auth.role}-dashboard` }
  }
})

// Route definitions with role metadata
{ path: '/admin', meta: { requiresAuth: true, roles: ['admin'] } }
{ path: '/mentor', meta: { requiresAuth: true, roles: ['mentor', 'admin'] } }
{ path: '/trainee', meta: { requiresAuth: true, roles: ['trainee'] } }
```

### 4.2 Status Dropdown Restrictions (UI Layer)

The UI enforces who can select which status options. But the real enforcement is in RLS (Section 5.3).

```typescript
// Trainee dropdown options — forward only
const traineeOptions = computed(() => {
  if (currentStatus === 'todo') return ['in_progress']
  if (currentStatus === 'in_progress') return ['done']
  return [] // 'done' and 'accepted' are read-only for trainees
})

// Mentor dropdown options — full control
const mentorOptions = ['todo', 'in_progress', 'done', 'accepted']
```

### 4.3 Input Validation

Validate all user input at the component level. This is not security-critical (RLS handles that) but prevents garbage data.

| Field | Validation |
|---|---|
| Email | Valid email format, required |
| Full Name | Non-empty string, max 100 chars |
| Task Title | Non-empty, max 200 chars |
| Evaluation Score | Integer, 0–7 inclusive |
| Criterion Name | Non-empty, max 150 chars |

```typescript
// Score validation — enforce at the input level
const validateScore = (val: unknown): boolean => {
  const n = Number(val)
  return Number.isInteger(n) && n >= 0 && n <= 7
}
```

### 4.4 XSS Prevention

Vue 3 escapes template interpolations by default — `{{ userInput }}` is safe. The risk comes from `v-html`.

**Rule: Never use `v-html` with user-supplied content.** Task descriptions and criterion names are displayed as plain text only. If you need rich text display later (Phase 2), sanitize with DOMPurify before passing to `v-html`.

### 4.5 Environment Variables

```bash
# .env.local — NEVER commit this file
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# .env.local is in .gitignore — verify this before first commit
```

**The anon key is safe to expose** (it's designed to be public-facing — RLS controls what the anon role can do). **The service_role key bypasses all RLS and must never appear in frontend code.**

```typescript
// SAFE — anon key, limited by RLS
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// NEVER DO THIS — service_role key bypasses all security
// const supabase = createClient(url, process.env.SERVICE_ROLE_KEY)  ← catastrophic
```

---

## 5. Row-Level Security (RLS) — The Real Security Boundary

RLS policies run inside PostgreSQL. They filter every SELECT, INSERT, UPDATE, and DELETE based on the authenticated user's identity (`auth.uid()`). Even if a user crafts a raw HTTP request with their valid JWT, RLS applies.

**Enable RLS on every table immediately when creating it.** An unprotected table is fully readable/writable by anyone with the anon key.

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
```

---

### 5.1 The Role Helper Function (Create This First)

RLS policies need to know the current user's role. Querying the `profiles` table inside a policy on `profiles` causes infinite recursion. The fix is a `SECURITY DEFINER` function that runs with elevated privileges and bypasses RLS for this one lookup.

```sql
-- Create this function BEFORE writing any RLS policies
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$;
```

**What SECURITY DEFINER means:** The function runs as the function owner (postgres superuser), not as the calling user. This is why it can read `profiles` without triggering RLS recursion. The `SET search_path = public` prevents search path injection attacks.

**What STABLE means:** PostgreSQL can call this once per query and cache the result, rather than re-executing it per row. This is a performance optimization that is safe here because the role doesn't change during a query.

---

### 5.2 Profiles Table Policies

```sql
-- ─────────────────────────────────────────
-- SELECT
-- ─────────────────────────────────────────

-- Any user can read their own profile
CREATE POLICY "profiles: users read own"
ON profiles FOR SELECT
USING (user_id = auth.uid());

-- Mentors can read profiles of their assigned trainees
CREATE POLICY "profiles: mentors read own trainees"
ON profiles FOR SELECT
USING (
  mentor_id = auth.uid()
  AND get_my_role() = 'mentor'
);

-- Admins can read all profiles
CREATE POLICY "profiles: admins read all"
ON profiles FOR SELECT
USING (get_my_role() = 'admin');

-- ─────────────────────────────────────────
-- INSERT
-- ─────────────────────────────────────────

-- Only admins can create new user profiles
CREATE POLICY "profiles: admins insert"
ON profiles FOR INSERT
WITH CHECK (get_my_role() = 'admin');

-- ─────────────────────────────────────────
-- UPDATE
-- ─────────────────────────────────────────

-- Admins can update any profile (e.g., reassign mentor)
CREATE POLICY "profiles: admins update"
ON profiles FOR UPDATE
USING (get_my_role() = 'admin')
WITH CHECK (get_my_role() = 'admin');

-- Users can update only their own profile (name, etc.) — NOT role or mentor_id
-- Role changes must go through admin-only path, enforced by column-level security below

-- ─────────────────────────────────────────
-- DELETE
-- ─────────────────────────────────────────

-- Only admins can delete profiles
CREATE POLICY "profiles: admins delete"
ON profiles FOR DELETE
USING (get_my_role() = 'admin');

-- ─────────────────────────────────────────
-- Column-level: prevent role elevation
-- ─────────────────────────────────────────
-- Revoke direct column write on sensitive fields from non-admins
-- This is a belt-and-suspenders measure alongside the UPDATE policy above

REVOKE UPDATE (role, mentor_id) ON profiles FROM authenticated;
GRANT UPDATE (role, mentor_id) ON profiles TO authenticated; -- re-grant to admins via RLS
-- NOTE: In practice, the admin-only UPDATE policy already covers this.
-- Consider using a Postgres function for profile updates to lock column access explicitly.
```

---

### 5.3 Tasks Table Policies

```sql
-- ─────────────────────────────────────────
-- SELECT
-- ─────────────────────────────────────────

-- Trainees can only see tasks assigned to them
CREATE POLICY "tasks: trainees read own"
ON tasks FOR SELECT
USING (
  assigned_to = auth.uid()
  AND get_my_role() = 'trainee'
);

-- Mentors can see tasks they created OR assigned to any of their trainees
CREATE POLICY "tasks: mentors read relevant"
ON tasks FOR SELECT
USING (
  get_my_role() = 'mentor'
  AND (
    created_by = auth.uid()
    OR assigned_to IN (
      SELECT user_id FROM profiles WHERE mentor_id = auth.uid()
    )
  )
);

-- Admins can see all tasks
CREATE POLICY "tasks: admins read all"
ON tasks FOR SELECT
USING (get_my_role() = 'admin');

-- ─────────────────────────────────────────
-- INSERT
-- ─────────────────────────────────────────

-- Mentors can create tasks — must set created_by to themselves
CREATE POLICY "tasks: mentors insert"
ON tasks FOR INSERT
WITH CHECK (
  get_my_role() IN ('mentor', 'admin')
  AND created_by = auth.uid()
);

-- ─────────────────────────────────────────
-- UPDATE
-- ─────────────────────────────────────────

-- Mentors can update tasks they created or are assigned to their trainees
CREATE POLICY "tasks: mentors update"
ON tasks FOR UPDATE
USING (
  get_my_role() IN ('mentor', 'admin')
  AND (
    created_by = auth.uid()
    OR assigned_to IN (
      SELECT user_id FROM profiles WHERE mentor_id = auth.uid()
    )
    OR get_my_role() = 'admin'
  )
);

-- Trainees CANNOT update the tasks table directly
-- (status changes go through task_progress, not tasks)

-- ─────────────────────────────────────────
-- DELETE
-- ─────────────────────────────────────────

-- Only the task creator or admin can delete a task
CREATE POLICY "tasks: creator or admin delete"
ON tasks FOR DELETE
USING (
  created_by = auth.uid()
  OR get_my_role() = 'admin'
);
```

---

### 5.4 Task Progress Table Policies

This is the most security-critical table. The business rule that **trainees cannot set status to 'accepted'** is enforced here at the database level.

```sql
-- ─────────────────────────────────────────
-- SELECT
-- ─────────────────────────────────────────

-- Trainees see only their own progress rows
CREATE POLICY "task_progress: trainees read own"
ON task_progress FOR SELECT
USING (
  trainee_id = auth.uid()
  AND get_my_role() = 'trainee'
);

-- Mentors see progress for their trainees
CREATE POLICY "task_progress: mentors read trainees"
ON task_progress FOR SELECT
USING (
  get_my_role() = 'mentor'
  AND trainee_id IN (
    SELECT user_id FROM profiles WHERE mentor_id = auth.uid()
  )
);

-- Admins see all
CREATE POLICY "task_progress: admins read all"
ON task_progress FOR SELECT
USING (get_my_role() = 'admin');

-- ─────────────────────────────────────────
-- INSERT (initial progress row when task is created)
-- ─────────────────────────────────────────

-- Only mentors/admins create the initial progress row
CREATE POLICY "task_progress: mentors insert"
ON task_progress FOR INSERT
WITH CHECK (
  get_my_role() IN ('mentor', 'admin')
);

-- ─────────────────────────────────────────
-- UPDATE — THE CRITICAL POLICY
-- ─────────────────────────────────────────

-- Trainees can update ONLY their own rows AND cannot set status to 'accepted'
CREATE POLICY "task_progress: trainees update own, no accepted"
ON task_progress FOR UPDATE
USING (
  trainee_id = auth.uid()
  AND get_my_role() = 'trainee'
)
WITH CHECK (
  trainee_id = auth.uid()
  AND status != 'accepted'  -- ← enforced at DB level, not just UI
);

-- Mentors can update progress for their trainees with any status
CREATE POLICY "task_progress: mentors update trainees"
ON task_progress FOR UPDATE
USING (
  get_my_role() = 'mentor'
  AND trainee_id IN (
    SELECT user_id FROM profiles WHERE mentor_id = auth.uid()
  )
);

-- Admins can update any progress row
CREATE POLICY "task_progress: admins update all"
ON task_progress FOR UPDATE
USING (get_my_role() = 'admin');
```

**Why the `WITH CHECK` on the trainee policy matters:**
- `USING` controls which rows the user can see and target for UPDATE.
- `WITH CHECK` controls what the row is allowed to look like *after* the update.
- Without `WITH CHECK (status != 'accepted')`, a trainee could bypass the UI and send a PATCH request directly to Supabase setting `status = 'accepted'`. This policy makes that impossible.

---

### 5.5 Evaluations Table Policies

```sql
-- ─────────────────────────────────────────
-- SELECT
-- ─────────────────────────────────────────

-- Mentors can read evaluations they wrote
CREATE POLICY "evaluations: mentors read own"
ON evaluations FOR SELECT
USING (
  mentor_id = auth.uid()
  AND get_my_role() = 'mentor'
);

-- Admins can read all evaluations
CREATE POLICY "evaluations: admins read all"
ON evaluations FOR SELECT
USING (get_my_role() = 'admin');

-- Trainees CANNOT read their own evaluations (MVP — HR-only data)
-- If you later want trainees to see their scores, add a policy here.

-- ─────────────────────────────────────────
-- INSERT
-- ─────────────────────────────────────────

-- Mentors can only submit evaluations for their own trainees
CREATE POLICY "evaluations: mentors insert for own trainees"
ON evaluations FOR INSERT
WITH CHECK (
  get_my_role() = 'mentor'
  AND mentor_id = auth.uid()
  AND trainee_id IN (
    SELECT user_id FROM profiles WHERE mentor_id = auth.uid()
  )
);

-- ─────────────────────────────────────────
-- UPDATE (allow re-submission)
-- ─────────────────────────────────────────

-- Mentors can update evaluations they previously submitted, for their trainees
CREATE POLICY "evaluations: mentors update own"
ON evaluations FOR UPDATE
USING (
  mentor_id = auth.uid()
  AND get_my_role() = 'mentor'
)
WITH CHECK (
  mentor_id = auth.uid()
  AND trainee_id IN (
    SELECT user_id FROM profiles WHERE mentor_id = auth.uid()
  )
);

-- Admins can update any evaluation
CREATE POLICY "evaluations: admins update all"
ON evaluations FOR UPDATE
USING (get_my_role() = 'admin');
```

---

### 5.6 The Anon Role — Lock It Down

By default, Supabase grants the `anon` role (unauthenticated requests) SELECT on all tables. After enabling RLS, unauthenticated requests return 0 rows — but it's better to be explicit.

```sql
-- Revoke all direct grants to anon on these tables
REVOKE ALL ON profiles FROM anon;
REVOKE ALL ON tasks FROM anon;
REVOKE ALL ON task_progress FROM anon;
REVOKE ALL ON evaluations FROM anon;

-- The authenticated role still gets access through RLS policies
```

---

## 6. JSONB Security (Evaluations Table)

The `evaluations` table stores `criteria` and `scores` as JSONB. JSONB doesn't have column-level type enforcement, so you must validate shapes in the application layer before inserting.

```typescript
// Define strict types for evaluation data
interface EvaluationCriteria {
  id: string
  name: string
  order: number
}

interface EvaluationScores {
  [criterionId: string]: number  // 0–7
}

// Validate before insert
function validateScores(scores: unknown): scores is EvaluationScores {
  if (typeof scores !== 'object' || scores === null) return false
  return Object.values(scores as Record<string, unknown>).every(v => {
    const n = Number(v)
    return Number.isInteger(n) && n >= 0 && n <= 7
  })
}
```

The `average_score` column should be calculated server-side (in a Postgres function or Supabase Edge Function) rather than trusting the frontend-computed value. For MVP, computing it in the frontend and storing it is acceptable — but annotate it as a trust assumption.

---

## 7. Secrets Management

| Secret | Location | Committed to git? | Notes |
|---|---|---|---|
| `VITE_SUPABASE_URL` | `.env.local` | No | Public-safe but keep out of git |
| `VITE_SUPABASE_ANON_KEY` | `.env.local` | No | Designed to be public; RLS protects data |
| Supabase `service_role` key | Nowhere in this project | Never | Bypasses all RLS — admin-only use in Supabase dashboard |
| Supabase MCP token | `.claude/settings.local.json` | No | Already gitignored |
| Database password | Supabase dashboard only | Never | Never in code |

**Verify `.gitignore` before first commit:**
```
.env.local
.env*.local
.claude/settings.local.json
```

**Rotate the anon key** if you ever accidentally commit it. Supabase makes this easy in Project Settings → API.

---

## 8. Supabase Project Configuration Checklist

Complete these in the Supabase dashboard before any feature development:

```
Authentication
☐ Disable public signup (Settings → Auth → "Disable signup" = ON)
☐ Set JWT expiry to 3600 seconds (1 hour) — keep default
☐ Enable email confirmations OFF (Admin creates accounts directly)

Database
☐ RLS enabled on all 4 tables
☐ get_my_role() function created
☐ All policies created and tested (see Section 5)
☐ anon role revoked from all tables

API
☐ Verify anon key is in .env.local (not hardcoded in src/)
☐ Confirm service_role key does NOT appear anywhere in the frontend codebase
☐ Run: grep -r "service_role" src/ → should return nothing

General
☐ Supabase project is NOT set to public (it's internal by default — confirm)
```

---

## 9. Security Testing Checklist

Run these manual tests after completing each story. Do not skip — these are the scenarios that will catch real bugs.

### After Story 2.1 (Login)
- [ ] Log in with wrong password → toast shows, no redirect
- [ ] Try to navigate to `/admin` while logged in as trainee → redirected + toast
- [ ] Log out, try to navigate to any protected route → redirected to login

### After Story 2.4 (RLS)
Test with two different browser profiles (or incognito windows):
- [ ] Log in as Trainee A → can only see Trainee A's tasks (not B's)
- [ ] Log in as Mentor → can see only their trainees' tasks, not other mentors' trainees
- [ ] Open DevTools → Network tab → copy the Supabase request for tasks → replay it without the Authorization header → should return 0 rows
- [ ] As Trainee, send a PATCH to `task_progress` with `status = 'accepted'` using Supabase REST directly → should return 403 or empty result
- [ ] As Mentor, try to read evaluations of another mentor's trainee → should return 0 rows

### After Story 3.3 (Status Dropdown)
- [ ] As Trainee, verify UI only shows forward statuses (no "Accepted" option in dropdown)
- [ ] As Trainee, use the Supabase JS client in DevTools console: `supabase.from('task_progress').update({ status: 'accepted' }).eq('id', '...')` → RLS should reject it

### After Story 4.2 (Evaluation Submit)
- [ ] As Mentor, try to submit evaluation for a trainee that is NOT assigned to you → should fail with RLS error
- [ ] As Trainee, try to query the evaluations table → should return 0 rows
- [ ] Submit scores outside 0–7 range → frontend validation should catch it before the request is sent

### Before Deployment
- [ ] Run: `grep -r "service_role" src/` → 0 results
- [ ] Run: `grep -r "SUPABASE_SERVICE" src/` → 0 results
- [ ] `.env.local` is NOT in git history: `git log --all -- .env.local` → no commits
- [ ] Run the Security Auditor agent (`/security-review`) for a full audit

---

## 10. Known Limitations & Accepted Risks (MVP)

| Limitation | Risk Level | Mitigation | Phase 2 Plan |
|---|---|---|---|
| Temporary passwords set by Admin, no forced change on first login | Low | Document in Admin UI | Add first-login password change flow |
| `average_score` calculated in frontend, not server-side | Low | RLS still protects data; scores are validated | Move to Postgres function |
| No audit log of who changed what status | Low | Acceptable for internal tool | Add `created_by` + `updated_by` timestamps |
| No rate limiting on login attempts | Low | Internal users only, not public-facing | Add if exposed to internet |
| Trainee evaluation scores hidden from trainees | Design choice | Documented here; easy to add policy later | Add trainee-visible summary if HR decides |

---

## 11. Quick Reference — RLS Policy Summary

| Table | Trainee | Mentor | Admin |
|---|---|---|---|
| `profiles` SELECT | Own profile only | Own profile + own trainees | All profiles |
| `profiles` INSERT | ❌ | ❌ | ✅ |
| `profiles` UPDATE | ❌ | ❌ | ✅ |
| `tasks` SELECT | Only assigned to them | Created by them OR assigned to their trainees | All |
| `tasks` INSERT | ❌ | ✅ (created_by = self) | ✅ |
| `tasks` UPDATE | ❌ | Own tasks or trainees' tasks | All |
| `task_progress` SELECT | Own rows | Their trainees' rows | All |
| `task_progress` UPDATE | Own rows, status ≠ 'accepted' | Their trainees' rows, any status | All |
| `evaluations` SELECT | ❌ | Own evaluations | All |
| `evaluations` INSERT | ❌ | For own trainees only | ✅ |
| `evaluations` UPDATE | ❌ | Own evaluations | ✅ |

---

*Run `/security-review` after completing Story 2.4 (RLS policies) and again before the first deployment.*
