import { shallowRef, computed } from 'vue'
import { useApi } from '@/composables/useApi'
import { useToast } from '@/composables/useToast'
import { tasksService } from '@/services/tasks.service'
import { TaskStatus, TaskStatusLabel } from '@/enums/status.enum'
import type { Task, TaskWithProgress } from '@/types/app.types'

export function useTasks() {
  const { execute, loading } = useApi()
  const { toast } = useToast()

  // shallowRef — always replaced wholesale on fetch; updateStatus below
  // replaces the array immutably too, so shallow tracking is enough here
  // and Vue doesn't have to deep-proxy every task/progress row.
  const tasks = shallowRef<TaskWithProgress[]>([])

  const completionPercentage = computed(() => {
    if (!tasks.value.length) return 0
    const accepted = tasks.value.filter(t => t.progress[0]?.status === TaskStatus.Accepted).length
    return Math.round((accepted / tasks.value.length) * 100)
  })

  async function fetchTasks() {
    const result = await execute<TaskWithProgress[]>(() => tasksService.getTasksWithProgress())
    if (result.data) tasks.value = result.data
    return result
  }

  async function fetchTasksByTrainee(traineeId: string) {
    const result = await execute<TaskWithProgress[]>(
      () => tasksService.getTasksByTrainee(traineeId),
    )
    if (result.data) tasks.value = result.data
    return result
  }

  async function createTask(payload: {
    title: string
    description: string | null
    createdBy: string
    assignedTo: string
  }) {
    const result = await execute<Task>(() =>
      tasksService.createTask({
        title: payload.title,
        description: payload.description,
        created_by: payload.createdBy,
        assigned_to: payload.assignedTo,
      }),
    )

    if (result.data) {
      await tasksService.createTaskProgress(result.data.id, payload.assignedTo)
      await fetchTasks()
      toast({ title: 'Task created', description: `"${payload.title}" assigned successfully.` })
    }

    return result
  }

  async function updateStatus(taskProgressId: string, status: TaskStatus, taskTitle: string) {
    const result = await execute(() => tasksService.updateTaskStatus(taskProgressId, status))

    if (result.data) {
      // Optimistic local update, done immutably — replaces the array and the
      // touched task/progress objects rather than mutating in place, so the
      // shallowRef above still picks it up.
      tasks.value = tasks.value.map(t =>
        t.progress[0]?.id === taskProgressId
          ? { ...t, progress: [{ ...t.progress[0], status }, ...t.progress.slice(1)] }
          : t,
      )

      toast({
        title: 'Status updated',
        description: `"${taskTitle}" moved to ${TaskStatusLabel[status]}.`,
      })
    }

    return result
  }

  return {
    tasks,
    loading,
    completionPercentage,
    fetchTasks,
    fetchTasksByTrainee,
    createTask,
    updateStatus,
  }
}
