import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

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
    return json({ error: 'Only mentors and admins can generate criteria suggestions' }, 403)
  }

  // Existing criteria are sent so the model suggests NEW ones, not duplicates.
  let existingNames: string[] = []
  try {
    const body = await req.json()
    if (Array.isArray(body?.existingNames)) {
      existingNames = body.existingNames.filter((n: unknown) => typeof n === 'string')
    }
  } catch {
    // No body / not JSON is fine — treat as no existing criteria.
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) return json({ error: 'AI generation is not configured' }, 502)

  const avoidClause = existingNames.length
    ? ` Do not repeat or closely duplicate any of these existing criteria: ${existingNames.join(', ')}.`
    : ''

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
          content: `Suggest 5 evaluation criteria for scoring software engineering internship trainees at the end of a 3-month program. Cover a mix of technical and soft skills (e.g. code quality, communication, problem solving, consistency, technical growth) — but choose your own concise wording.${avoidClause} Respond with ONLY valid JSON, no markdown fences: {"criteria": ["short criterion name", "short criterion name", ...]} — each name max 40 characters.`,
        }],
      }),
    })

    if (!claudeRes.ok) return json({ error: 'AI generation failed, try again' }, 502)

    const claudeData = await claudeRes.json()
    const text = claudeData.content?.[0]?.text ?? ''
    const parsed = JSON.parse(text)

    if (!Array.isArray(parsed.criteria) || !parsed.criteria.every((c: unknown) => typeof c === 'string')) {
      return json({ error: 'AI generation returned an unexpected format' }, 502)
    }

    return json({ criteria: parsed.criteria }, 200)
  } catch {
    return json({ error: 'AI generation failed, try again' }, 502)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  })
}
