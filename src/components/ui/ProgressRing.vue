<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{
  percentage: number
  size?: number
  stroke?: number
}>(), { size: 120, stroke: 8 })

const radius = computed(() => (props.size - props.stroke) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)

const animated = ref(false)
const dashOffset = computed(() =>
  animated.value
    ? circumference.value - (props.percentage / 100) * circumference.value
    : circumference.value,
)

const trackColor = '#e5e7eb'
const fillColor = computed(() => props.percentage >= 100 ? '#22c55e' : '#6366f1')

onMounted(() => {
  // Tiny delay so the CSS transition fires after first paint
  requestAnimationFrame(() => setTimeout(() => (animated.value = true), 50))
})
</script>

<template>
  <div class="relative inline-flex items-center justify-center" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg :width="size" :height="size" class="-rotate-90">
      <!-- Track -->
      <circle
        :cx="size / 2" :cy="size / 2" :r="radius"
        :stroke="trackColor" :stroke-width="stroke"
        fill="none"
      />
      <!-- Progress arc -->
      <circle
        :cx="size / 2" :cy="size / 2" :r="radius"
        :stroke="fillColor" :stroke-width="stroke"
        fill="none" stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        style="transition: stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease"
      />
    </svg>

    <!-- Centre label -->
    <div class="absolute inset-0 flex flex-col items-center justify-center rotate-0">
      <template v-if="percentage >= 100">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span class="text-green-600 text-[10px] font-semibold mt-0.5">Done!</span>
      </template>
      <template v-else>
        <span class="text-gray-900 text-xl font-semibold leading-none">{{ percentage }}<span class="text-sm font-normal text-gray-400">%</span></span>
        <span class="text-gray-400 text-[10px] mt-0.5">complete</span>
      </template>
    </div>
  </div>
</template>
