export const PASSWORD_MIN_LENGTH = 8

export interface PasswordRequirement {
  key: string
  label: string
  met: boolean
}

export function checkPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    { key: 'length', label: `At least ${PASSWORD_MIN_LENGTH} characters`, met: password.length >= PASSWORD_MIN_LENGTH },
    { key: 'uppercase', label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { key: 'lowercase', label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { key: 'number', label: 'One number', met: /[0-9]/.test(password) },
    { key: 'special', label: 'One special character', met: /[^A-Za-z0-9]/.test(password) },
  ]
}

export function isPasswordValid(password: string): boolean {
  return checkPasswordRequirements(password).every((r) => r.met)
}
