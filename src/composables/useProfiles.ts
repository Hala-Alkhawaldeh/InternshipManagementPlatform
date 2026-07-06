import { ref } from 'vue'
import { useApi } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth.store'
import { profilesService } from '@/services/profiles.service'
import type { Profile } from '@/types/app.types'

export function useProfiles() {
  const { execute, loading } = useApi()
  const authStore = useAuthStore()

  const mentors = ref<Profile[]>([])
  const trainees = ref<Profile[]>([])
  const myTrainees = ref<Profile[]>([])

  async function fetchMentors() {
    const result = await execute<Profile[]>(() => profilesService.getMentors())
    if (result.data) mentors.value = result.data
    return result
  }

  async function fetchTrainees() {
    const result = await execute<Profile[]>(() => profilesService.getTrainees())
    if (result.data) trainees.value = result.data
    return result
  }

  async function fetchMyTrainees() {
    const userId = authStore.user?.id
    if (!userId) return

    const result = await execute<Profile[]>(() => profilesService.getMyTrainees(userId))
    if (result.data) myTrainees.value = result.data
    return result
  }

  async function createProfile(profile: Omit<Profile, 'id' | 'created_at'>) {
    return execute<Profile>(() => profilesService.createProfile(profile))
  }

  async function reassignMentor(traineeId: string, newMentorId: string) {
    const result = await execute<Profile>(
      () => profilesService.reassignMentor(traineeId, newMentorId),
    )
    if (result.data) await fetchTrainees()
    return result
  }

  return {
    mentors,
    trainees,
    myTrainees,
    loading,
    fetchMentors,
    fetchTrainees,
    fetchMyTrainees,
    createProfile,
    reassignMentor,
  }
}
