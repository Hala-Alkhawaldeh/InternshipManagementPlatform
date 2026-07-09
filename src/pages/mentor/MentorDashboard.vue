<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAutoAnimate } from '@formkit/auto-animate/vue'
import { Plus, ArrowLeft, CheckSquare, Clock, AlertCircle } from '@/lib/icons'
import TaskCard from '@/components/tasks/TaskCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useTasks } from '@/composables/useTasks'
import { useProfiles } from '@/composables/useProfiles'
import { useAuthStore } from '@/stores/auth.store'
import { TaskStatus } from '@/enums/status.enum'
import { Track, TrackLabel, TrackColor } from '@/enums/tracks.enum'
import type { Profile } from '@/types/app.types'
import type { TaskStatus as TS } from '@/enums/status.enum'

const authStore = useAuthStore()
const { tasks, fetchTasks, updateStatus, createTask, loading: tasksLoading } = useTasks()
const { myTrainees, fetchMyTrainees, loading: profilesLoading } = useProfiles()

const loading = computed(() => tasksLoading.value || profilesLoading.value)

// ── View state ───────────────────────────────────────────────
const selectedTrainee = ref<Profile | null>(null)

const selectedTraineeTasks = computed(() =>
  selectedTrainee.value
    ? tasks.value.filter(t => t.assigned_to === selectedTrainee.value?.user_id)
    : [],
)

// ── Trainees overview (Story 3.4) ────────────────────────────
function statusCountsFor(trainee: Profile) {
  const traineesTasks = tasks.value.filter(t => t.assigned_to === trainee.user_id)
  const counts = { todo: 0, in_progress: 0, done: 0, accepted: 0 }
  for (const t of traineesTasks) {
    const s = t.progress[0]?.status as TS | undefined
    if (s && s in counts) counts[s as keyof typeof counts]++
  }
  return counts
}

// ── New Task dialog (Story 3.1) ──────────────────────────────
const showNewTask = ref(false)
const taskForm = ref({ title: '', description: '', assignedTo: '' })

async function submitNewTask() {
  if (!authStore.user?.id) return
  const result = await createTask({
    title: taskForm.value.title,
    description: taskForm.value.description || null,
    createdBy: authStore.user!.id,
    assignedTo: taskForm.value.assignedTo,
  })
  if (!result.error) {
    showNewTask.value = false
    taskForm.value = { title: '', description: '', assignedTo: '' }
  }
}

function openNewTask(traineeUserId?: string) {
  taskForm.value = { title: '', description: '', assignedTo: traineeUserId ?? '' }
  showNewTask.value = true
}

// ── Status update (Story 3.3) ────────────────────────────────
async function handleStatusChange(progressId: string, status: TS) {
  const task = tasks.value.find(t => t.progress[0]?.id === progressId)
  if (task) await updateStatus(progressId, status, task.title)
}

// ── Helpers ──────────────────────────────────────────────────
function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const trackHex: Record<Track, string> = {
  [Track.Frontend]: '#6366f1', [Track.Backend]: '#3b82f6',
  [Track.QA]: '#0d9488', [Track.DevOps]: '#f97316',
}

function avatarBg(profile: Profile) {
  return profile.track ? (trackHex[profile.track as Track] ?? '#64748b') : '#64748b'
}

// ── Init ─────────────────────────────────────────────────────
onMounted(async () => {
  await fetchMyTrainees()
  await fetchTasks()
})

const [taskListRef] = useAutoAnimate<HTMLElement>()
</script>

<template>
  <div class="min-h-full bg-[#f7f8fc]">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200/80 px-6 py-5 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button
          v-if="selectedTrainee"
          class="p-1.5 -ml-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          @click="selectedTrainee = null"
        >
          <ArrowLeft :size="18" />
        </button>
        <div>
          <h1 class="text-gray-900 text-xl font-semibold">
            {{ selectedTrainee ? selectedTrainee.full_name : 'My Dashboard' }}
          </h1>
          <p class="text-gray-400 text-sm mt-0.5">
            {{ selectedTrainee ? 'Task progress' : `${myTrainees.length} trainee${myTrainees.length !== 1 ? 's' : ''} assigned` }}
          </p>
        </div>
      </div>
      <button
        class="flex items-center gap-1.5 bg-[#0c0e12] text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-[#1a1d24] transition-colors active:scale-95"
        @click="openNewTask(selectedTrainee?.user_id)"
      >
        <Plus :size="15" />
        New Task
      </button>
    </div>

    <div class="px-6 py-6 max-w-5xl mx-auto">

      <!-- ── TRAINEE DETAIL VIEW ─────────────────────────── -->
      <template v-if="selectedTrainee">
        <!-- Loading -->
        <div v-if="loading" class="space-y-3">
          <div v-for="i in 3" :key="i" class="bg-white rounded-xl border border-gray-200/80 p-4 animate-pulse h-20" />
        </div>

        <!-- Empty -->
        <EmptyState
          v-else-if="!selectedTraineeTasks.length"
          :icon="CheckSquare"
          title="No tasks yet"
          :description="`Create the first task for ${selectedTrainee.full_name}`"
          icon-bg-class="bg-indigo-50"
          icon-class="text-indigo-400"
        >
          <button class="mt-4 flex items-center gap-1.5 bg-[#0c0e12] text-white text-xs font-medium px-3 py-2 rounded-lg hover:bg-[#1a1d24] transition-colors" @click="openNewTask(selectedTrainee?.user_id)">
            <Plus :size="13" /> Add task
          </button>
        </EmptyState>

        <!-- Task list -->
        <div v-else ref="taskListRef" class="space-y-3">
          <TaskCard
            v-for="task in selectedTraineeTasks"
            :key="task.id"
            :task="task"
            :is-mentor="true"
            :updating="tasksLoading"
            @status-change="handleStatusChange"
          />
        </div>
      </template>

      <!-- ── TRAINEES OVERVIEW (Story 3.4) ──────────────── -->
      <template v-else>
        <!-- Loading -->
        <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="i in 3" :key="i" class="bg-white rounded-xl border border-gray-200/80 p-4 animate-pulse h-36" />
        </div>

        <!-- Empty -->
        <EmptyState
          v-else-if="!myTrainees.length"
          :icon="AlertCircle"
          title="No trainees assigned yet"
          description="Contact your admin to get trainees assigned to you"
          icon-bg-class="bg-indigo-50"
          icon-class="text-indigo-400"
        />

        <!-- Trainee cards -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="trainee in myTrainees"
            :key="trainee.id"
            class="bg-white rounded-xl border border-gray-200/80 p-4 cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all duration-150 group"
            @click="selectedTrainee = trainee"
          >
            <!-- Trainee info -->
            <div class="flex items-center gap-3 mb-4">
              <div
                class="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                :style="{ backgroundColor: avatarBg(trainee) }"
              >
                {{ initials(trainee.full_name) }}
              </div>
              <div class="min-w-0">
                <p class="text-gray-900 text-sm font-medium truncate group-hover:text-indigo-600 transition-colors">
                  {{ trainee.full_name }}
                </p>
                <span
                  v-if="trainee.track"
                  :class="['inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5', TrackColor[trainee.track as Track]]"
                >
                  {{ TrackLabel[trainee.track as Track] }}
                </span>
              </div>
            </div>

            <!-- Status counts -->
            <div class="grid grid-cols-4 gap-1">
              <div
                v-for="[status, label, color] in [
                  [TaskStatus.Todo, 'To Do', 'text-gray-500 bg-gray-50'],
                  [TaskStatus.InProgress, 'Active', 'text-blue-600 bg-blue-50'],
                  [TaskStatus.Done, 'Done', 'text-amber-600 bg-amber-50'],
                  [TaskStatus.Accepted, 'OK', 'text-green-600 bg-green-50'],
                ]"
                :key="status as string"
                :class="['rounded-md p-1.5 text-center', color as string]"
              >
                <p class="text-base font-bold leading-none">
                  {{ statusCountsFor(trainee)[status as TS] }}
                </p>
                <p class="text-[9px] mt-0.5 opacity-75">{{ label }}</p>
              </div>
            </div>

            <!-- Flag: tasks awaiting acceptance -->
            <div
              v-if="statusCountsFor(trainee).done > 0"
              class="mt-3 flex items-center gap-1.5 text-amber-600 text-[11px] font-medium"
            >
              <Clock :size="11" />
              {{ statusCountsFor(trainee).done }} awaiting acceptance
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- ── NEW TASK DIALOG ────────────────────────────────── -->
    <Teleport to="body">
    <Transition name="dialog-backdrop">
      <div
        v-if="showNewTask"
        class="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
        @click.self="showNewTask = false"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md" style="box-shadow:0 25px 50px rgba(0,0,0,0.2)">
          <div class="px-6 pt-6 pb-4 border-b border-gray-100">
            <h2 class="text-gray-900 text-base font-semibold">New Task</h2>
            <p class="text-gray-400 text-sm mt-0.5">Create and assign a task to a trainee</p>
          </div>
          <form class="px-6 py-5 space-y-4" @submit.prevent="submitNewTask">
            <div>
              <label class="field-label">Title</label>
              <input v-model="taskForm.title" type="text" required placeholder="Build the login page" class="field-input" />
            </div>
            <div>
              <label class="field-label">Description <span class="normal-case font-normal text-gray-300">(optional)</span></label>
              <textarea
                v-model="taskForm.description"
                rows="3"
                placeholder="What should be done and how…"
                class="field-input resize-none"
              />
            </div>
            <div>
              <label class="field-label">Assign To</label>
              <select v-model="taskForm.assignedTo" required class="field-input appearance-none">
                <option value="" disabled>Select a trainee</option>
                <option v-for="t in myTrainees" :key="t.id" :value="t.user_id">
                  {{ t.full_name }}
                </option>
              </select>
            </div>
            <div class="flex gap-2 pt-1">
              <button type="button" class="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors" @click="showNewTask = false">
                Cancel
              </button>
              <button type="submit" :disabled="tasksLoading" class="flex-1 py-2.5 rounded-lg bg-[#0c0e12] text-white text-sm font-medium hover:bg-[#1a1d24] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                <span v-if="tasksLoading" class="btn-spinner" />
                {{ tasksLoading ? 'Creating…' : 'Create Task' }}
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
.field-label { @apply block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5; }
.field-input { @apply w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50/80 text-sm text-gray-900 placeholder:text-gray-300 outline-none transition-all duration-150 focus:border-indigo-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(129,140,248,0.12)]; }
.dialog-backdrop-enter-active, .dialog-backdrop-leave-active { transition: opacity 0.2s ease; }
.dialog-backdrop-enter-from, .dialog-backdrop-leave-to { opacity: 0; }
.btn-spinner { display: inline-block; width: 13px; height: 13px; border: 1.5px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.65s linear infinite; flex-shrink: 0; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
