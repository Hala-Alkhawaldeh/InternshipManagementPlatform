<script setup lang="ts">
import { computed } from 'vue'
import { Check, X } from '@/lib/icons'
import { checkPasswordRequirements } from '@/lib/password'

const props = defineProps<{ password: string }>()

const requirements = computed(() => checkPasswordRequirements(props.password))
</script>

<template>
  <ul class="grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
    <li
      v-for="r in requirements"
      :key="r.key"
      class="flex items-center gap-1.5 text-[11px] transition-colors"
      :class="r.met ? 'text-emerald-600' : 'text-gray-400'"
    >
      <component :is="r.met ? Check : X" :size="11" class="shrink-0" />
      {{ r.label }}
    </li>
  </ul>
</template>
