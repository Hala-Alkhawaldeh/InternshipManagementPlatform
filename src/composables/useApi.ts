import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import type { ApiResult, AppError, ExecuteOptions } from '@/types/api.types'

// Maps Supabase / PostgreSQL error codes to human-readable messages.
// Add new codes here as you encounter them — keep this as the single source.
function mapError(error: unknown): AppError {
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>
    const code = typeof err.code === 'string' ? err.code : undefined
    const status = typeof err.status === 'number' ? err.status : undefined
    const raw = typeof err.message === 'string' ? err.message : 'An unexpected error occurred.'

    const knownCodes: Record<string, string> = {
      PGRST116: 'Record not found.',
      PGRST301: 'Permission denied.',
      '23505': 'This record already exists.',
      '23503': 'Related record not found.',
      '42501': 'You do not have permission to perform this action.',
      invalid_credentials: 'Incorrect email or password.',
      email_taken: 'This email is already registered.',
      user_not_found: 'User not found.',
    }

    return {
      message: code ? (knownCodes[code] ?? raw) : raw,
      code,
      status,
    }
  }

  return {
    message: error instanceof Error ? error.message : 'An unexpected error occurred.',
  }
}

export function useApi() {
  const loading = ref(false)
  const { toast } = useToast()
  const router = useRouter()

  async function execute<T>(
    call: () => Promise<{ data: unknown; error: unknown }>,
    options: ExecuteOptions = {},
  ): Promise<ApiResult<T>> {
    loading.value = true

    try {
      const { data, error } = await call()

      if (error) {
        const appError = mapError(error)

        // Expired or missing session → back to login
        if (appError.status === 401) {
          await router.push({ name: 'login' })
          return { data: null, error: appError }
        }

        if (options.showErrorToast !== false) {
          toast({
            title: 'Error',
            description: options.errorMessage ?? appError.message,
            variant: 'destructive',
          })
        }

        return { data: null, error: appError }
      }

      return { data: data as T, error: null }
    } catch (err) {
      const appError = mapError(err)

      if (options.showErrorToast !== false) {
        toast({
          title: 'Error',
          description: options.errorMessage ?? appError.message,
          variant: 'destructive',
        })
      }

      return { data: null, error: appError }
    } finally {
      loading.value = false
    }
  }

  return { loading, execute }
}
