<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    percent: number
    size?: number
    strokeWidth?: number
    colorFrom: string
    colorTo: string
  }>(),
  { size: 96, strokeWidth: 10 },
)

const uid = `donut-${Math.random().toString(36).slice(2, 9)}`
const radius = computed(() => (props.size - props.strokeWidth) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const dashOffset = computed(() => circumference.value * (1 - Math.min(100, Math.max(0, props.percent)) / 100))
</script>

<template>
  <svg class="circular-progress" :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
    <defs>
      <linearGradient :id="uid" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" :stop-color="colorFrom" />
        <stop offset="100%" :stop-color="colorTo" />
      </linearGradient>
    </defs>
    <circle
      class="circular-track"
      :cx="size / 2"
      :cy="size / 2"
      :r="radius"
      fill="none"
      :stroke-width="strokeWidth"
    />
    <circle
      class="circular-fill"
      :cx="size / 2"
      :cy="size / 2"
      :r="radius"
      fill="none"
      :stroke="`url(#${uid})`"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      :stroke-dasharray="circumference"
      :stroke-dashoffset="dashOffset"
      :transform="`rotate(-90 ${size / 2} ${size / 2})`"
    />
    <text class="circular-label" :x="size / 2" :y="size / 2" text-anchor="middle" dominant-baseline="central">
      {{ Math.round(percent) }}%
    </text>
  </svg>
</template>
