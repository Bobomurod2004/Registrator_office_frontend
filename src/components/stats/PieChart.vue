<script setup lang="ts">
import { computed } from 'vue'

export interface PieSlice {
  label: string
  value: number
  color: string
}

const props = withDefaults(defineProps<{ slices: PieSlice[]; size?: number }>(), { size: 160 })

const total = computed(() => props.slices.reduce((sum, s) => sum + s.value, 0) || 1)

function polarPoint(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

const arcs = computed(() => {
  const cx = props.size / 2
  const cy = props.size / 2
  const r = props.size / 2 - 4
  let angle = 0
  return props.slices.map((slice) => {
    const percent = (slice.value / total.value) * 100
    const sweep = (slice.value / total.value) * 360
    const start = polarPoint(cx, cy, r, angle)
    const end = polarPoint(cx, cy, r, angle + sweep)
    const largeArc = sweep > 180 ? 1 : 0
    const path =
      sweep >= 359.99
        ? `M${cx - r},${cy} A${r},${r} 0 1 1 ${cx + r},${cy} A${r},${r} 0 1 1 ${cx - r},${cy}`
        : `M${cx},${cy} L${start.x.toFixed(2)},${start.y.toFixed(2)} A${r},${r} 0 ${largeArc} 1 ${end.x.toFixed(2)},${end.y.toFixed(2)} Z`
    angle += sweep
    return { ...slice, percent: Math.round(percent), path }
  })
})
</script>

<template>
  <div class="pie-chart-v2">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
      <circle v-if="!slices.length" :cx="size / 2" :cy="size / 2" :r="size / 2 - 4" class="circular-track" fill="none" stroke-width="2" />
      <path v-for="a in arcs" :key="a.label" :d="a.path" :fill="a.color" class="pie-slice" />
      <circle :cx="size / 2" :cy="size / 2" :r="size * 0.32" class="pie-center" />
    </svg>

    <div class="pie-legend">
      <span v-for="a in arcs" :key="a.label" class="pie-legend-item">
        <span class="legend-dot-v2" :style="{ background: a.color }" />
        <span class="pie-legend-text">{{ a.label }} <strong>{{ a.value }} ({{ a.percent }}%)</strong></span>
      </span>
    </div>
  </div>
</template>
