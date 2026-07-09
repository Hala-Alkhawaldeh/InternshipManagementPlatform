import { useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'
import { profilesService } from '@/services/profiles.service'
import { Role } from '@/enums/roles.enum'
import type { Profile } from '@/types/app.types'
import type { Session } from '@supabase/supabase-js'

const roleDashboard: Record<string, string> = {
  [Role.Admin]: 'admin',
  [Role.TeamLead]: 'team-lead',
  [Role.Mentor]: 'mentor',
  [Role.Trainee]: 'trainee',
}

export function useAuth() {
  const { execute, loading } = useApi()
  const authStore = useAuthStore()
  const router = useRouter()

  async function login(email: string, password: string) {
    // Normalize Supabase auth response into {data, error} shape expected by execute
    const result = await execute<Session>(
      async () => {
        const res = await authService.signIn(email, password)
        if (res.error) return { data: null, error: res.error }
        return { data: res.data.session, error: null }
      },
      { errorMessage: 'Incorrect email or password.' },
    )

    if (result.error) return result

    authStore.setSession(result.data)
    await fetchMyProfile()

    const destination = roleDashboard[authStore.role ?? ''] ?? 'login'
    await router.push({ name: destination })

    return result
  }

  async function logout() {
    // signOut returns {error} only — normalize to {data, error}
    await execute(
      async () => {
        const res = await authService.signOut()
        return { data: null, error: res.error }
      },
      { showErrorToast: false },
    )
    authStore.clear()
    await router.push({ name: 'login' })
  }

  async function fetchMyProfile() {
    const result = await execute<Profile>(
      () => profilesService.getMyProfile(),
      { showErrorToast: false },
    )
    if (result.data) authStore.setProfile(result.data)
    return result
  }

  return { login, logout, fetchMyProfile, loading }
}
