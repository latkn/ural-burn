<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

let embersSeq = 0

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

type Props = {
  class?: string
  strength?: number
  density?: number
  fadeStartVh?: number
  fadeEndVh?: number
  /** Минимальная видимость внизу страницы (0..1), чтобы анимация не «выключалась» */
  fadeMinOpacity?: number
}

const props = withDefaults(defineProps<Props>(), {
  strength: 18,
  density: 160,
  fadeStartVh: 60,
  fadeEndVh: 420,
  fadeMinOpacity: 0.12,
})

const particlesId = `embers-${(embersSeq += 1)}`

const rootEl = ref<HTMLElement | null>(null)
const scrollY = ref(0)
let raf = 0

function onScroll() {
  if (raf) return
  raf = window.requestAnimationFrame(() => {
    scrollY.value = window.scrollY || window.pageYOffset || 0
    raf = 0
  })
}

onMounted(() => {
  scrollY.value = window.scrollY || window.pageYOffset || 0
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  if (raf) window.cancelAnimationFrame(raf)
})

const parallaxStyle = computed(() => {
  // reactive dependency to update on scroll
  scrollY.value

  const el = rootEl.value
  if (!el) return {}

  const rect = el.getBoundingClientRect()
  const viewportH = window.innerHeight || 1
  const centerDelta = rect.top + rect.height / 2 - viewportH / 2
  const normalized = Math.max(-1, Math.min(1, centerDelta / (viewportH / 2)))

  const translateY = normalized * props.strength * 1.25
  const translateX = normalized * props.strength * 2.8
  const z = (1 - Math.min(1, Math.abs(normalized))) * (props.strength * 1.15)
  const rotateX = normalized * -2.5
  const rotateY = normalized * -14
  const scale = 1 + (1 - Math.min(1, Math.abs(normalized))) * 0.09
  const baseOpacity = 0.95 - Math.min(0.18, Math.abs(normalized) * 0.12)

  const vh = (window.innerHeight || 1) / 100
  const fadeStartPx = props.fadeStartVh * vh
  const fadeEndPx = props.fadeEndVh * vh
  const t =
    fadeEndPx <= fadeStartPx
      ? 1
      : Math.max(0, Math.min(1, (scrollY.value - fadeStartPx) / (fadeEndPx - fadeStartPx)))
  const fade = 1 - t
  const minO = Math.max(0, Math.min(1, props.fadeMinOpacity ?? 0))
  const opacity = baseOpacity * (fade * (1 - minO) + minO)

  return {
    transform: `perspective(1200px) translate3d(${translateX}px, ${translateY}px, ${z}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`,
    opacity,
  }
})

const manualParticles = computed(() => {
  const count = Math.max(0, Math.round(props.density))
  const res: Array<{ position: { x: number; y: number } }> = []

  for (let i = 0; i < count; i += 1) {
    const a = Math.random() * Math.PI * 2
    const u = Math.random()
    const r = Math.pow(u, 0.62) * 72

    const x = clamp(50 + Math.cos(a) * r, 0, 100)
    const y = clamp(50 + Math.sin(a) * r, 0, 100)

    res.push({ position: { x, y } })
  }

  return res
})

const baseOptions = computed(() => ({
  fullScreen: { enable: false },
  detectRetina: false,
  fpsLimit: 30,
  pauseOnBlur: true,
  pauseOnOutsideViewport: false,
  manualParticles: manualParticles.value,
  particles: {
    number: {
      value: 0,
      density: {
        enable: true,
        area: 900,
      },
    },
    color: {
      value: ['#ffedd5', '#fdba74', '#fb923c', '#f97316', '#ea580c'],
    },
    stroke: {
      width: { min: 0.9, max: 1.8 },
      color: {
        value: ['#fdba74', '#fb923c', '#f97316', '#ea580c'],
      },
      opacity: { min: 0.75, max: 1 },
    },
    shadow: {
      enable: false,
      color: {
        value: '#f97316',
      },
      blur: 8,
      offset: {
        x: 0,
        y: 0,
      },
    },
    shape: {
      type: 'line',
      options: {
        line: {
          cap: 'round',
        },
      },
    },
    links: {
      enable: false,
    },
    opacity: {
      value: { min: 0.8, max: 1 },
    },
    size: {
      // ~3x smaller than before
      value: { min: 1.4, max: 3.8 },
    },
    rotate: {
      value: { min: 0, max: 360 },
      direction: 'random',
      animation: {
        enable: false,
        speed: 0,
        sync: false,
      },
    },
    move: {
      enable: false,
      speed: 0,
    },
  },
  background: {
    color: {
      value: 'transparent',
    },
  },
}))
</script>

<template>
  <div
    ref="rootEl"
    class="pointer-events-none absolute inset-0 overflow-hidden"
    :class="props.class"
    aria-hidden="true"
  >
    <!-- Overscan: prevents exposing canvas edges during 3D transforms -->
    <div class="absolute -inset-[18%] will-change-transform [transform-origin:center] [transform-style:preserve-3d]" :style="parallaxStyle">
      <vue-particles
        :id="particlesId"
        :options="baseOptions"
        class="absolute inset-0"
        :style="{ width: '100%', height: '100%' }"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-burn-orange/10 via-transparent to-transparent" />
    </div>
  </div>
</template>

<style scoped>
:deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}
</style>
