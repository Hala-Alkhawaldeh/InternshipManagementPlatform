import { supabase } from '@/lib/supabase'

// Admin user creation (Stories 2.2 & 2.3) requires the service_role key and
// must go through a Supabase Edge Function — not the frontend client directly.
// This service covers session management only.

export const authService = {
  signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password })
  },

  signOut() {
    return supabase.auth.signOut()
  },

  getSession() {
    return supabase.auth.getSession()
  },

  onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
    return supabase.auth.onAuthStateChange(callback)
  },
}
