import { ref, watch } from 'vue'

export function useCountUp(getValue: () => number, duration = 900) {
  const displayed = ref(0)

  watch(getValue, (target) => {
    const start = displayed.value
    const diff = target - start
    if (diff === 0) return

    const startTime = performance.now()

    function tick(now: number) {
      const t = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      displayed.value = Math.round(start + diff * eased)
      if (t < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, { immediate: true })

  return displayed
}
