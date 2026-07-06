export interface AppError {
  message: string
  code?: string
  status?: number
}

export type ApiResult<T> =
  | { data: T; error: null }
  | { data: null; error: AppError }

export interface ExecuteOptions {
  showErrorToast?: boolean
  errorMessage?: string
}
