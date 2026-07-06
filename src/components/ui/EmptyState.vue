<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  icon: Component
  title: string
  description?: string
  iconClass?: string
  iconBgClass?: string
}>()
</script>

<template>
  <div
    v-motion
    :initial="{ opacity: 0, y: 18 }"
    :enter="{ opacity: 1, y: 0, transition: { duration: 420, ease: 'easeOut' } }"
    class="flex flex-col items-center justify-center py-20 text-center"
  >
    <div :class="['w-14 h-14 rounded-2xl flex items-center justify-center mb-4', iconBgClass ?? 'bg-gray-100']">
      <component :is="icon" :size="26" :class="iconClass ?? 'text-gray-400'" />
    </div>
    <p class="text-gray-700 font-medium text-sm">{{ title }}</p>
    <p v-if="description" class="text-gray-400 text-sm mt-1.5 max-w-xs leading-relaxed">
      {{ description }}
    </p>
    <slot />
  </div>
</template>
