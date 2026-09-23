<script setup lang="ts">
import { computed } from 'vue'
import type { StarDistribution } from '@/stores/statistics'

const props = defineProps<{ distribution: StarDistribution }>()

const total = computed(() => props.distribution.reduce((a, b) => a + b, 0))

const rows = computed(() =>
  [5, 4, 3, 2, 1].map((stars) => {
    const count = props.distribution[stars - 1] ?? 0
    return { stars, count, percent: total.value ? (count / total.value) * 100 : 0 }
  }),
)
</script>

<template>
  <div class="star-dist">
    <div v-for="row in rows" :key="row.stars" class="star-dist-row">
      <span class="star-dist-label">{{ row.stars }} ★</span>
      <span class="star-dist-bar"><span :style="{ width: `${row.percent}%` }" /></span>
      <span class="star-dist-count">{{ row.count }}</span>
    </div>
  </div>
</template>
