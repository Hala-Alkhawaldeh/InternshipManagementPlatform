<script setup lang="ts">
import { ref } from 'vue'
import { Calendar } from 'lucide-vue-next'
import StatusDropdown from './StatusDropdown.vue'
import type { TaskWithProgress } from '@/types/app.types'
import type { TaskStatus } from '@/enums/status.enum'

defineProps<{
  task: TaskWithProgress
  isMentor: boolean
  traineeName?: string
  updating?: boolean
}>()

const emit = defineEmits<{
  (e: 'statusChange', progressId: string, status: TaskStatus): void
}>()

const bouncing = ref(false)

function handleStatusChange(progressId: string, status: TaskStatus) {
  bouncing.value = true
  setTimeout(() => (bouncing.value = false), 400)
  emit('statusChange', progressId, status)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
</script>

<template>
  <div :class="['bg-white rounded-xl border border-gray-200/80 p-4 transition-all duration-200 hover:border-gray-300 hover:shadow-sm', bouncing && 'card-bounce']">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <p class="text-gray-900 text-sm font-medium leading-snug">{{ task.title }}</p>
        <p v-if="task.description" class="text-gray-400 text-xs mt-1 line-clamp-2 leading-relaxed">
          {{ task.description }}
        </p>
        <p v-if="traineeName" class="text-indigo-500 text-[11px] font-medium mt-1.5">
          {{ traineeName }}
        </p>
      </div>

      <StatusDropdown
        v-if="task.progress[0]"
        :current-status="task.progress[0].status as TaskStatus"
        :progress-id="task.progress[0].id"
        :is-mentor="isMentor"
        :loading="updating"
        @change="handleStatusChange"
      />
    </div>

    <div class="flex items-center gap-1.5 mt-3 text-gray-300 text-[11px]">
      <Calendar :size="11" />
      <span>{{ formatDate(task.created_at) }}</span>
    </div>
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
</style>
