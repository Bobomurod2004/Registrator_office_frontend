<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { extractApiError } from '@/services/http'
import { useLocaleStore } from '@/stores/locale'
import { useCorruptionReportsStore } from '@/stores/corruptionReports'

/** Korrupsiya xabarlari statistikasi (`GET /anti-corruption/stats/`, faqat shu bo'lim uchun). */
const localeStore = useLocaleStore()
const store = useCorruptionReportsStore()
const m = computed(() => localeStore.m.corruption)

const loading = ref(false)
const error = ref('')

onMounted(load)

async function load() {
  loading.value = true
  error.value = ''
  try {
    await store.fetchStats()
  } catch (err) {
    error.value = extractApiError(err, m.value.statsError)
  } finally {
    loading.value = false
  }
}

const total = computed(() => store.stats?.total ?? 0)

function pct(count: number): number {
  return total.value > 0 ? Math.round((count / total.value) * 100) : 0
}

function statusLabel(value: string, fallback: string): string {
  return (m.value.statuses as Record<string, string>)[value] ?? fallback
}

function categoryLabel(value: string, fallback: string): string {
  return (m.value.categories as Record<string, string>)[value] ?? fallback
}

/** Backend faqat xabari bor oylarni qaytaradi — oradagi bo'sh oylar 0 bilan to'ldiriladi. */
const monthlySeries = computed(() => {
  const data = [...(store.stats?.monthly ?? [])].sort((a, b) => a.month.localeCompare(b.month))
  const first = data[0]
  const last = data[data.length - 1]
  if (!first || !last) return []
  const counts = new Map(data.map((x) => [x.month, x.count]))
  const [sy = 0, sm = 1] = first.month.split('-').map(Number)
  const [ey = 0, em = 1] = last.month.split('-').map(Number)
  const series: { month: string; count: number }[] = []
  let y = sy
  let mo = sm
  while ((y < ey || (y === ey && mo <= em)) && series.length < 240) {
    const key = `${y}-${String(mo).padStart(2, '0')}`
    series.push({ month: key, count: counts.get(key) ?? 0 })
    mo += 1
    if (mo > 12) {
      mo = 1
      y += 1
    }
  }
  return series
})

const monthlyMax = computed(() => Math.max(1, ...monthlySeries.value.map((x) => x.count)))
</script>

<template>
  <section class="lap-stats">
    <p v-if="loading" class="appeal-empty">{{ m.loading }}</p>
    <p v-else-if="error" class="form-error">{{ error }}</p>

    <template v-else-if="store.stats">
      <div class="lap-stat-total">
        <span>{{ m.statsTotal }}</span>
        <strong>{{ total }}</strong>
      </div>

      <section class="lap-block">
        <h4>{{ m.statsByStatus }}</h4>
        <div class="lap-status-cards">
          <div v-for="s in store.stats.byStatus" :key="s.status" class="lap-status-card">
            <span class="cr-status" :class="`is-${s.status}`">{{ statusLabel(s.status, s.label) }}</span>
            <strong>{{ s.count }}</strong>
            <span class="lap-meta">{{ pct(s.count) }}%</span>
          </div>
        </div>
      </section>

      <section class="lap-block">
        <h4>{{ m.statsByCategory }}</h4>
        <ul class="lap-bars">
          <li v-for="c in store.stats.byCategory" :key="c.category">
            <span class="lap-bar-label">{{ categoryLabel(c.category, c.label) }}</span>
            <span class="lap-bar-track"><span class="lap-bar-fill" :style="{ width: pct(c.count) + '%' }" /></span>
            <span class="lap-bar-value">{{ c.count }}</span>
          </li>
        </ul>
      </section>

      <section class="lap-block">
        <h4>{{ m.statsMonthly }}</h4>
        <p v-if="!monthlySeries.length" class="lap-meta">{{ m.statsNoData }}</p>
        <div v-else class="lap-months">
          <div v-for="item in monthlySeries" :key="item.month" class="lap-month">
            <span
              class="lap-month-bar"
              :style="{ height: Math.max(4, (item.count / monthlyMax) * 100) + '%' }"
              :title="`${item.month}: ${item.count}`"
            />
            <span class="lap-month-label">{{ item.month.slice(5) }}</span>
            <span class="lap-month-value">{{ item.count }}</span>
          </div>
        </div>
      </section>
    </template>
  </section>
</template>
