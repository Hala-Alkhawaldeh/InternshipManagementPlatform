import { ref } from 'vue'
import { useApi } from '@/composables/useApi'
import { useToast } from '@/composables/useToast'
import { evaluationsService } from '@/services/evaluations.service'
import type { Evaluation, EvaluationCriterion, EvaluationScore } from '@/types/app.types'

// Module-level (not inside the composable) so every useEvaluations() caller shares
// one cache instead of re-fetching the same rarely-changing criteria list per component.
const CRITERIA_TTL_MS = 5 * 60 * 1000
let criteriaCache: { data: EvaluationCriterion[]; expiresAt: number } | null = null

export function useEvaluations() {
  const { execute, loading } = useApi()
  const { toast } = useToast()

  const evaluations = ref<Evaluation[]>([])
  const currentEvaluation = ref<Evaluation | null>(null)
  const criteria = ref<EvaluationCriterion[]>([])

  // ── Criteria ─────────────────────────────────────────────────
  // Read often (every evaluations page load), changes rarely (admin edits it
  // occasionally) — a good, low-risk cache candidate, unlike task/progress data.

  async function fetchCriteria(force = false) {
    if (!force && criteriaCache && criteriaCache.expiresAt > Date.now()) {
      criteria.value = criteriaCache.data
      return { data: criteriaCache.data, error: null }
    }

    const result = await evaluationsService.getCriteria()
    if (result.data) {
      criteria.value = result.data
      criteriaCache = { data: result.data, expiresAt: Date.now() + CRITERIA_TTL_MS }
    }
    return result
  }

  async function saveCriteria(updated: EvaluationCriterion[]) {
    const result = await execute(() => evaluationsService.upsertCriteria(updated))
    if (!result.error) {
      criteria.value = updated
      criteriaCache = { data: updated, expiresAt: Date.now() + CRITERIA_TTL_MS }
      toast({ title: 'Criteria saved' })
    }
    return result
  }

  // ── Evaluations ───────────────────────────────────────────────

  async function fetchAllEvaluations() {
    const result = await execute<Evaluation[]>(() => evaluationsService.getAllEvaluations())
    if (result.data) evaluations.value = result.data
    return result
  }

  async function fetchEvaluationForTrainee(traineeId: string) {
    const result = await execute<Evaluation>(
      () => evaluationsService.getEvaluationByTrainee(traineeId),
      { showErrorToast: false },
    )
    currentEvaluation.value = result.data
    return result
  }

  async function submitEvaluation(payload: {
    traineeId: string
    mentorId: string
    criteria: EvaluationCriterion[]
    scores: EvaluationScore[]
    traineeName: string
  }) {
    const result = await execute<Evaluation>(() =>
      evaluationsService.submitEvaluation({
        traineeId: payload.traineeId,
        mentorId: payload.mentorId,
        criteria: payload.criteria,
        scores: payload.scores,
      }),
    )

    if (result.data) {
      currentEvaluation.value = result.data
      toast({
        title: 'Evaluation submitted',
        description: `Evaluation for ${payload.traineeName} saved successfully.`,
      })
    }

    return result
  }

  return {
    evaluations,
    currentEvaluation,
    criteria,
    loading,
    fetchCriteria,
    saveCriteria,
    fetchAllEvaluations,
    fetchEvaluationForTrainee,
    submitEvaluation,
  }
}
