# Story 6.1: Supabase Edge Function — Generate Task Plan

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer (Hala)**,
I want a Supabase Edge Function that calls the Claude API server-side to generate a suggested task for a given track,
so that the Anthropic API key never reaches the frontend bundle and the endpoint can't be invoked by unauthorized callers to run up API costs.

## Acceptance Criteria

1. **Given** a POST request to the `generate-task-plan` Edge Function with body `{ track: Track }`, **when** the request includes a valid Supabase auth JWT (`Authorization: Bearer <token>`) belonging to a user whose `profiles.role` is `mentor` or `admin`, **then** the function calls the Claude API with a track-specific prompt and returns `200 { title: string, description: string }`.
2. **Given** the caller's JWT resolves to role `trainee`, or the request has no `Authorization` header, or the token is invalid/expired, **when** the function is invoked, **then** it returns `403 { error: string }` — the function performs this check itself, it does not rely on the Supabase anon key being secret (it isn't).
3. **Given** the request body is missing `track` or `track` is not one of the 7 valid `Track` enum values, **when** the function runs, **then** it returns `400 { error: string }` before calling Claude (fail fast, don't spend API budget on bad input).
4. **Given** `ANTHROPIC_API_KEY` is unset, or the Claude API call fails/times out, or Claude returns malformed JSON, **when** the function runs, **then** it returns `502 { error: string }` with a message safe to show in a toast — never a raw stack trace, never the API key.
5. **Given** the full codebase and Supabase secrets are inspected, **when** searching for the Anthropic key, **then** it appears only via `supabase secrets set` / `Deno.env.get('ANTHROPIC_API_KEY')` inside the function — never in `src/`, `.env.example`, or any committed file.

## Tasks / Subtasks

- [ ] Task 1: Scaffold the Supabase functions directory (AC: #1)
  - [ ] Run `npx supabase login` if not already authenticated (interactive — Hala runs this, not scriptable)
  - [ ] Run `npx supabase init` at the project root if no `supabase/` directory exists yet (creates `supabase/config.toml`, `supabase/functions/`)
  - [ ] Run `npx supabase link --project-ref pyryuuphyallomxpmkto` to link the existing hosted project (do not create a new project)
- [ ] Task 2: Write the Edge Function (AC: #1, #2, #3, #4)
  - [ ] Create `supabase/functions/generate-task-plan/index.ts` (Deno runtime — see Dev Notes for full pattern)
  - [ ] Implement JWT role-check using the caller's own token against the existing `profiles` RLS policy (no service_role key needed — see Dev Notes)
  - [ ] Implement track validation against the `Track` enum values
  - [ ] Implement the Claude API call (model, prompt shape, response parsing — see Dev Notes)
  - [ ] Implement error handling paths for AC #3 and #4 with appropriate HTTP status codes
- [ ] Task 3: Configure secrets and deploy (AC: #5)
  - [ ] Run `npx supabase secrets set ANTHROPIC_API_KEY=<key> --project-ref pyryuuphyallomxpmkto` (Hala runs this manually — the key is never pasted into a file or command visible in shared history)
  - [ ] Run `npx supabase functions deploy generate-task-plan --project-ref pyryuuphyallomxpmkto`
- [ ] Task 4: Manual verification (AC: #1, #2, #3)
  - [ ] Sign in as `mentor@sitech.me`, call the deployed function URL with a valid track → expect `200` with `{title, description}`
  - [ ] Sign in as `trainee@sitech.me`, call the same function → expect `403`
  - [ ] Call with no `Authorization` header → expect `403`
  - [ ] Call with an invalid `track` value → expect `400`

## Dev Notes

### Why the role check needs no service_role key

The existing RLS policy `"profiles: users read own"` (`docs/security-plan.md` §5.2) already allows any authenticated user to `SELECT` their own profile row. That means the Edge Function can create a Supabase client scoped to the **caller's own JWT** (forwarded from the incoming request's `Authorization` header) and query `profiles` for that user's role — RLS enforces they can only ever see their own row. This avoids introducing the `service_role` key into the function at all, which is strictly safer (least-privilege) than the alternative of using `service_role` to bypass RLS for the lookup. Do not use `service_role` in this function — there is no need for it.

### Edge Function pattern (Deno, no build step)

```ts
// supabase/functions/generate-task-plan/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2'

const VALID_TRACKS = ['frontend', 'devops', 'python', 'qa', 'typescript', 'performance', 'security']

const TRACK_LABELS: Record<string, string> = {
  frontend: 'Frontend Development (Vue.js / JS / TS / HTML / CSS / SCSS / Git)',
  devops: 'DevOps Basics',
  python: 'Python',
  qa: 'Quality Assurance',
  typescript: 'TypeScript (Advanced Topics)',
  performance: 'Performance Engineering',
  security: 'Security',
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 403)

  // Scoped to the CALLER's own JWT — not service_role. RLS still applies.
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return json({ error: 'Invalid or expired session' }, 403)

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile || !['mentor', 'admin'].includes(profile.role)) {
    return json({ error: 'Only mentors and admins can generate task plans' }, 403)
  }

  let body: { track?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  if (!body.track || !VALID_TRACKS.includes(body.track)) {
    return json({ error: `track must be one of: ${VALID_TRACKS.join(', ')}` }, 400)
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) return json({ error: 'AI generation is not configured' }, 502)

  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Suggest one starter task for a software internship trainee on the "${TRACK_LABELS[body.track]}" track. Respond with ONLY valid JSON, no markdown fences: {"title": "short task title, max 80 chars", "description": "2-4 sentences describing what to do and why"}`,
        }],
      }),
    })

    if (!claudeRes.ok) return json({ error: 'AI generation failed, try again' }, 502)

    const claudeData = await claudeRes.json()
    const text = claudeData.content?.[0]?.text ?? ''
    const parsed = JSON.parse(text)

    if (typeof parsed.title !== 'string' || typeof parsed.description !== 'string') {
      return json({ error: 'AI generation returned an unexpected format' }, 502)
    }

    return json({ title: parsed.title, description: parsed.description }, 200)
  } catch {
    return json({ error: 'AI generation failed, try again' }, 502)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}
```

Notes on this pattern:
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` are automatically available as env vars inside every Supabase Edge Function — do not set these manually as secrets, only `ANTHROPIC_API_KEY` needs `supabase secrets set`.
- Model choice: `claude-haiku-4-5-20251001` — this is a short, single-turn, structured-output generation task (one task suggestion, not multi-step reasoning), so the fastest/cheapest current model tier is the right fit. Do not use a larger model for this.
- The prompt explicitly asks for "ONLY valid JSON, no markdown fences" to avoid having to strip ` ```json ` fences from the response. If Claude still wraps the output, `JSON.parse` will throw and hit AC #4's catch block — acceptable, the frontend just shows a retry-able error toast (Story 6.2 handles that).
- Track labels use the exact wording from `src/enums/tracks.enum.ts` `TrackLabel` — reuse those human-readable labels in the prompt so the AI suggestion is grounded in terms consistent with the rest of the app, not the raw enum key (`frontend` vs `Frontend Development`).

### Project Structure Notes

- New directory: `supabase/functions/generate-task-plan/index.ts` — this project currently has **no** `supabase/` directory at all (confirmed: no local Supabase CLI scaffolding exists yet). Task 1 must run `supabase init` before anything else, this is not optional setup.
- This story creates **no new files under `src/`** — it is backend-only. Story 6.2 is where the frontend calls this function.
- `Role` and `Track` enums already exist at `src/enums/roles.enum.ts` and `src/enums/tracks.enum.ts` — the Edge Function is Deno-side and can't import these directly (different runtime/module resolution), so the `VALID_TRACKS` array and role strings in the Edge Function are intentionally duplicated as plain string literals matching those enum values exactly (`'mentor'`, `'admin'`, `'frontend'`, `'devops'`, `'python'`, `'qa'`, `'typescript'`, `'performance'`, `'security'`). If those enums ever change, this function must be updated to match — there is no shared-import mechanism between the Vite frontend and Deno functions in this project.

### Testing Standards Summary

- No test suite exists in this project yet (`CLAUDE.md` confirms: no vitest/jest/cypress/playwright configured). Verification for this story is the manual curl/browser checks in Task 4, not automated tests.
- Test using the three seeded dev accounts already documented in project memory: `admin@sitech.me`, `mentor@sitech.me`, `trainee@sitech.me`, password `test1234` (public signup must remain enabled for these to keep working, per the existing known-limitation in `docs/security-plan.md` §10 — not a change from this story).

### References

- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-07-06.md#4-detailed-change-proposals] — Story 6.1 acceptance criteria origin
- [Source: docs/security-plan.md#5-2-profiles-table-policies] — "profiles: users read own" RLS policy this function relies on for the role check
- [Source: docs/security-plan.md#7-secrets-management] — secrets table this story adds `ANTHROPIC_API_KEY` to
- [Source: src/enums/tracks.enum.ts] — canonical Track values and labels
- [Source: src/enums/roles.enum.ts] — canonical Role values
- [Source: .env.local#VITE_SUPABASE_URL] — Supabase project ref `pyryuuphyallomxpmkto` used in all CLI commands above

## Dev Agent Record

### Agent Model Used

claude-sonnet-5

### Debug Log References

- CORS: initial version had no `OPTIONS` handling — `supabase.functions.invoke()` sends a preflight request (it adds an `Authorization` header), which hit the generic `405` branch with no CORS headers and got blocked by the browser before the function's real logic ran. Fixed by adding an `OPTIONS` early-return and `corsHeaders` on every response (shared via `supabase/functions/_shared/cors.ts`). Same fix applied to `generate-evaluation-criteria`, which hit this in production first.

### Completion Notes List

- Code complete, not yet deployed. Deployment (`supabase login` / `link` / `secrets set ANTHROPIC_API_KEY` / `functions deploy`) requires Hala's own Supabase credentials — see Task 3 above.

### File List

- `supabase/functions/generate-task-plan/index.ts` (new)
- `supabase/functions/_shared/cors.ts` (new — shared between this and `generate-evaluation-criteria`)
