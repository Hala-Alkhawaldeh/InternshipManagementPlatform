import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Session, User } from '@supabase/supabase-js'
import { Role } from '@/enums/roles.enum'
import type { Profile } from '@/types/app.types'

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null)
  const user = ref<User | null>(null)
  const profile = ref<Profile | null>(null)

  const isAuthenticated = computed(() => !!session.value)
  const role = computed(() => profile.value?.role ?? null)
  const isAdmin = computed(() => role.value === Role.Admin)
  const isMentor = computed(() => role.value === Role.Mentor)
  const isTrainee = computed(() => role.value === Role.Trainee)
  const isTeamLead = computed(() => role.value === Role.TeamLead)

  function setSession(s: Session | null) {
    session.value = s
    user.value = s?.user ?? null
  }

  function setProfile(p: Profile | null) {
    profile.value = p
  }

  function clear() {
    session.value = null
    user.value = null
    profile.value = null
  }

  return {
    session,
    user,
    profile,
    isAuthenticated,
    role,
    isAdmin,
    isMentor,
    isTrainee,
    isTeamLead,
    setSession,
    setProfile,
    clear,
  }
})
