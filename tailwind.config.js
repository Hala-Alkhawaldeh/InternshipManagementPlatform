/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Status — matches status.enum.ts TaskStatusColor
        'status-todo': '#6b7280',
        'status-inprogress': '#3b82f6',
        'status-done': '#f59e0b',
        'status-accepted': '#22c55e',
        // Tracks — matches tracks.enum.ts TrackColor
        'track-frontend': '#6366f1',
        'track-devops': '#f97316',
        'track-python': '#eab308',
        'track-qa': '#14b8a6',
        'track-typescript': '#3b82f6',
        'track-performance': '#a855f7',
        'track-security': '#ef4444',
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
