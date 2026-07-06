import { useToast as usePrimeToast } from 'primevue/usetoast'

interface ToastOptions {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

// Thin wrapper so the rest of the app never imports from primevue directly.
// Severity mapping: destructive → error, default → success.
export function useToast() {
  const prime = usePrimeToast()

  function toast(options: ToastOptions) {
    prime.add({
      severity: options.variant === 'destructive' ? 'error' : 'success',
      summary: options.title,
      detail: options.description,
      life: 4000,
    })
  }

  return { toast }
}
