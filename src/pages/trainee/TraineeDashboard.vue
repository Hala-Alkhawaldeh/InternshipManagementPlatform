<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAutoAnimate } from '@formkit/auto-animate/vue'
import { CheckSquare } from 'lucide-vue-next'
import TaskCard from '@/components/tasks/TaskCard.vue'
import ProgressRing from '@/components/ui/ProgressRing.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useTasks } from '@/composables/useTasks'
import { useCountUp } from '@/composables/useCountUp'
import { useAuthStore } from '@/stores/auth.store'
import { TaskStatus, TaskStatusLabel } from '@/enums/status.enum'
import type { TaskStatus as TS } from '@/enums/status.enum'

const authStore = useAuthStore()
const { tasks, completionPercentage, fetchTasksByTrainee, updateStatus, loading } = useTasks()

const tasksByStatus = computed(() => {
  const order: TS[] = [TaskStatus.InProgress, TaskStatus.Todo, TaskStatus.Done, TaskStatus.Accepted]
  return order
    .map(status => ({
      status,
      label: TaskStatusLabel[status],
      items: tasks.value.filter(t => t.progress[0]?.status === status),
    }))
    .filter(g => g.items.length > 0)
})

const totalTasks = computed(() => tasks.value.length)
const acceptedCount = computed(() => tasks.value.filter(t => t.progress[0]?.status === TaskStatus.Accepted).length)

// Count-up animations for hero stats
const animatedTotal = useCountUp(() => totalTasks.value)
const animatedAccepted = useCountUp(() => acceptedCount.value)
const animatedPct = useCountUp(() => completionPercentage.value)

async function handleStatusChange(progressId: string, status: TS) {
  const task = tasks.value.find(t => t.progress[0]?.id === progressId)
  if (task) await updateStatus(progressId, status, task.title)
}

onMounted(() => {
  const userId = authStore.user?.id
  if (userId) fetchTasksByTrainee(userId)
})

const [taskListRef] = useAutoAnimate<HTMLElement>()
</script>

<template>
  <div class="min-h-full bg-[#f7f8fc]">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200/80 px-6 py-5">
      <h1 class="text-gray-900 text-xl font-semibold">My Tasks</h1>
      <p class="text-gray-400 text-sm mt-0.5">
        {{ authStore.profile?.full_name ?? '' }}
        <span v-if="authStore.profile?.track"> · {{ authStore.profile.track }}</span>
      </p>
    </div>

    <div class="px-6 py-6 max-w-3xl mx-auto">

      <!-- Loading -->
      <template v-if="loading && !totalTasks">
        <div class="flex justify-center py-12">
          <div class="w-8 h-8 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      </template>

      <!-- Empty state (5.4) -->
      <template v-else-if="!totalTasks">
        <EmptyState
          :icon="CheckSquare"
          title="No tasks yet"
          description="Your mentor is setting up your tasks — check back soon!"
          icon-bg-class="bg-indigo-50"
          icon-class="text-indigo-400"
        />
      </template>

      <!-- Content -->
      <template v-else>
        <!-- Progress hero — count-up stats (5.7) -->
        <div
          v-motion
          :initial="{ opacity: 0, y: 14 }"
          :enter="{ opacity: 1, y: 0, transition: { duration: 400, ease: 'easeOut' } }"
          class="bg-white rounded-2xl border border-gray-200/80 p-6 mb-6 flex items-center gap-6"
        >
          <ProgressRing :percentage="animatedPct" :size="100" :stroke="7" />
          <div class="flex-1">
            <p class="text-gray-900 font-semibold text-lg leading-tight">
              {{ completionPercentage === 100 ? 'All done! 🎉' : 'Keep going' }}
            </p>
            <p class="text-gray-400 text-sm mt-1">
              <span class="text-gray-700 font-semibold">{{ animatedAccepted }}</span>
              of
              <span class="text-gray-700 font-semibold">{{ animatedTotal }}</span>
              task{{ animatedTotal !== 1 ? 's' : '' }} accepted
            </p>
            <div class="flex gap-3 mt-3 flex-wrap">
              <span
                v-for="[status, color] in [
                  [TaskStatus.Todo, 'text-gray-500'],
                  [TaskStatus.InProgress, 'text-blue-600'],
                  [TaskStatus.Done, 'text-amber-600'],
                  [TaskStatus.Accepted, 'text-green-600'],
                ]"
                :key="status as string"
                :class="['text-xs font-medium', color as string]"
              >
                {{ tasks.filter(t => t.progress[0]?.status === status).length }}
                {{ TaskStatusLabel[status as TS] }}
              </span>
            </div>
          </div>
        </div>

        <!-- Task groups -->
        <div ref="taskListRef" class="space-y-6">
          <div
            v-for="group in tasksByStatus"
            :key="group.status"
            v-motion
            :initial="{ opacity: 0, y: 8 }"
            :enter="{ opacity: 1, y: 0, transition: { duration: 300, ease: 'easeOut' } }"
          >
            <p class="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
              {{ group.label }} · {{ group.items.length }}
            </p>
            <div class="space-y-2.5">
              <TaskCard
                v-for="task in group.items"
                :key="task.id"
                :task="task"
                :is-mentor="false"
                :updating="loading"
                @status-change="handleStatusChange"
              />
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
