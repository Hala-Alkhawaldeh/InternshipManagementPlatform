# Story 1.2: App Layout — Sidebar + Main Content

**Status:** done
**Completed:** 2026-06-01

## What was built

- `src/layouts/AppSidebar.vue` — dark sidebar (`#0c0e12`) with:
  - Role-aware nav items (Admin / Mentor / Trainee)
  - Active state: 2px indigo left-bar + glow + subtle bg tint
  - Coming-soon nav items shown dimmed (no route yet)
  - Collapse button → icons-only at 60px, expanded at 240px
  - Smooth width + label fade transitions (300ms ease-in-out)
  - Hover tooltips when collapsed (desktop)
  - User profile chip at bottom (initials avatar colored by track)
  - Sign-out button
  - Mobile: slides in as fixed overlay with `translate-x` animation
  - Mobile backdrop: `bg-black/60 backdrop-blur`

- `src/layouts/AppLayout.vue` — outer shell:
  - `flex h-screen` with sidebar + scrollable main area
  - Mobile top bar (hamburger + brand mark) hidden on md+
  - Inner `<RouterView>` with subtle fade+slide transition

- `src/router/index.ts` — updated to nested route structure:
  - `/login` stays flat (no layout)
  - All protected routes are children of the AppLayout component
  - Absolute child paths (`/admin`, `/mentor`, `/trainee`) preserve existing URLs

- `src/assets/main.css` — added `@font-face` for Geist + Geist Mono variable fonts (npm `geist` package)

## Acceptance criteria

- [x] Dark sidebar visible on left for all logged-in roles
- [x] Nav items are role-specific (admin/mentor/trainee see different items)
- [x] Desktop: icon + label, icons-only when collapsed
- [x] Mobile: collapses to hamburger, full-width overlay drawer
- [x] Sidebar collapse animation is smooth (not a jump)
- [x] Main content fills remaining width (flex-1)
