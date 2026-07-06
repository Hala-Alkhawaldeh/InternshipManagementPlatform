<script setup lang="ts">
import { computed } from 'vue'
import { TaskStatus, TaskStatusLabel, TaskStatusColor, TraineeTransitions, MentorTransitions } from '@/enums/status.enum'

const props = defineProps<{
  currentStatus: TaskStatus
  progressId: string
  isMentor: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'change', progressId: string, status: TaskStatus): void
}>()

const options = computed<TaskStatus[]>(() =>
  props.isMentor
    ? MentorTransitions
    : (TraineeTransitions[props.currentStatus] ?? []),
)

function onChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value as TaskStatus
  emit('change', props.progressId, val)
}
</script>

<template>
  <!-- Trainee with no moves available: read-only badge -->
  <div v-if="!isMentor && !options.length"
    :class="['inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full', TaskStatusColor[currentStatus]]">
    {{ TaskStatusLabel[currentStatus] }}
  </div>

  <!-- Dropdown -->
  <select
    v-else
    :value="currentStatus"
    :disabled="loading"
    :class="['text-[11px] font-semibold px-2.5 py-1 rounded-full border-0 outline-none cursor-pointer appearance-none transition-all duration-200 disabled:opacity-50', TaskStatusColor[currentStatus]]"
    @change="onChange"
  >
    <option :value="currentStatus">{{ TaskStatusLabel[currentStatus] }}</option>
    <option v-for="opt in options.filter(o => o !== currentStatus)" :key="opt" :value="opt">
      → {{ TaskStatusLabel[opt] }}
    </option>
  </select>
</template>
