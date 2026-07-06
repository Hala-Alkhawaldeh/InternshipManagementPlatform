<script setup lang="ts">
import { ref } from 'vue'
import { Menu } from 'lucide-vue-next'
import AppSidebar from './AppSidebar.vue'

const isMobileOpen = ref(false)
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-[#f7f8fc] font-sans">
    <AppSidebar :is-mobile-open="isMobileOpen" @update:mobile-open="isMobileOpen = $event" />

    <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
      <!-- Mobile top bar -->
      <header
        class="md:hidden flex items-center h-14 px-4 bg-white border-b border-gray-200/80 shrink-0 z-30"
      >
        <button
          class="p-1.5 -ml-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          @click="isMobileOpen = true"
        >
          <Menu :size="20" />
        </button>
        <div class="ml-3 flex items-center gap-2">
          <div class="w-5 h-5 rounded bg-indigo-500 flex items-center justify-center">
            <span class="text-white text-[9px] font-bold font-mono leading-none">SI</span>
          </div>
          <span class="text-gray-900 text-sm font-medium">Sitech Internship</span>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-auto">
        <RouterView v-slot="{ Component }">
          <Transition name="page-inner" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style scoped>
.page-inner-enter-active,
.page-inner-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.page-inner-enter-from {
  opacity: 0;
  transform: translateY(5px);
}
.page-inner-leave-to {
  opacity: 0;
  transform: translateY(-3px);
}
</style>
