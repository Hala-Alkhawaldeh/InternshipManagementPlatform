import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/app.types'

export const profilesService = {
  async getMyProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: { message: 'Not authenticated' } }
    return await supabase.from('profiles').select('*').eq('user_id', user.id).single()
  },

  async getProfileByUserId(userId: string) {
    return await supabase.from('profiles').select('*').eq('user_id', userId).single()
  },

  async getMentors() {
    return await supabase.from('profiles').select('*').eq('role', 'mentor').order('full_name')
  },

  async getTrainees() {
    return await supabase.from('profiles').select('*').eq('role', 'trainee').order('full_name')
  },

  async getMyTrainees(mentorUserId: string) {
    return await supabase
      .from('profiles')
      .select('*')
      .eq('mentor_id', mentorUserId)
      .order('full_name')
  },

  async createProfile(profile: Omit<Profile, 'id' | 'created_at'>) {
    return await supabase.from('profiles').insert(profile).select().single()
  },

  async updateProfile(
    id: string,
    updates: Partial<Pick<Profile, 'full_name' | 'track' | 'mentor_id' | 'role'>>,
  ) {
    return await supabase.from('profiles').update(updates).eq('id', id).select().single()
  },

  async reassignMentor(traineeId: string, newMentorId: string) {
    return await supabase
      .from('profiles')
      .update({ mentor_id: newMentorId })
      .eq('id', traineeId)
      .select()
      .single()
  },
}
