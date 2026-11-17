<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { extractApiError } from '@/services/http'
import { useLocaleStore } from '@/stores/locale'
import { useLeadershipAppealsStore } from '@/stores/leadershipAppeals'

/** Rahbariyat murojaatlari statistikasi (`GET /appeals/stats/`). */
const localeStore = useLocaleStore()
const store = useLeadershipAppealsStore()
const m = computed(() => localeStore.m.leadership)

const loading = ref(false)
const error = ref('')

onMounted(load)

async function load() {
  loading.value = true
  error.value = ''
  try {
    await store.fetchStats()
  } catch (err) {
    error.value = extractApiError(err, m.value.stats.loadError)
  } finally {
    loading.value = false
  }
}

const total = computed(() => store.stats?.total ?? 0)

function pct(count: number, base: number): number {
  return base > 0 ? Math.round((count / base) * 100) : 0
}

function statusLabel(status: string, fallback: string): string {
  return (m.value.statuses as Record<string, string>)[status] ?? fallback
}

function applicantLabel(type: string, fallback: string): string {
  return (m.value.applicantTypes as Record<string, string>)[type] ?? fallback
}

/**
 * Backend faqat murojaati bor oylarni qaytaradi — grafik uzilmasligi uchun
 * birinchi va oxirgi oy orasidagi bo'sh oylar 0 bilan to'ldiriladi.
 */
const monthlySeries = computed(() => {
  const data = store.stats?.monthly ?? []
  if (!data.length) return []
  const sorted = [...data].sort((a, b) => a.month.localeCompare(b.month))
  const counts = new Map(sorted.map((x) => [x.month, x.count]))
  const parse = (value: string) => {
    const [year = 0, month = 1] = value.split('-').map(Number)
    return { year, month }
  }
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  if (!first || !last) return []
  const start = parse(first.month)
  const end = parse(last.month)
  const series: { month: string; count: number }[] = []
  let year = start.year
  let month = start.month
  while ((year < end.year || (year === end.year && month <= end.month)) && series.length < 240) {
    const key = `${year}-${String(month).padStart(2, '0')}`
    series.push({ month: key, count: counts.get(key) ?? 0 })
    month += 1
    if (month > 12) {
      month = 1
      year += 1
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
        <span>{{ m.stats.total }}</span>
        <strong>{{ total }}</strong>
      </div>

      <section class="lap-block">
        <h4>{{ m.stats.byStatus }}</h4>
        <div class="lap-status-cards">
          <div
            v-for="s in store.stats.byStatus"
            :key="s.status"
            class="lap-status-card"
          >
            <span class="lap-status" :class="`is-${s.status}`">{{ statusLabel(s.status, s.label) }}</span>
            <strong>{{ s.count }}</strong>
            <span class="lap-meta">{{ pct(s.count, total) }}%</span>
          </div>
        </div>
      </section>

      <section class="lap-block">
        <h4>{{ m.stats.byApplicant }}</h4>
        <ul class="lap-bars">
          <li v-for="a in store.stats.byApplicantType" :key="a.applicantType">
            <span class="lap-bar-label">{{ applicantLabel(a.applicantType, a.label) }}</span>
            <span class="lap-bar-track"><span class="lap-bar-fill" :style="{ width: pct(a.count, total) + '%' }" /></span>
            <span class="lap-bar-value">{{ a.count }}</span>
          </li>
        </ul>
      </section>

      <section class="lap-block">
        <h4>{{ m.stats.byRecipient }}</h4>
        <p v-if="!store.stats.byRecipient.length" class="lap-meta">{{ m.stats.noData }}</p>
        <ul v-else class="lap-bars">
          <li v-for="r in store.stats.byRecipient" :key="r.recipient">
            <span class="lap-bar-label">{{ r.label }}</span>
            <span class="lap-bar-track"><span class="lap-bar-fill" :style="{ width: pct(r.count, total) + '%' }" /></span>
            <span class="lap-bar-value">{{ r.count }}</span>
          </li>
        </ul>
      </section>

      <section class="lap-block">
        <h4>{{ m.stats.monthly }}</h4>
        <p v-if="!monthlySeries.length" class="lap-meta">{{ m.stats.noData }}</p>
        <div v-else class="lap-months">
          <div v-for="item in monthlySeries" :key="item.month" class="lap-month">
            <span class="lap-month-bar" :style="{ height: Math.max(4, (item.count / monthlyMax) * 100) + '%' }" :title="`${item.month}: ${item.count}`" />
            <span class="lap-month-label">{{ item.month.slice(5) }}</span>
            <span class="lap-month-value">{{ item.count }}</span>
          </div>
        </div>
      </section>
    </template>
  </section>
</template>
