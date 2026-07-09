<script setup lang="ts">
import { computed, ref } from 'vue'
import { Calendar, X, Clock, AlignLeft } from '@/lib/icons'
import StatusDropdown from './StatusDropdown.vue'
import { TaskStatus, TaskStatusLabel } from '@/enums/status.enum'
import type { TaskWithProgress } from '@/types/app.types'

const props = defineProps<{
  task: TaskWithProgress
  isMentor: boolean
  traineeName?: string
  updating?: boolean
}>()

const emit = defineEmits<{
  (e: 'statusChange', progressId: string, status: TaskStatus): void
}>()

const bouncing = ref(false)
const showDetails = ref(false)

// Bold, solid "cover strip" colors — bolder than the pastel TaskStatusColor
// pills used for the dropdown/badges elsewhere, to get the Trello label feel.
const STRIP_COLOR: Record<TaskStatus, string> = {
  [TaskStatus.Todo]: 'bg-slate-400',
  [TaskStatus.InProgress]: 'bg-blue-500',
  [TaskStatus.Done]: 'bg-amber-500',
  [TaskStatus.Accepted]: 'bg-emerald-500',
}

// Deterministic, playful avatar palette — Trello-member-avatar style circles
// picked from the trainee's name so the same person always gets the same color.
const AVATAR_PALETTE = ['#eb5a46', '#0079bf', '#61bd4f', '#ff9f1a', '#c377e0', '#00c2e0', '#ff78cb']

const currentStatus = computed<TaskStatus>(() => (props.task.progress[0]?.status as TaskStatus) ?? props.task.status)
const stripColor = computed(() => STRIP_COLOR[currentStatus.value])

const initials = computed(() =>
  (props.traineeName ?? '')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2),
)

const avatarColor = computed(() => {
  const name = props.traineeName ?? ''
  const hash = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
})

function handleStatusChange(progressId: string, status: TaskStatus) {
  bouncing.value = true
  setTimeout(() => (bouncing.value = false), 400)
  emit('statusChange', progressId, status)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
</script>

<template>
  <div
    :class="['relative bg-white rounded-xl border border-gray-200/70 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.15)] cursor-pointer', bouncing && 'card-bounce']"
    @click="showDetails = true"
  >
    <!-- Trello-style cover strip -->
    <div :class="['h-[7px] w-full', stripColor]" />

    <div class="p-3.5">
      <!-- Label row — the status pill doubles as a Trello label chip -->
      <div class="flex items-center justify-between gap-2 mb-2.5">
        <div @click.stop>
          <StatusDropdown
            v-if="task.progress[0]"
            :current-status="currentStatus"
            :progress-id="task.progress[0].id"
            :is-mentor="isMentor"
            :loading="updating"
            @change="handleStatusChange"
          />
          <span
            v-else
            :class="['inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold', stripColor, 'text-white']"
          >
            {{ TaskStatusLabel[currentStatus] }}
          </span>
        </div>
      </div>

      <p class="text-gray-800 text-[13.5px] font-bold leading-snug">{{ task.title }}</p>
      <p v-if="task.description" class="flex items-start gap-1.5 text-gray-400 text-xs mt-1.5 leading-relaxed">
        <AlignLeft :size="12" class="mt-0.5 shrink-0 opacity-70" />
        <span class="line-clamp-2">{{ task.description }}</span>
      </p>

      <!-- Footer — due-date pill + member avatar, Trello card-footer style -->
      <div class="flex items-center justify-between mt-3.5">
        <div class="flex items-center gap-1 bg-gray-100 rounded-md px-2 py-1 text-gray-500 text-[10.5px] font-semibold">
          <Calendar :size="11" />
          <span>{{ formatDateShort(task.created_at) }}</span>
        </div>

        <div
          v-if="traineeName"
          class="rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ring-2 ring-white shadow-sm"
          :style="{ backgroundColor: avatarColor, width: '26px', height: '26px' }"
          :title="traineeName"
        >
          {{ initials }}
        </div>
      </div>
    </div>

    <!-- ── TASK DETAILS POPUP (Trello card-detail style) ─────────────────────────────────── -->
    <Teleport to="body">
    <Transition name="dialog-backdrop">
      <div
        v-if="showDetails"
        class="fixed inset-0 bg-black/45 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
        @click.self="showDetails = false"
      >
        <div
          class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] sm:max-h-[80vh] flex flex-col overflow-hidden"
          style="box-shadow:0 25px 50px rgba(0,0,0,0.25)"
        >
          <!-- Cover strip echoes the card -->
          <div :class="['h-2.5 w-full shrink-0', stripColor]" />

          <div class="px-6 pt-5 pb-4 flex items-start justify-between gap-3 shrink-0">
            <div class="min-w-0">
              <h2 class="text-gray-900 text-lg font-bold leading-snug">{{ task.title }}</h2>
              <div v-if="traineeName" class="flex items-center gap-2 mt-2">
                <div
                  class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  :style="{ backgroundColor: avatarColor }"
                >
                  {{ initials }}
                </div>
                <span class="text-gray-500 text-xs font-medium">{{ traineeName }}</span>
              </div>
            </div>
            <button
              class="p-1.5 -mt-1 -mr-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
              @click="showDetails = false"
            >
              <X :size="18" />
            </button>
          </div>

          <!-- Scrollable body — keeps the header/cover pinned when description is long -->
          <div class="px-6 pb-6 space-y-5 overflow-y-auto flex-1 min-h-0">
            <div>
              <p class="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                <AlignLeft :size="13" />
                Description
              </p>
              <p class="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-3">
                {{ task.description || 'No description provided.' }}
              </p>
            </div>

            <div>
              <p class="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Status</p>
              <StatusDropdown
                v-if="task.progress[0]"
                :current-status="currentStatus"
                :progress-id="task.progress[0].id"
                :is-mentor="isMentor"
                :loading="updating"
                @change="handleStatusChange"
              />
              <span
                v-else
                :class="['inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold', stripColor, 'text-white']"
              >
                {{ TaskStatusLabel[currentStatus] }}
              </span>
            </div>

            <div class="flex items-center gap-4 text-gray-400 text-xs pt-4 border-t border-gray-100">
              <div class="flex items-center gap-1.5">
                <Calendar :size="12" />
                <span>Created {{ formatDate(task.created_at) }}</span>
              </div>
              <div v-if="task.progress[0]" class="flex items-center gap-1.5">
                <Clock :size="12" />
                <span>Updated {{ formatDate(task.progress[0].updated_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
  </div>
</template>

<style scoped>
.card-bounce {
  animation: bounce-once 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes bounce-once {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.025); }
  100% { transform: scale(1); }
}
.dialog-backdrop-enter-active,
.dialog-backdrop-leave-active { transition: opacity 0.2s ease; }
.dialog-backdrop-enter-from,
.dialog-backdrop-leave-to { opacity: 0; }
</style>
