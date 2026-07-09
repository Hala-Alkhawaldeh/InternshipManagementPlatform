<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Users, GraduationCap, Eye, EyeOff, ChevronDown } from '@/lib/icons'
import { useProfiles } from '@/composables/useProfiles'
import { useApi } from '@/composables/useApi'
import { adminService } from '@/services/admin.service'
import { Track, TrackLabel, TrackColor } from '@/enums/tracks.enum'
import type { Profile } from '@/types/app.types'

// ── Data ────────────────────────────────────────────────────────
const { mentors, trainees, fetchMentors, fetchTrainees, loading, reassignMentor } = useProfiles()
const { execute, loading: submitting } = useApi()

const activeTab = ref<'mentors' | 'trainees'>('mentors')

onMounted(() => {
  fetchMentors()
  fetchTrainees()
})

// ── Add mentor dialog ────────────────────────────────────────────
const showAddMentor = ref(false)
const showMentorPassword = ref(false)
const mentorForm = ref({ full_name: '', email: '', track: '' as Track | '', password: '' })

async function submitAddMentor() {
  const result = await execute<Profile>(() =>
    adminService.createUser({
      email: mentorForm.value.email,
      password: mentorForm.value.password,
      full_name: mentorForm.value.full_name,
      role: 'mentor',
      track: (mentorForm.value.track as Track) || null,
    }),
  )
  if (!result.error) {
    showAddMentor.value = false
    mentorForm.value = { full_name: '', email: '', track: '', password: '' }
    await fetchMentors()
  }
}

function openAddMentor() {
  mentorForm.value = { full_name: '', email: '', track: '', password: '' }
  showMentorPassword.value = false
  showAddMentor.value = true
}

// ── Add trainee dialog ───────────────────────────────────────────
const showAddTrainee = ref(false)
const showTraineePassword = ref(false)
const traineeForm = ref({
  full_name: '',
  email: '',
  track: '' as Track | '',
  mentor_id: '',
  password: '',
})

// Mentors filtered to the selected track (or all if no track yet)
const eligibleMentors = computed(() =>
  traineeForm.value.track
    ? mentors.value.filter((m) => m.track === traineeForm.value.track)
    : mentors.value,
)

function onTraineeTrackChange() {
  // Clear mentor selection if they change track
  traineeForm.value.mentor_id = ''
}

async function submitAddTrainee() {
  const selectedMentor = mentors.value.find((m) => m.id === traineeForm.value.mentor_id)
  const result = await execute<Profile>(() =>
    adminService.createUser({
      email: traineeForm.value.email,
      password: traineeForm.value.password,
      full_name: traineeForm.value.full_name,
      role: 'trainee',
      track: (traineeForm.value.track as Track) || null,
      mentor_id: selectedMentor?.user_id ?? null,
    }),
  )
  if (!result.error) {
    showAddTrainee.value = false
    traineeForm.value = { full_name: '', email: '', track: '', mentor_id: '', password: '' }
    await fetchTrainees()
  }
}

function openAddTrainee() {
  traineeForm.value = { full_name: '', email: '', track: '', mentor_id: '', password: '' }
  showTraineePassword.value = false
  showAddTrainee.value = true
}

// ── Reassign mentor ──────────────────────────────────────────────
const reassigningId = ref<string | null>(null)

async function handleReassign(traineeId: string, newMentorUserId: string) {
  // Find the mentor profile whose user_id matches
  const mentor = mentors.value.find((m) => m.user_id === newMentorUserId)
  if (!mentor) return
  reassigningId.value = traineeId
  await reassignMentor(traineeId, mentor.user_id)
  reassigningId.value = null
  await fetchTrainees()
}

// ── Helpers ──────────────────────────────────────────────────────
const trackOptions = (Object.keys(TrackLabel) as Track[]).map((v) => ({
  value: v,
  label: TrackLabel[v],
}))

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const trackHex: Record<Track, string> = {
  [Track.Frontend]: '#6366f1',
  [Track.Backend]: '#3b82f6',
  [Track.QA]: '#0d9488',
  [Track.DevOps]: '#f97316',
}

function avatarBg(profile: Profile) {
  return profile.track ? (trackHex[profile.track as Track] ?? '#64748b') : '#64748b'
}
</script>

<template>
  <div class="min-h-full bg-[#f7f8fc]">
    <!-- Page header -->
    <div class="bg-white border-b border-gray-200/80 px-6 py-5">
      <h1 class="text-gray-900 text-xl font-semibold">Admin Dashboard</h1>
      <p class="text-gray-400 text-sm mt-0.5">Manage mentors, trainees and program settings</p>
    </div>

    <div class="px-6 py-6 max-w-6xl mx-auto">
      <!-- Stat chips -->
      <div class="flex gap-3 mb-6">
        <div class="flex items-center gap-2 bg-white border border-gray-200/80 rounded-lg px-3.5 py-2 text-sm">
          <Users :size="15" class="text-indigo-500" />
          <span class="text-gray-600 font-medium">{{ mentors.length }}</span>
          <span class="text-gray-400">mentor{{ mentors.length !== 1 ? 's' : '' }}</span>
        </div>
        <div class="flex items-center gap-2 bg-white border border-gray-200/80 rounded-lg px-3.5 py-2 text-sm">
          <GraduationCap :size="15" class="text-teal-500" />
          <span class="text-gray-600 font-medium">{{ trainees.length }}</span>
          <span class="text-gray-400">trainee{{ trainees.length !== 1 ? 's' : '' }}</span>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-6">
        <button
          v-for="tab in ['mentors', 'trainees'] as const"
          :key="tab"
          :class="[
            'px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150 capitalize',
            activeTab === tab
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700',
          ]"
          @click="activeTab = tab"
        >
          {{ tab }}
        </button>
      </div>

      <!-- ── MENTORS TAB ─────────────────────────────────────── -->
      <div v-if="activeTab === 'mentors'">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-gray-700 text-sm font-medium">All Mentors</h2>
          <button
            class="flex items-center gap-1.5 bg-[#0c0e12] text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-[#1a1d24] transition-colors active:scale-95"
            @click="openAddMentor"
          >
            <Plus :size="15" />
            Add Mentor
          </button>
        </div>

        <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="i in 3" :key="i" class="bg-white rounded-xl border border-gray-200/80 p-4 animate-pulse h-24" />
        </div>

        <div v-else-if="!mentors.length" class="flex flex-col items-center justify-center py-16 text-center">
          <div class="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-3">
            <Users :size="22" class="text-indigo-400" />
          </div>
          <p class="text-gray-700 font-medium text-sm">No mentors yet</p>
          <p class="text-gray-400 text-sm mt-1">Add your first mentor to get started</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="mentor in mentors"
            :key="mentor.id"
            class="bg-white rounded-xl border border-gray-200/80 p-4 flex items-start gap-3 hover:border-gray-300 transition-colors"
          >
            <div
              class="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
              :style="{ backgroundColor: avatarBg(mentor) }"
            >
              {{ initials(mentor.full_name) }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-gray-900 text-sm font-medium truncate">{{ mentor.full_name }}</p>
              <p class="text-gray-400 text-xs truncate mt-0.5">{{ mentor.email }}</p>
              <span
                v-if="mentor.track"
                :class="['inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full', TrackColor[mentor.track as Track]]"
              >
                {{ TrackLabel[mentor.track as Track] }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── TRAINEES TAB ────────────────────────────────────── -->
      <div v-if="activeTab === 'trainees'">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-gray-700 text-sm font-medium">All Trainees</h2>
          <button
            class="flex items-center gap-1.5 bg-[#0c0e12] text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-[#1a1d24] transition-colors active:scale-95"
            @click="openAddTrainee"
          >
            <Plus :size="15" />
            Add Trainee
          </button>
        </div>

        <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="i in 3" :key="i" class="bg-white rounded-xl border border-gray-200/80 p-4 animate-pulse h-28" />
        </div>

        <div v-else-if="!trainees.length" class="flex flex-col items-center justify-center py-16 text-center">
          <div class="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-3">
            <GraduationCap :size="22" class="text-teal-400" />
          </div>
          <p class="text-gray-700 font-medium text-sm">No trainees yet</p>
          <p class="text-gray-400 text-sm mt-1">Add your first trainee and assign them a mentor</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="trainee in trainees"
            :key="trainee.id"
            class="bg-white rounded-xl border border-gray-200/80 p-4 hover:border-gray-300 transition-colors"
          >
            <div class="flex items-start gap-3 mb-3">
              <div
                class="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                :style="{ backgroundColor: avatarBg(trainee) }"
              >
                {{ initials(trainee.full_name) }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-gray-900 text-sm font-medium truncate">{{ trainee.full_name }}</p>
                <p class="text-gray-400 text-xs truncate mt-0.5">{{ trainee.email }}</p>
                <span
                  v-if="trainee.track"
                  :class="['inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full', TrackColor[trainee.track as Track]]"
                >
                  {{ TrackLabel[trainee.track as Track] }}
                </span>
              </div>
            </div>

            <!-- Mentor assignment -->
            <div class="border-t border-gray-100 pt-3">
              <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Mentor</p>
              <div class="relative">
                <select
                  :value="trainee.mentor_id ?? ''"
                  :disabled="reassigningId === trainee.id"
                  class="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5 pr-7 outline-none appearance-none focus:border-indigo-400 transition-colors disabled:opacity-50 cursor-pointer"
                  @change="handleReassign(trainee.id, ($event.target as HTMLSelectElement).value)"
                >
                  <option value="" disabled>Unassigned</option>
                  <option
                    v-for="m in mentors.filter(m => !trainee.track || m.track === trainee.track)"
                    :key="m.id"
                    :value="m.user_id"
                  >
                    {{ m.full_name }}
                  </option>
                </select>
                <ChevronDown :size="12" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── ADD MENTOR DIALOG ──────────────────────────────────── -->
    <Teleport to="body">
    <Transition name="dialog-backdrop">
      <div
        v-if="showAddMentor"
        class="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
        @click.self="showAddMentor = false"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md" style="box-shadow:0 25px 50px rgba(0,0,0,0.2)">
          <div class="px-6 pt-6 pb-4 border-b border-gray-100">
            <h2 class="text-gray-900 text-base font-semibold">Add Mentor</h2>
            <p class="text-gray-400 text-sm mt-0.5">Create a new mentor account</p>
          </div>
          <form class="px-6 py-5 space-y-4" @submit.prevent="submitAddMentor">
            <div>
              <label class="field-label">Full Name</label>
              <input v-model="mentorForm.full_name" type="text" required placeholder="Sara Ahmed" class="field-input" />
            </div>
            <div>
              <label class="field-label">Email</label>
              <input v-model="mentorForm.email" type="email" required placeholder="sara@sitech.me" class="field-input" />
            </div>
            <div>
              <label class="field-label">Track</label>
              <select v-model="mentorForm.track" required class="field-input appearance-none">
                <option value="" disabled>Select a track</option>
                <option v-for="opt in trackOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div>
              <label class="field-label">Temporary Password</label>
              <div class="relative">
                <input v-model="mentorForm.password" :type="showMentorPassword ? 'text' : 'password'" required minlength="6" placeholder="Min. 6 characters" class="field-input pr-10" />
                <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors" @click="showMentorPassword = !showMentorPassword">
                  <component :is="showMentorPassword ? EyeOff : Eye" :size="15" />
                </button>
              </div>
            </div>
            <div class="flex gap-2 pt-1">
              <button type="button" class="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors" @click="showAddMentor = false">Cancel</button>
              <button type="submit" :disabled="submitting" class="submit-btn flex-1 py-2.5 rounded-lg bg-[#0c0e12] text-white text-sm font-medium hover:bg-[#1a1d24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <span v-if="submitting" class="btn-spinner" />
                {{ submitting ? 'Creating…' : 'Create Mentor' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── ADD TRAINEE DIALOG ─────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="dialog-backdrop">
      <div
        v-if="showAddTrainee"
        class="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
        @click.self="showAddTrainee = false"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md" style="box-shadow:0 25px 50px rgba(0,0,0,0.2)">
          <div class="px-6 pt-6 pb-4 border-b border-gray-100">
            <h2 class="text-gray-900 text-base font-semibold">Add Trainee</h2>
            <p class="text-gray-400 text-sm mt-0.5">Create a new trainee account and assign a mentor</p>
          </div>
          <form class="px-6 py-5 space-y-4" @submit.prevent="submitAddTrainee">
            <div>
              <label class="field-label">Full Name</label>
              <input v-model="traineeForm.full_name" type="text" required placeholder="Lara Hassan" class="field-input" />
            </div>
            <div>
              <label class="field-label">Email</label>
              <input v-model="traineeForm.email" type="email" required placeholder="lara@sitech.me" class="field-input" />
            </div>
            <div>
              <label class="field-label">Track</label>
              <select v-model="traineeForm.track" required class="field-input appearance-none" @change="onTraineeTrackChange">
                <option value="" disabled>Select a track</option>
                <option v-for="opt in trackOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div>
              <label class="field-label">Assign Mentor</label>
              <select v-model="traineeForm.mentor_id" required class="field-input appearance-none" :disabled="!traineeForm.track">
                <option value="" disabled>{{ traineeForm.track ? 'Select a mentor' : 'Select a track first' }}</option>
                <option v-for="m in eligibleMentors" :key="m.id" :value="m.id">{{ m.full_name }}</option>
              </select>
              <p v-if="traineeForm.track && !eligibleMentors.length" class="text-[11px] text-amber-600 mt-1">
                No mentors on this track yet — add one first.
              </p>
            </div>
            <div>
              <label class="field-label">Temporary Password</label>
              <div class="relative">
                <input v-model="traineeForm.password" :type="showTraineePassword ? 'text' : 'password'" required minlength="6" placeholder="Min. 6 characters" class="field-input pr-10" />
                <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors" @click="showTraineePassword = !showTraineePassword">
                  <component :is="showTraineePassword ? EyeOff : Eye" :size="15" />
                </button>
              </div>
            </div>
            <div class="flex gap-2 pt-1">
              <button type="button" class="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors" @click="showAddTrainee = false">Cancel</button>
              <button type="submit" :disabled="submitting" class="submit-btn flex-1 py-2.5 rounded-lg bg-[#0c0e12] text-white text-sm font-medium hover:bg-[#1a1d24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <span v-if="submitting" class="btn-spinner" />
                {{ submitting ? 'Creating…' : 'Create Trainee' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
  </div>
</template>

<style scoped>
.field-label {
  @apply block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5;
}
.field-input {
  @apply w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50/80 text-sm text-gray-900 placeholder:text-gray-300 outline-none transition-all duration-150 focus:border-indigo-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(129,140,248,0.12)];
}
.dialog-backdrop-enter-active,
.dialog-backdrop-leave-active { transition: opacity 0.2s ease; }
.dialog-backdrop-enter-from,
.dialog-backdrop-leave-to { opacity: 0; }

.btn-spinner {
  display: inline-block;
  width: 13px; height: 13px;
  border: 1.5px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
  flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
