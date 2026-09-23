<script setup lang="ts">
import { computed } from 'vue'

/** `null` — "ma'lumot yo'q" (masalan o'sha oyda yopilgan murojaat bo'lmagani uchun SLA
 * hisoblanmagan). Bunday nuqta 0 sifatida chizilmaydi: chiziq shu joyda uziladi. */
export interface LineSeries {
  name: string
  color: string
  values: Array<number | null>
}

const props = defineProps<{
  labels: string[]
  series: LineSeries[]
  suffix?: string
  /** Y o'qining yuqori chegarasi (masalan foizlar uchun 100); berilmasa ma'lumotdan hisoblanadi. */
  max?: number
}>()

const uid = `line-${Math.random().toString(36).slice(2, 9)}`

const width = 600
const height = 200
const padTop = 14
const padBottom = 26
const padLeft = 6
const baseline = height - padBottom

const maxValue = computed(() => {
  if (props.max) return props.max
  const all = props.series.flatMap((s) => s.values).filter((v): v is number => v !== null)
  return Math.ceil(Math.max(1, ...all) / 10) * 10
})

const ySteps = computed(() => {
  const top = maxValue.value
  return [top, top * 0.75, top * 0.5, top * 0.25, 0]
})

interface Point {
  x: number
  y: number
}

/** Ketma-ket kelgan `null` bo'lmagan nuqtalar guruhlari — har biri alohida chiziq bo'lagi. */
function segmentsFor(values: Array<number | null>): Point[][] {
  const plotW = width - padLeft
  const plotH = height - padTop - padBottom
  const step = values.length > 1 ? plotW / (values.length - 1) : 0
  const segments: Point[][] = []
  let current: Point[] = []
  values.forEach((v, i) => {
    if (v === null) {
      if (current.length) segments.push(current)
      current = []
      return
    }
    current.push({ x: padLeft + i * step, y: padTop + plotH - (v / maxValue.value) * plotH })
  })
  if (current.length) segments.push(current)
  return segments
}

function linePath(points: Point[]) {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
}

function areaPath(points: Point[]) {
  const first = points[0]!
  const last = points[points.length - 1]!
  return `${linePath(points)} L${last.x.toFixed(1)},${baseline} L${first.x.toFixed(1)},${baseline} Z`
}

const xLabelPositions = computed(() => {
  const plotW = width - padLeft
  const step = props.labels.length > 1 ? plotW / (props.labels.length - 1) : 0
  return props.labels.map((label, i) => ({ label, x: padLeft + i * step }))
})
</script>

<template>
  <div class="line-chart-v2">
    <div class="line-chart-body">
      <div class="bar-y-axis-v2 line-y-axis">
        <span v-for="step in ySteps" :key="step">{{ Number.isInteger(step) ? step : step.toFixed(1) }}{{ suffix }}</span>
      </div>

      <svg class="line-chart-svg" :viewBox="`0 0 ${width} ${height}`" preserveAspectRatio="none">
        <line
          v-for="step in ySteps"
          :key="`grid-${step}`"
          :x1="padLeft"
          :x2="width"
          :y1="padTop + (height - padTop - padBottom) * (1 - step / maxValue)"
          :y2="padTop + (height - padTop - padBottom) * (1 - step / maxValue)"
          class="line-chart-grid"
        />

        <defs>
          <linearGradient v-for="(s, idx) in series" :id="`${uid}-${idx}`" :key="s.name" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" :stop-color="s.color" stop-opacity="0.28" />
            <stop offset="100%" :stop-color="s.color" stop-opacity="0" />
          </linearGradient>
        </defs>

        <g v-for="(s, idx) in series" :key="s.name">
          <template v-for="(seg, segIdx) in segmentsFor(s.values)" :key="segIdx">
            <path v-if="seg.length > 1" :d="areaPath(seg)" :fill="`url(#${uid}-${idx})`" stroke="none" />
            <path v-if="seg.length > 1" :d="linePath(seg)" fill="none" :stroke="s.color" stroke-width="2.4" />
            <circle v-for="(p, i) in seg" :key="i" :cx="p.x" :cy="p.y" r="3" :fill="s.color" />
          </template>
        </g>
      </svg>
    </div>

    <div class="line-x-axis">
      <span v-for="lp in xLabelPositions" :key="lp.label">{{ lp.label }}</span>
    </div>

    <div class="line-legend">
      <span v-for="s in series" :key="s.name" class="line-legend-item">
        <span class="legend-dot-v2" :style="{ background: s.color }" />
        {{ s.name }}
      </span>
    </div>
  </div>
</template>
