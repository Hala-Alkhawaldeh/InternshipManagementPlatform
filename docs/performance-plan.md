# Performance Plan — Internship Management & Mentorship Platform

**Date:** 2026-05-31
**Author:** Hala Khawaldeh
**NFR Target:** Lighthouse performance score ≥ 85 on all main pages

---

## What We Have

| Tool | Purpose | Status |
|---|---|---|
| Lighthouse MCP | Full page audits (performance, a11y, best practices) against `localhost:5173` | Configured in `.claude/settings.json` |
| Senior Frontend bundle script | `python .claude/skills/senior-frontend/scripts/bundle_analyzer.py .` | Installed |

---

## What Else to Add

### 1. Bundle Analyzer — `rollup-plugin-visualizer`

**Why:** shadcn-vue components can bloat the bundle if imported carelessly. This plugin generates a visual treemap after every build so you can see exactly what's taking up space.

**Install:**
```bash
npm install -D rollup-plugin-visualizer
```

**Config:**
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    vue(),
    visualizer({
      open: true,       // opens treemap in browser after build
      gzipSize: true,   // shows gzip size (closer to real network cost)
      filename: 'dist/bundle-stats.html',
    }),
  ],
})
```

**Run:**
```bash
npm run build   # opens bundle-stats.html automatically
```

**What to look for:**
- Any single chunk over 200KB (gzipped) is a red flag
- shadcn-vue components that are imported but unused
- Duplicate dependencies (two versions of the same library)

---

### 2. Route-Level Code Splitting

**Why:** Without lazy loading, every route's component is bundled into one JS file. The login page ends up loading the admin dashboard code — wasted bytes.

**How:** Vue Router supports dynamic imports natively. One line change per route.

```typescript
// src/router/index.ts

// ❌ Eager — everything in one bundle
import AdminPage from '@/pages/AdminPage.vue'

// ✅ Lazy — each page is its own chunk, loaded on demand
const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/pages/admin/AdminDashboard.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/mentor',
    name: 'mentor',
    component: () => import('@/pages/mentor/MentorDashboard.vue'),
    meta: { requiresAuth: true, roles: ['mentor'] },
  },
  {
    path: '/trainee',
    name: 'trainee',
    component: () => import('@/pages/trainee/TraineeDashboard.vue'),
    meta: { requiresAuth: true, roles: ['trainee'] },
  },
]
```

**Result:** A trainee logging in only downloads trainee dashboard code — not admin or mentor pages.

---

### 3. Supabase Query Hygiene

This has more impact than any frontend optimization for a data-driven app.

#### 3.1 Select Only What You Need

```typescript
// ❌ Fetches all columns — wasteful on wide tables
supabase.from('profiles').select('*')

// ✅ Fetch only what the component renders
supabase.from('profiles').select('id, full_name, track, mentor_id')
```

Apply this rule when building each component — match the select to exactly what the template uses.

#### 3.2 Database Indexes

Create these indexes in Supabase when setting up the schema (Story 1.4). They make the RLS policy queries fast at any scale.

```sql
-- profiles: role lookups (mentor lists, trainee lists)
CREATE INDEX idx_profiles_role ON profiles(role);

-- profiles: mentor → trainees lookup (used in RLS + mentor dashboard)
CREATE INDEX idx_profiles_mentor_id ON profiles(mentor_id);

-- tasks: per-trainee task lists
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);

-- tasks: per-mentor task lookups
CREATE INDEX idx_tasks_created_by ON tasks(created_by);

-- task_progress: status filtering (dashboard counts)
CREATE INDEX idx_task_progress_trainee_id ON task_progress(trainee_id);
CREATE INDEX idx_task_progress_status ON task_progress(status);

-- evaluations: per-trainee evaluation lookup
CREATE INDEX idx_evaluations_trainee_id ON evaluations(trainee_id);
CREATE INDEX idx_evaluations_mentor_id ON evaluations(mentor_id);
```

#### 3.3 Avoid the N+1 Query Pattern

The mentor dashboard shows all trainees + their task progress. The wrong way hits the DB once per trainee.

```typescript
// ❌ N+1 — 1 query for trainees + 1 query per trainee for tasks
const trainees = await profilesService.getMyTrainees(mentorId)
for (const trainee of trainees) {
  trainee.tasks = await tasksService.getTasksByTrainee(trainee.id) // called N times
}

// ✅ One query with a join — already set up in tasksService
const tasks = await tasksService.getTasksWithProgress()
// Group by trainee in the component, not with separate DB calls
```

The `select('*, progress:task_progress(*)')` pattern in `tasks.service.ts` already handles this correctly — always use it instead of separate queries.

---

## What NOT to Add (MVP)

| Technique | Why Skip It |
|---|---|
| Web Vitals tracking | 30 users, internal tool — no stakeholder needs this data |
| Service Worker / PWA | Adds complexity, offline support not required |
| SSR / Nuxt | No SEO requirement, auth-gated app |
| Image CDN / optimization | No user-uploaded images in MVP |
| Redis / query caching | Supabase handles connection pooling; overkill at this scale |
| Virtual scrolling | No list will exceed ~50 items (10 trainees, ~5 tasks each) |

---

## Performance Workflow

Follow this order — don't optimize before you measure.

```
1. Build features (don't prematurely optimize)
        ↓
2. Run Lighthouse MCP against localhost:5173
   → Fix anything below 85
        ↓
3. Run npm run build → check bundle treemap
   → Investigate any chunk > 200KB gzipped
        ↓
4. Before first deployment → run Lighthouse again on the deployed URL
```

### Running Lighthouse MCP

```
# In Claude Code, with the dev server running on localhost:5173:
Run a Lighthouse audit on localhost:5173
```

### Target Scores

| Metric | Target |
|---|---|
| Performance | ≥ 85 |
| Accessibility | ≥ 80 |
| Best Practices | ≥ 90 |
| SEO | Not applicable (auth-gated) |

---

## Quick Checklist — Before Marking Any Story Done

```
☐ No select('*') unless all columns are actually used in the template
☐ All routes use lazy imports () => import(...)
☐ No N+1 patterns — mentor dashboard uses join queries, not loops
☐ Run Lighthouse if the story adds a new page (score ≥ 85)
☐ Run bundle analyzer before first deploy (no chunk > 200KB gzipped)
```
