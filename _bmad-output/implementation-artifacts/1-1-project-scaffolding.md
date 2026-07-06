# Story 1.1: Project Scaffolding

**Status:** done
**Completed:** 2026-06-01

## Summary

Vue 3 + TypeScript + Tailwind + Supabase foundation is working. TypeScript strict mode passes clean.

## What was done

- Vue 3 + Vite + TypeScript scaffolded with strict mode (`strict`, `noUnusedLocals`, `noUnusedParameters`)
- Tailwind configured with status colors (`status-todo/inprogress/done/accepted`) and 7 track accent colors
- Supabase client initialized from env vars using typed `createClient<Database>()`
- `src/types/supabase.ts` — hand-written DB types matching the 4 MVP tables with `Relationships` arrays (Supabase JS v2 requires these for typed queries)
- `.env.local` covered by `*.local` in `.gitignore`
- PrimeVue used instead of shadcn-vue (this decision was made before BMad stories were written — carries through to Story 1.5)
- `@vueuse/motion`, `@formkit/auto-animate`, `lucide-vue-next` installed

## Type boundary decisions

- `execute<T>()` in `useApi.ts` accepts `call: () => Promise<{ data: unknown; error: unknown }>` — DB returns string fields (role, status, track) that are widened to primitives at the Supabase layer; the `data as T` cast in execute bridges this boundary
- `TaskWithProgress.progress` is `TaskProgress[]` (array) — reflects what Supabase returns for a joined `task_progress(*)` query
- Evaluation `criteria`/`scores` are cast as `unknown as Json` when writing — they are typed as structured objects (`EvaluationCriterion[]`, `EvaluationScore[]`) on the app side

## Acceptance criteria

- [x] Dev server loads Vue 3 app with no TypeScript errors (`vue-tsc --build --force` clean)
- [x] Tailwind configured with status and track color tokens
- [x] TypeScript strict mode enabled
- [x] Supabase client initialized with env vars (not hardcoded)
- [x] `.env.local` is gitignored
- [x] `src/types/supabase.ts` contains typed schema for all 4 tables
