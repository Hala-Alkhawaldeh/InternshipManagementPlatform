export const Track = {
  Frontend: 'frontend',
  Backend: 'backend',
  QA: 'qa',
  DevOps: 'devops',
} as const

export type Track = typeof Track[keyof typeof Track]

export const TrackLabel: Record<Track, string> = {
  [Track.Frontend]: 'Frontend Development',
  [Track.Backend]: 'Backend Development',
  [Track.QA]: 'Quality Assurance',
  [Track.DevOps]: 'DevOps',
}

// Tailwind classes per track — used on badges consistently across the app
export const TrackColor: Record<Track, string> = {
  [Track.Frontend]: 'bg-indigo-100 text-indigo-700',
  [Track.Backend]: 'bg-blue-100 text-blue-700',
  [Track.QA]: 'bg-teal-100 text-teal-700',
  [Track.DevOps]: 'bg-orange-100 text-orange-700',
}
