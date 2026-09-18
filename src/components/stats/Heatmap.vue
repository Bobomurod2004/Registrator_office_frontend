<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ rows: string[]; cols: string[]; data: number[][] }>()

const maxValue = computed(() => Math.max(1, ...props.data.flat()))

function cellStyle(value: number) {
  const intensity = value / maxValue.value
  return {
    background: `rgba(20, 140, 255, ${0.08 + intensity * 0.72})`,
    boxShadow: intensity > 0.7 ? '0 0 10px rgba(8, 217, 255, 0.35)' : 'none',
  }
}
</script>

<template>
  <div class="heatmap-v2">
    <div class="heatmap-cols">
      <span class="heatmap-corner" />
      <span v-for="c in cols" :key="c" class="heatmap-col-label">{{ c }}</span>
    </div>
    <div v-for="(row, rIdx) in rows" :key="row" class="heatmap-row">
      <span class="heatmap-row-label">{{ row }}</span>
      <span
        v-for="(cell, cIdx) in data[rIdx]"
        :key="cIdx"
        class="heatmap-cell"
        :style="cellStyle(cell)"
        :title="`${row} · ${cols[cIdx]}: ${cell}`"
      >{{ cell }}</span>
    </div>
  </div>
</template>
