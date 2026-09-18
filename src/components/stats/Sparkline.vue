<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ points: number[]; color: string }>()

const uid = `spark-${Math.random().toString(36).slice(2, 9)}`

const width = 100
const height = 36

const pathPoints = computed<[number, number][]>(() => {
  const vals = props.points
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1
  const step = width / (vals.length - 1)
  return vals.map((v, i) => {
    const x = i * step
    const y = height - ((v - min) / range) * (height - 6) - 3
    return [x, y] as [number, number]
  })
})

const linePath = computed(() =>
  pathPoints.value.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' '),
)

const areaPath = computed(() => {
  const pts = pathPoints.value
  const first = pts[0]
  const last = pts[pts.length - 1]
  if (!first || !last) return ''
  return `${linePath.value} L${last[0].toFixed(1)},${height} L${first[0].toFixed(1)},${height} Z`
})
</script>

<template>
  <svg class="sparkline" :viewBox="`0 0 ${width} ${height}`" preserveAspectRatio="none">
    <defs>
      <linearGradient :id="`${uid}-fill`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="color" stop-opacity="0.35" />
        <stop offset="100%" :stop-color="color" stop-opacity="0" />
      </linearGradient>
      <filter :id="`${uid}-glow`" x="-20%" y="-40%" width="140%" height="180%">
        <feGaussianBlur stdDeviation="1.4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <path :d="areaPath" :fill="`url(#${uid}-fill)`" stroke="none" />
    <path :d="linePath" fill="none" :stroke="color" stroke-width="1.6" :filter="`url(#${uid}-glow)`" />
  </svg>
</template>
