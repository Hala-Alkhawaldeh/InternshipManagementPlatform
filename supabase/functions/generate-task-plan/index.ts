import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

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
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  })
}
