<script setup lang="ts">
import { computed } from 'vue'
import Sparkline from './Sparkline.vue'

const props = defineProps<{
  label: string
  value: number | string
  iconPath: string
  accent: 'blue' | 'orange' | 'cyan' | 'green' | 'purple'
  trendPercent: number
  trendDirection: 'up' | 'down' | 'flat'
  trendSuffix: string
  sparklinePoints: number[]
}>()

const trendSymbol = computed(() => (props.trendDirection === 'up' ? '↑' : props.trendDirection === 'down' ? '↓' : ''))
</script>

<template>
  <div class="kpi-v2" :class="`kpi-v2-${accent}`">
    <div class="kpi-v2-icon">
      <svg viewBox="0 0 24 24"><path :d="iconPath" /></svg>
    </div>
    <div class="kpi-v2-body">
      <strong class="kpi-v2-value">{{ value }}</strong>
      <span class="kpi-v2-label">{{ label }}</span>
    </div>
    <div class="kpi-v2-trend" :class="`trend-${trendDirection}`">
      <span class="kpi-v2-trend-value">{{ trendSymbol }} {{ Math.abs(trendPercent) }}%</span>
      <span class="kpi-v2-trend-suffix">{{ trendSuffix }}</span>
    </div>
    <Sparkline class="kpi-v2-spark" :points="sparklinePoints" :color="`var(--dash-${accent})`" />
  </div>
</template>
