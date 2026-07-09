import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Role } from '@/enums/roles.enum'
import type { Track } from '@/enums/tracks.enum'

// Creating auth users requires signUp, which only works with email confirmation
// disabled. We use a throw-away client so the admin's session is never affected.
// persistSession/autoRefreshToken must stay off — otherwise this client writes
// the new user's session into the same localStorage key as the main app client
// (same project URL, no custom storageKey), which can silently swap the admin's
// session for the new user's on the next storage sync and break the RLS check
// on the profile insert below.
function tempClient() {
  return createClient(
    import.meta.env.VITE_SUPABASE_URL as string,
    import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

export const adminService = {
  async createUser(payload: {
    email: string
    password: string
    full_name: string
    role: Extract<Role, 'mentor' | 'trainee'>
    track: Track | null
    mentor_id?: string | null
  }) {
    // Step 1 — create auth account (temp client, no session leak)
    const { data: authData, error: authError } = await tempClient().auth.signUp({
      email: payload.email,
      password: payload.password,
    })

    if (authError) return { data: null, error: authError }
    if (!authData.user) return { data: null, error: { message: 'User creation failed' } }

    // Step 2 — insert profile using admin's authenticated client (RLS: admins insert)
    return await supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        role: payload.role,
        full_name: payload.full_name,
        email: payload.email,
        track: payload.track,
        mentor_id: payload.mentor_id ?? null,
      })
      .select()
      .single()
  },
}
