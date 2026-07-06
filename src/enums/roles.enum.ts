export const Role = {
  Admin: 'admin',
  TeamLead: 'team_lead',
  Mentor: 'mentor',
  Trainee: 'trainee',
} as const

export type Role = typeof Role[keyof typeof Role]
