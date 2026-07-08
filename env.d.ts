/// <reference types="vite/client" />

// lucide-vue-next ships no .d.ts alongside its per-icon esm files — only the barrel
// module has typings. We deep-import icons individually in src/lib/icons.ts to avoid
// the barrel's tree-shaking issue, so declare the shape ourselves.
declare module 'lucide-vue-next/dist/esm/icons/*.js' {
  import type { Component } from 'vue'
  const Icon: Component
  export default Icon
}
