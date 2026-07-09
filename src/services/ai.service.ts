import { supabase } from '@/lib/supabase'

export const aiService = {
  async suggestEvaluationCriteria(existingNames: string[]) {
    return await supabase.functions.invoke<{ criteria: string[] }>('generate-evaluation-criteria', {
      body: { existingNames },
    })
  },
}
