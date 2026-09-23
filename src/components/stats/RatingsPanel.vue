<script setup lang="ts">
import { computed } from 'vue'
import LineChart from '@/components/stats/LineChart.vue'
import StarDistribution from '@/components/stats/StarDistribution.vue'
import { useLocaleStore } from '@/stores/locale'
import { useStatisticsStore } from '@/stores/statistics'
import { formatDateTime } from '@/utils/formatDate'

const statsStore = useStatisticsStore()
const localeStore = useLocaleStore()
const m = computed(() => localeStore.m)
const t = computed(() => m.value.statistics.ratings)
const r = computed(() => statsStore.ratings)

const hasAnyData = computed(
  () => !!r.value && (r.value.count > 0 || r.value.months.length > 0 || r.value.services.length > 0 || r.value.recent.length > 0),
)

const monthlySeries = computed(() => [
  { name: t.value.monthlyAverage, color: 'var(--dash-orange)', values: (r.value?.months ?? []).map((mo) => mo.average) },
])
const monthlyLabels = computed(() => (r.value?.months ?? []).map((mo) => mo.label))

function fmtAvg(avg: number | null) {
  return avg === null ? '—' : avg.toFixed(1)
}
</script>

<template>
  <p v-if="statsStore.ratingsError" class="form-error">{{ statsStore.ratingsError }}</p>
  <p v-else-if="statsStore.ratingsLoading && !r" class="appeal-empty">{{ t.loading }}</p>
  <p v-else-if="!hasAnyData" class="appeal-empty">{{ t.empty }}</p>

  <template v-else-if="r">
    <div class="chart-grid-v2">
      <article class="panel-v2">
        <h3>
          <svg class="panel-v2-icon" viewBox="0 0 24 24">
            <path d="m12 17.3-6.2 3.7 1.6-7L2 9.2l7.1-.6L12 2l2.9 6.6 7.1.6-5.4 4.8 1.6 7Z" />
          </svg>
          {{ t.overall }}
        </h3>
        <div class="ratings-overall">
          <div class="ratings-overall-score">
            <strong>{{ fmtAvg(r.average) }}</strong>
            <span>★</span>
            <small>{{ r.count }} {{ m.statistics.myKpiRatingsUnit }}</small>
          </div>
          <StarDistribution :distribution="r.distribution" />
        </div>
      </article>

      <article class="panel-v2">
        <h3>
          <svg class="panel-v2-icon" viewBox="0 0 24 24">
            <path d="M3 3h2v18H3V3Zm3.6 14.6 4-5 3 3 5.6-6.6L20.6 10l-7 8.3-3-3-3.4 4.2-2-1.9Z" />
          </svg>
          {{ t.monthlyTitle }}
        </h3>
        <LineChart v-if="r.months.length" :labels="monthlyLabels" :series="monthlySeries" :max="5" />
        <p v-else class="appeal-empty">{{ t.empty }}</p>
      </article>
    </div>

    <div class="chart-grid-v2">
      <article class="panel-v2">
        <h3>{{ t.servicesTitle }}</h3>
        <p v-if="!r.services.length" class="appeal-empty">{{ t.empty }}</p>
        <div v-else class="staff-table-wrap">
          <table class="staff-table">
            <thead>
              <tr>
                <th>{{ t.colService }}</th>
                <th>{{ t.colCount }}</th>
                <th>{{ t.colAverage }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in r.services" :key="s.name">
                <td>{{ s.name }}</td>
                <td>{{ s.count }}</td>
                <td>{{ fmtAvg(s.average) }} ★</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="panel-v2">
        <h3>{{ t.recentTitle }}</h3>
        <p v-if="!r.recent.length" class="appeal-empty">{{ t.empty }}</p>
        <ul v-else class="ratings-recent">
          <li v-for="(c, idx) in r.recent" :key="idx">
            <div class="ratings-recent-head">
              <span class="ratings-recent-stars">{{ '★'.repeat(c.stars) }}<span>{{ '★'.repeat(Math.max(0, 5 - c.stars)) }}</span></span>
              <small v-if="c.createdAt">{{ formatDateTime(c.createdAt, localeStore.locale) }}</small>
            </div>
            <p v-if="c.comment">{{ c.comment }}</p>
            <small class="ratings-recent-meta">
              {{ [c.service, c.studentName, c.requestNumber].filter(Boolean).join(' · ') }}
            </small>
          </li>
        </ul>
      </article>
    </div>
  </template>
</template>
