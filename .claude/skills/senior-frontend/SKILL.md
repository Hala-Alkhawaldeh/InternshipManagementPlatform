---
name: senior-frontend
description: Senior frontend development skill for Vue 3 + TypeScript + Tailwind CSS projects. Includes bundle analysis, performance optimization, component quality checks, and frontend best practices. Use when developing frontend features, optimizing performance, implementing UI/UX designs, managing state, or reviewing frontend code.
---

# Senior Frontend (Vue 3)

Performance, quality, and best practices toolkit for this project's stack.

## This Project's Stack
- **Framework:** Vue 3 + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn-vue
- **Backend:** Supabase (PostgreSQL + RLS)
- **Animation:** @vueuse/motion + @formkit/auto-animate
- **Icons:** lucide-vue-next

## Core Capabilities

### 1. Bundle Analyzer
Analyze Vite build output for bundle bloat and performance issues.

```bash
python scripts/bundle_analyzer.py . [--verbose]
```

### 2. Component Generator
Scaffold new Vue 3 components with TypeScript and best practices.

```bash
python scripts/component_generator.py <project-path> [options]
```

### 3. Frontend Scaffolder
Advanced project scaffolding and setup automation.

```bash
python scripts/frontend_scaffolder.py [arguments] [options]
```

## Reference Documentation

### Frontend Best Practices
`references/frontend_best_practices.md` — TypeScript patterns, performance rules, security considerations, component design guidelines.

## When to Use This Skill

```
✅ Review a component for performance or quality issues
✅ Analyze bundle size after build: python scripts/bundle_analyzer.py .
✅ Check TypeScript patterns in composables or stores
✅ Before marking any story as Done — code quality pass
✅ When a page feels slow or re-renders too much
```

## Vue 3 Best Practices Summary

### Component Quality
- Use `<script setup>` syntax always
- Define props with `defineProps<T>()` — fully typed
- Use `defineEmits<T>()` for typed events
- Extract reusable logic into composables (`use*.ts`)

### Performance
- Use `v-memo` for expensive list renders
- Prefer `shallowRef` for large objects that don't need deep reactivity
- Lazy-load route components with `defineAsyncComponent`
- Run `python scripts/bundle_analyzer.py .` after every build

### TypeScript
- Never use `any` — use `unknown` and narrow properly
- Auto-generate Supabase types: `supabase gen types typescript`
- Type all composable return values explicitly

### Security (Vue-specific)
- Never use `v-html` with user-generated content (XSS risk)
- Always validate form inputs before sending to Supabase
- Store Supabase keys only in `.env.local` (never hardcoded)

## Common Commands

```bash
# Development
npm run dev
npm run build
npm run type-check
npm run lint

# Analysis
python .claude/skills/senior-frontend/scripts/bundle_analyzer.py .
```
