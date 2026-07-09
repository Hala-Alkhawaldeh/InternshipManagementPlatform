import { globalIgnores } from 'eslint/config'
import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '**/supabase/functions/**']),

  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  // Must be last — turns off any rule above that would fight Prettier's formatting.
  skipFormatting,

  {
    name: 'app/rules',
    rules: {},
  },
)
