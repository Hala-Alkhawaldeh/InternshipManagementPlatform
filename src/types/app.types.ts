import type { Role } from '@/enums/roles.enum'
import type { Track } from '@/enums/tracks.enum'
import type { TaskStatus } from '@/enums/status.enum'

export interface Profile {
  id: string
  user_id: string
  role: Role
  full_name: string
  email: string
  track: Track | null
  mentor_id: string | null
  created_at: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  created_by: string
  assigned_to: string
  status: TaskStatus
  created_at: string
  updated_at: string
}

export interface TaskProgress {
  id: string
  task_id: string
  trainee_id: string
  status: TaskStatus
  updated_at: string
}

export interface TaskWithProgress extends Task {
  progress: TaskProgress[]
}

export interface EvaluationCriterion {
  id: string
  name: string
  order: number
}

export interface EvaluationScore {
  criterionId: string
  score: number // 0–7
  note?: string
}

export interface Evaluation {
  id: string
  trainee_id: string
  mentor_id: string
  criteria: EvaluationCriterion[]
  scores: EvaluationScore[]
  average_score: number | null
  created_at: string
}
