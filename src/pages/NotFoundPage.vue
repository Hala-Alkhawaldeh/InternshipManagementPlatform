<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-4">
    <p class="text-6xl font-bold text-muted-foreground">404</p>
    <p class="text-muted-foreground">Page not found.</p>
    <button
      class="text-sm underline underline-offset-4"
      @click="router.back()"
    >
      Go back
    </button>
  </div>
</template>
