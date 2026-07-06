import { supabase } from '@/lib/supabase'
import type { Task } from '@/types/app.types'
import type { TaskStatus } from '@/enums/status.enum'

export const tasksService = {
  async getTasksWithProgress() {
    return await supabase
      .from('tasks')
      .select('*, progress:task_progress(*)')
      .order('created_at', { ascending: false })
  },

  async getTasksByTrainee(traineeId: string) {
    return await supabase
      .from('tasks')
      .select('*, progress:task_progress(*)')
      .eq('assigned_to', traineeId)
      .order('created_at', { ascending: false })
  },

  async createTask(task: Pick<Task, 'title' | 'description' | 'created_by' | 'assigned_to'>) {
    return await supabase
      .from('tasks')
      .insert({ ...task, status: 'todo' })
      .select()
      .single()
  },

  async createTaskProgress(taskId: string, traineeId: string) {
    return await supabase
      .from('task_progress')
      .insert({ task_id: taskId, trainee_id: traineeId, status: 'todo' })
      .select()
      .single()
  },

  async updateTaskStatus(taskProgressId: string, status: TaskStatus) {
    return await supabase
      .from('task_progress')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', taskProgressId)
      .select()
      .single()
  },

  async deleteTask(taskId: string) {
    return await supabase.from('tasks').delete().eq('id', taskId)
  },
}
