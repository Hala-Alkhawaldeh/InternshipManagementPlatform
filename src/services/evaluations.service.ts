import { supabase } from '@/lib/supabase'
import type { EvaluationCriterion, EvaluationScore } from '@/types/app.types'
import type { Json } from '@/types/supabase'

export const evaluationsService = {
  // ── Criteria settings ────────────────────────────────────────

  async getCriteria(): Promise<{ data: EvaluationCriterion[] | null; error: unknown }> {
    const { data, error } = await supabase
      .from('evaluation_settings')
      .select('criteria')
      .single()
    if (error) return { data: null, error }
    return { data: (data.criteria as unknown as EvaluationCriterion[]) ?? [], error: null }
  },

  async upsertCriteria(criteria: EvaluationCriterion[]) {
    // There is always exactly one row — update it
    return await supabase
      .from('evaluation_settings')
      .update({ criteria: criteria as unknown as Json, updated_at: new Date().toISOString() })
      .neq('id', '00000000-0000-0000-0000-000000000000') // matches all rows
      .select()
      .single()
  },

  // ── Evaluations ───────────────────────────────────────────────

  async getAllEvaluations() {
    return await supabase
      .from('evaluations')
      .select('*')
      .order('created_at', { ascending: false })
  },

  async getEvaluationByTrainee(traineeId: string) {
    return await supabase
      .from('evaluations')
      .select('*')
      .eq('trainee_id', traineeId)
      .single()
  },

  async submitEvaluation(payload: {
    traineeId: string
    mentorId: string
    criteria: EvaluationCriterion[]
    scores: EvaluationScore[]
  }) {
    const averageScore =
      payload.scores.reduce((sum, s) => sum + s.score, 0) / payload.scores.length

    return await supabase
      .from('evaluations')
      .upsert({
        trainee_id: payload.traineeId,
        mentor_id: payload.mentorId,
        criteria: payload.criteria as unknown as Json,
        scores: payload.scores as unknown as Json,
        average_score: Math.round(averageScore * 100) / 100,
      })
      .select()
      .single()
  },
}
