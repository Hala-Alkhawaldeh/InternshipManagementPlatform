import { shallowRef } from 'vue'
import { useApi } from '@/composables/useApi'
import { useToast } from '@/composables/useToast'
import { evaluationsService } from '@/services/evaluations.service'
import { aiService } from '@/services/ai.service'
import type { Evaluation, EvaluationCriterion, EvaluationScore } from '@/types/app.types'

// Module-level (not inside the composable) so every useEvaluations() caller shares
// one cache instead of re-fetching the same rarely-changing criteria list per component.
const CRITERIA_TTL_MS = 5 * 60 * 1000
let criteriaCache: { data: EvaluationCriterion[]; expiresAt: number } | null = null

// Fallback when the generate-evaluation-criteria Edge Function is unreachable
// (not yet deployed, cold start, network issue) — a curated mix of technical
// and soft skills, matching the same brief given to the AI prompt itself.
const STATIC_CRITERIA_SUGGESTIONS = [
  'Code Quality',
  'Problem Solving',
  'Communication',
  'Consistency & Reliability',
  'Technical Growth',
  'Collaboration',
  'Documentation Habits',
  'Attention to Detail',
  'Adaptability',
  'Independence',
]

export function useEvaluations() {
  const { execute, loading } = useApi()
  // Separate useApi() instance — a distinct loading flag, so suggesting
  // criteria doesn't make the unrelated "Save Changes" button show "Saving…".
  const { execute: executeSuggestCriteria, loading: suggestingCriteria } = useApi()
  const { toast } = useToast()

  // shallowRef — always replaced wholesale, never mutated in place.
  const evaluations = shallowRef<Evaluation[]>([])
  const currentEvaluation = shallowRef<Evaluation | null>(null)
  const criteria = shallowRef<EvaluationCriterion[]>([])
  const suggestedCriteria = shallowRef<string[]>([])
  // Which source the current suggestedCriteria came from — lets the UI be
  // honest about whether these are real AI output or the static fallback.
  const suggestionSource = shallowRef<'ai' | 'static' | null>(null)

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

  // AI-suggested criteria names — existingNames is sent so the model suggests
  // NEW ones instead of repeating what's already in the draft list.
  async function suggestCriteria(existingNames: string[]) {
    const result = await executeSuggestCriteria<{ criteria: string[] }>(
      () => aiService.suggestEvaluationCriteria(existingNames),
      { showErrorToast: false },
    )

    if (result.data) {
      suggestedCriteria.value = result.data.criteria
      suggestionSource.value = 'ai'
    } else {
      // Edge Function unreachable — fall back to a static list rather than
      // surfacing an error for a "nice to have" suggestion feature. Starts
      // using the real AI response transparently once the function is live.
      suggestedCriteria.value = STATIC_CRITERIA_SUGGESTIONS
        .filter((name) => !existingNames.includes(name))
        .slice(0, 5)
      suggestionSource.value = 'static'
    }

    return result
  }

  function dismissSuggestion(name: string) {
    suggestedCriteria.value = suggestedCriteria.value.filter((c) => c !== name)
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
    suggestedCriteria,
    suggestionSource,
    suggestingCriteria,
    loading,
    fetchCriteria,
    saveCriteria,
    suggestCriteria,
    dismissSuggestion,
    fetchAllEvaluations,
    fetchEvaluationForTrainee,
    submitEvaluation,
  }
}
