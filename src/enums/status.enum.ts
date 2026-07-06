export const TaskStatus = {
  Todo: 'todo',
  InProgress: 'in_progress',
  Done: 'done',
  Accepted: 'accepted',
} as const

export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus]

export const TaskStatusLabel: Record<TaskStatus, string> = {
  [TaskStatus.Todo]: 'To Do',
  [TaskStatus.InProgress]: 'In Progress',
  [TaskStatus.Done]: 'Done',
  [TaskStatus.Accepted]: 'Accepted',
}

// Tailwind classes per status — used on badges and task cards
export const TaskStatusColor: Record<TaskStatus, string> = {
  [TaskStatus.Todo]: 'bg-gray-100 text-gray-600',
  [TaskStatus.InProgress]: 'bg-blue-100 text-blue-700',
  [TaskStatus.Done]: 'bg-amber-100 text-amber-700',
  [TaskStatus.Accepted]: 'bg-green-100 text-green-700',
}

// Which statuses a trainee can transition to from a given status (forward only)
export const TraineeTransitions: Partial<Record<TaskStatus, TaskStatus[]>> = {
  [TaskStatus.Todo]: [TaskStatus.InProgress],
  [TaskStatus.InProgress]: [TaskStatus.Done],
}

// Mentors can set any status
export const MentorTransitions: TaskStatus[] = [
  TaskStatus.Todo,
  TaskStatus.InProgress,
  TaskStatus.Done,
  TaskStatus.Accepted,
]
