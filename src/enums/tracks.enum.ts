export const Track = {
  Frontend: 'frontend',
  DevOps: 'devops',
  Python: 'python',
  QA: 'qa',
  TypeScript: 'typescript',
  Performance: 'performance',
  Security: 'security',
} as const

export type Track = typeof Track[keyof typeof Track]

export const TrackLabel: Record<Track, string> = {
  [Track.Frontend]: 'Frontend Development',
  [Track.DevOps]: 'DevOps Basics',
  [Track.Python]: 'Python',
  [Track.QA]: 'Quality Assurance',
  [Track.TypeScript]: 'TypeScript Advanced',
  [Track.Performance]: 'Performance Engineering',
  [Track.Security]: 'Security',
}

// Tailwind classes per track — used on badges consistently across the app
export const TrackColor: Record<Track, string> = {
  [Track.Frontend]: 'bg-indigo-100 text-indigo-700',
  [Track.DevOps]: 'bg-orange-100 text-orange-700',
  [Track.Python]: 'bg-yellow-100 text-yellow-700',
  [Track.QA]: 'bg-teal-100 text-teal-700',
  [Track.TypeScript]: 'bg-blue-100 text-blue-700',
  [Track.Performance]: 'bg-purple-100 text-purple-700',
  [Track.Security]: 'bg-red-100 text-red-700',
}
