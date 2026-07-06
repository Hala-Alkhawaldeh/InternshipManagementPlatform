<script setup lang="ts">
import { onMounted } from 'vue'
import Toast from 'primevue/toast'
import { useAuth } from '@/composables/useAuth'

const { initAuth } = useAuth()

onMounted(async () => {
  await initAuth()
})
</script>

<template>
  <Toast position="top-right" />
  <RouterView v-slot="{ Component }">
    <Transition name="page" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
