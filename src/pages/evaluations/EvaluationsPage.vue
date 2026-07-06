<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Trash2, ChevronUp, ChevronDown, ChevronRight } from 'lucide-vue-next'
import { useEvaluations } from '@/composables/useEvaluations'
import { useProfiles } from '@/composables/useProfiles'
import { useAuthStore } from '@/stores/auth.store'
import { Track, TrackLabel, TrackColor } from '@/enums/tracks.enum'
import type { EvaluationCriterion, EvaluationScore, Profile, Evaluation } from '@/types/app.types'

const authStore = useAuthStore()
const { criteria, evaluations, currentEvaluation, loading, fetchCriteria, saveCriteria, fetchAllEvaluations, fetchEvaluationForTrainee, submitEvaluation } = useEvaluations()
const { myTrainees, trainees: allTrainees, fetchMyTrainees, fetchTrainees } = useProfiles()

const isAdmin = computed(() => authStore.isAdmin)
const isMentor = computed(() => authStore.isMentor)

type Tab = 'criteria' | 'score' | 'results'
const activeTab = ref<Tab>(isAdmin.value ? 'criteria' : 'score')

// ── Story 4.1 — Criteria ──────────────────────────────────────
const draftCriteria = ref<EvaluationCriterion[]>([])
const newCriterionName = ref('')
const criteriaChanged = ref(false)

function initDraft() {
  draftCriteria.value = criteria.value.map(c => ({ ...c }))
  criteriaChanged.value = false
}

function addCriterion() {
  const name = newCriterionName.value.trim()
  if (!name) return
  draftCriteria.value.push({
    id: crypto.randomUUID(),
    name,
    order: draftCriteria.value.length,
  })
  newCriterionName.value = ''
  criteriaChanged.value = true
}

function removeCriterion(index: number) {
  draftCriteria.value.splice(index, 1)
  renumberOrder()
  criteriaChanged.value = true
}

function moveUp(index: number) {
  if (index === 0) return
  const arr = draftCriteria.value
  ;[arr[index - 1], arr[index]] = [arr[index], arr[index - 1]]
  renumberOrder()
  criteriaChanged.value = true
}

function moveDown(index: number) {
  const arr = draftCriteria.value
  if (index === arr.length - 1) return
  ;[arr[index], arr[index + 1]] = [arr[index + 1], arr[index]]
  renumberOrder()
  criteriaChanged.value = true
}

function renumberOrder() {
  draftCriteria.value.forEach((c, i) => (c.order = i))
}

async function handleSaveCriteria() {
  await saveCriteria(draftCriteria.value)
  criteriaChanged.value = false
}

// ── Story 4.2 — Score a Trainee ───────────────────────────────
const selectedTraineeId = ref('')
const scores = ref<EvaluationScore[]>([])
const loadingEval = ref(false)

const scoreableTrainees = computed(() =>
  isMentor.value ? myTrainees.value : allTrainees.value,
)

const selectedTrainee = computed<Profile | undefined>(() =>
  scoreableTrainees.value.find(t => t.user_id === selectedTraineeId.value),
)

async function onTraineeSelect() {
  if (!selectedTraineeId.value) return
  loadingEval.value = true
  await fetchEvaluationForTrainee(selectedTraineeId.value)
  loadingEval.value = false

  scores.value = criteria.value.map(c => {
    const existing = currentEvaluation.value
      ? (currentEvaluation.value.scores as unknown as EvaluationScore[]).find(s => s.criterionId === c.id)
      : undefined
    return { criterionId: c.id, score: existing?.score ?? 0, note: existing?.note ?? '' }
  })
}

function clampScore(index: number, val: number) {
  scores.value[index].score = Math.max(0, Math.min(7, Math.round(val)))
}

async function handleSubmitEvaluation() {
  if (!authStore.user?.id || !selectedTraineeId.value || !selectedTrainee.value) return
  await submitEvaluation({
    traineeId: selectedTraineeId.value,
    mentorId: authStore.user.id,
    criteria: criteria.value,
    scores: scores.value,
    traineeName: selectedTrainee.value.full_name,
  })
  await fetchAllEvaluations()
}

// ── Story 4.3 — Results ───────────────────────────────────────
const expandedTraineeId = ref<string | null>(null)

const resultRows = computed(() => {
  const profileList = isAdmin.value ? allTrainees.value : myTrainees.value
  return profileList.map(trainee => {
    const eval_ = evaluations.value.find(e => e.trainee_id === trainee.user_id) as (Evaluation & { average_score: number | null }) | undefined
    return { trainee, evaluation: eval_ ?? null }
  })
})

function scoreColor(avg: number | null) {
  if (avg === null) return 'text-gray-400'
  if (avg <= 3) return 'text-rose-600'
  if (avg <= 5) return 'text-amber-600'
  return 'text-green-600'
}

function scoreBg(avg: number | null) {
  if (avg === null) return 'bg-gray-50 border-gray-200'
  if (avg <= 3) return 'bg-rose-50 border-rose-200'
  if (avg <= 5) return 'bg-amber-50 border-amber-200'
  return 'bg-green-50 border-green-200'
}

function getScoreForCriterion(evaluation: Evaluation, criterionId: string): number | null {
  const sc = (evaluation.scores as unknown as EvaluationScore[]).find(s => s.criterionId === criterionId)
  return sc?.score ?? null
}

// ── Init ──────────────────────────────────────────────────────
onMounted(async () => {
  await fetchCriteria()
  initDraft()
  await fetchAllEvaluations()
  if (isMentor.value) await fetchMyTrainees()
  if (isAdmin.value) await fetchTrainees()
})
</script>

<template>
  <div class="min-h-full bg-[#f7f8fc]">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200/80 px-6 py-5">
      <h1 class="text-gray-900 text-xl font-semibold">Evaluations</h1>
      <p class="text-gray-400 text-sm mt-0.5">End-of-program trainee assessment</p>
    </div>

    <div class="px-6 py-6 max-w-4xl mx-auto">
      <!-- Tabs -->
      <div class="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-6">
        <button
          v-if="isAdmin"
          :class="['px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150', activeTab === 'criteria' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700']"
          @click="activeTab = 'criteria'"
        >Criteria</button>
        <button
          v-if="isMentor || isAdmin"
          :class="['px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150', activeTab === 'score' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700']"
          @click="activeTab = 'score'"
        >Score Trainee</button>
        <button
          :class="['px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150', activeTab === 'results' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700']"
          @click="activeTab = 'results'"
        >Results</button>
      </div>

      <!-- ── CRITERIA TAB (Story 4.1) ───────────────────── -->
      <div v-if="activeTab === 'criteria'">
        <div class="bg-white rounded-2xl border border-gray-200/80 p-6">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h2 class="text-gray-900 font-semibold text-base">Evaluation Criteria</h2>
              <p class="text-gray-400 text-sm mt-0.5">Define what mentors will score trainees on (0–7 each)</p>
            </div>
            <button
              v-if="criteriaChanged"
              :disabled="loading"
              class="flex items-center gap-1.5 bg-[#0c0e12] text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-[#1a1d24] transition-colors disabled:opacity-50"
              @click="handleSaveCriteria"
            >
              {{ loading ? 'Saving…' : 'Save Changes' }}
            </button>
          </div>

          <!-- Empty state -->
          <div v-if="!draftCriteria.length" class="text-center py-10 text-gray-400 text-sm">
            No criteria yet — add the first one below
          </div>

          <!-- Criteria list -->
          <div v-else class="space-y-2 mb-5">
            <div
              v-for="(criterion, i) in draftCriteria"
              :key="criterion.id"
              class="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 group"
            >
              <span class="text-gray-300 text-sm font-mono w-5 shrink-0">{{ i + 1 }}</span>
              <span class="flex-1 text-gray-800 text-sm font-medium">{{ criterion.name }}</span>
              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="p-1 rounded text-gray-300 hover:text-gray-600 disabled:opacity-30 transition-colors" :disabled="i === 0" @click="moveUp(i)">
                  <ChevronUp :size="14" />
                </button>
                <button class="p-1 rounded text-gray-300 hover:text-gray-600 disabled:opacity-30 transition-colors" :disabled="i === draftCriteria.length - 1" @click="moveDown(i)">
                  <ChevronDown :size="14" />
                </button>
                <button class="p-1 rounded text-gray-300 hover:text-rose-500 transition-colors ml-1" @click="removeCriterion(i)">
                  <Trash2 :size="14" />
                </button>
              </div>
            </div>
          </div>

          <!-- Add criterion -->
          <div class="flex gap-2">
            <input
              v-model="newCriterionName"
              type="text"
              placeholder="e.g. Technical Skills"
              class="flex-1 px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50/80 text-sm text-gray-900 placeholder:text-gray-300 outline-none transition-all duration-150 focus:border-indigo-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(129,140,248,0.12)]"
              @keydown.enter.prevent="addCriterion"
            />
            <button
              class="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-dashed border-gray-300 text-gray-500 text-sm hover:border-indigo-400 hover:text-indigo-600 transition-colors"
              @click="addCriterion"
            >
              <Plus :size="14" /> Add
            </button>
          </div>
        </div>
      </div>

      <!-- ── SCORE TAB (Story 4.2) ──────────────────────── -->
      <div v-if="activeTab === 'score'">
        <div class="bg-white rounded-2xl border border-gray-200/80 p-6">
          <h2 class="text-gray-900 font-semibold text-base mb-1">Score a Trainee</h2>
          <p class="text-gray-400 text-sm mb-5">Each criterion is scored 0 (lowest) to 7 (highest)</p>

          <!-- No criteria warning -->
          <div v-if="!criteria.length" class="py-10 text-center">
            <p class="text-gray-500 text-sm">No criteria configured yet.</p>
            <p v-if="isAdmin" class="text-gray-400 text-xs mt-1">Go to the Criteria tab to add some first.</p>
          </div>

          <template v-else>
            <!-- Trainee selector -->
            <div class="mb-6">
              <label class="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Trainee</label>
              <select
                v-model="selectedTraineeId"
                class="w-full max-w-sm px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50/80 text-sm text-gray-900 outline-none transition-all duration-150 focus:border-indigo-400 focus:bg-white appearance-none"
                @change="onTraineeSelect"
              >
                <option value="" disabled>Select a trainee</option>
                <option v-for="t in scoreableTrainees" :key="t.id" :value="t.user_id">
                  {{ t.full_name }}
                </option>
              </select>
            </div>

            <!-- Scoring form -->
            <template v-if="selectedTraineeId && scores.length">
              <div class="space-y-4 mb-6">
                <div
                  v-for="(criterion, i) in criteria"
                  :key="criterion.id"
                  class="flex items-start gap-4 p-4 rounded-xl bg-gray-50/70 border border-gray-100"
                >
                  <div class="flex-1 min-w-0">
                    <p class="text-gray-800 text-sm font-medium">{{ criterion.name }}</p>
                    <input
                      v-if="scores[i]"
                      v-model="scores[i].note"
                      type="text"
                      placeholder="Optional note…"
                      class="mt-2 w-full text-xs text-gray-600 bg-transparent border-b border-gray-200 outline-none focus:border-indigo-400 py-0.5 placeholder:text-gray-300 transition-colors"
                    />
                  </div>
                  <!-- Score input 0-7 -->
                  <div v-if="scores[i]" class="shrink-0 flex items-center gap-2">
                    <button class="w-7 h-7 rounded-full border border-gray-200 text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors text-sm flex items-center justify-center" @click="clampScore(i, scores[i].score - 1)">−</button>
                    <span :class="['w-8 text-center text-lg font-bold', scores[i].score <= 3 ? 'text-rose-500' : scores[i].score <= 5 ? 'text-amber-500' : 'text-green-600']">
                      {{ scores[i].score }}
                    </span>
                    <button class="w-7 h-7 rounded-full border border-gray-200 text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors text-sm flex items-center justify-center" @click="clampScore(i, scores[i].score + 1)">+</button>
                  </div>
                </div>
              </div>

              <!-- Average preview -->
              <div class="flex items-center justify-between mb-5">
                <div class="text-sm text-gray-500">
                  Average: <span :class="['font-semibold text-base', scoreColor(scores.length ? scores.reduce((s,x) => s + x.score, 0) / scores.length : null)]">
                    {{ scores.length ? (scores.reduce((s, x) => s + x.score, 0) / scores.length).toFixed(2) : '—' }}
                  </span> / 7
                </div>
                <button
                  :disabled="loading"
                  class="flex items-center gap-1.5 bg-[#0c0e12] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#1a1d24] transition-colors disabled:opacity-50 flex items-center gap-2"
                  @click="handleSubmitEvaluation"
                >
                  <span v-if="loading" class="btn-spinner" />
                  {{ currentEvaluation ? 'Update Evaluation' : 'Submit Evaluation' }}
                </button>
              </div>
            </template>
          </template>
        </div>
      </div>

      <!-- ── RESULTS TAB (Story 4.3) ─────────────────────── -->
      <div v-if="activeTab === 'results'">
        <div class="bg-white rounded-2xl border border-gray-200/80 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100">
            <h2 class="text-gray-900 font-semibold text-base">Evaluation Results</h2>
          </div>

          <div v-if="!resultRows.length" class="py-16 text-center text-gray-400 text-sm">
            No trainees found
          </div>

          <div v-else>
            <div
              v-for="row in resultRows"
              :key="row.trainee.id"
              class="border-b border-gray-100 last:border-none"
            >
              <!-- Row header -->
              <div
                class="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-50/60 transition-colors"
                @click="expandedTraineeId = expandedTraineeId === row.trainee.id ? null : row.trainee.id"
              >
                <!-- Avatar -->
                <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-semibold shrink-0">
                  {{ row.trainee.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) }}
                </div>

                <!-- Name + track -->
                <div class="flex-1 min-w-0">
                  <p class="text-gray-900 text-sm font-medium truncate">{{ row.trainee.full_name }}</p>
                  <span
                    v-if="row.trainee.track"
                    :class="['text-[10px] font-medium px-1.5 py-0.5 rounded-full', TrackColor[row.trainee.track as Track]]"
                  >
                    {{ TrackLabel[row.trainee.track as Track] }}
                  </span>
                </div>

                <!-- Score badge -->
                <div v-if="row.evaluation" :class="['border rounded-lg px-3 py-1 text-center min-w-[56px]', scoreBg(row.evaluation.average_score)]">
                  <span :class="['text-lg font-bold', scoreColor(row.evaluation.average_score)]">
                    {{ row.evaluation.average_score?.toFixed(1) }}
                  </span>
                  <span class="text-gray-400 text-xs"> /7</span>
                </div>
                <div v-else class="border border-dashed border-gray-200 rounded-lg px-3 py-1 min-w-[56px] text-center">
                  <span class="text-gray-300 text-sm">—</span>
                  <p class="text-gray-300 text-[10px]">Pending</p>
                </div>

                <ChevronRight
                  :size="15"
                  :class="['text-gray-300 transition-transform duration-200', expandedTraineeId === row.trainee.id ? 'rotate-90' : '']"
                />
              </div>

              <!-- Criterion breakdown -->
              <div v-if="expandedTraineeId === row.trainee.id && row.evaluation" class="px-6 pb-4 pt-1">
                <div class="bg-gray-50 rounded-xl p-4 space-y-2.5">
                  <div
                    v-for="criterion in (row.evaluation.criteria as unknown as EvaluationCriterion[])"
                    :key="criterion.id"
                    class="flex items-center justify-between gap-4"
                  >
                    <span class="text-gray-600 text-sm">{{ criterion.name }}</span>
                    <div class="flex items-center gap-2">
                      <div class="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          class="h-full rounded-full transition-all duration-500"
                          :class="(getScoreForCriterion(row.evaluation!, criterion.id) ?? 0) <= 3 ? 'bg-rose-400' : (getScoreForCriterion(row.evaluation!, criterion.id) ?? 0) <= 5 ? 'bg-amber-400' : 'bg-green-500'"
                          :style="{ width: `${((getScoreForCriterion(row.evaluation!, criterion.id) ?? 0) / 7) * 100}%` }"
                        />
                      </div>
                      <span :class="['text-sm font-semibold w-4 text-right', scoreColor(getScoreForCriterion(row.evaluation!, criterion.id))]">
                        {{ getScoreForCriterion(row.evaluation!, criterion.id) ?? '—' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else-if="expandedTraineeId === row.trainee.id && !row.evaluation" class="px-6 pb-4">
                <p class="text-gray-400 text-sm">No evaluation submitted yet.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.btn-spinner {
  display: inline-block; width: 13px; height: 13px;
  border: 1.5px solid rgba(255,255,255,0.3); border-top-color: white;
  border-radius: 50%; animation: spin 0.65s linear infinite; flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
