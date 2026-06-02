<script setup lang="ts">
import { computed } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import { useAppealsStore } from '@/stores/appeals'
import { useStaffStore } from '@/stores/staff'
import { useLocaleStore } from '@/stores/locale'

const appealsStore = useAppealsStore()
const staffStore = useStaffStore()
const localeStore = useLocaleStore()
const m = computed(() => localeStore.m)

const kpis = computed(() => [
  { label: m.value.statistics.totalAppeals, value: appealsStore.total, accent: 'blue' },
  { label: m.value.statistics.newAppeals, value: appealsStore.newCount, accent: 'amber' },
  { label: m.value.statistics.resolved, value: appealsStore.resolvedCount, accent: 'green' },
  { label: m.value.statistics.staffCount, value: staffStore.members.length, accent: 'violet' },
])

const monthlyValues = [42, 58, 75, 63, 88, 71]
const monthly = computed(() =>
  monthlyValues.map((value, idx) => ({ label: m.value.statistics.months[idx] ?? '', value })),
)
const maxMonthly = Math.max(...monthlyValues)

const byCategory = computed(() => {
  const total = appealsStore.total || 1
  const onsite = appealsStore.appeals.filter((a) => a.category === 'onsite').length
  const general = appealsStore.appeals.filter((a) => a.category === 'general').length
  return [
    {
      label: m.value.statistics.general,
      value: general,
      percent: Math.round((general / total) * 100),
    },
    {
      label: m.value.statistics.onsite,
      value: onsite,
      percent: Math.round((onsite / total) * 100),
    },
  ]
})
</script>

<template>
  <DashboardLayout>
    <h1>{{ m.statistics.title }}</h1>
    <p class="services-subtitle">{{ m.statistics.subtitle }}</p>

    <div class="kpi-row">
      <div v-for="kpi in kpis" :key="kpi.label" class="kpi-card" :class="`kpi-${kpi.accent}`">
        <strong>{{ kpi.value }}</strong>
        <span>{{ kpi.label }}</span>
      </div>
    </div>

    <div class="chart-grid">
      <article class="chart-card">
        <h3>{{ m.statistics.monthlyTitle }}</h3>
        <div class="bar-chart">
          <div v-for="m in monthly" :key="m.label" class="bar-col">
            <div class="bar" :style="{ height: `${(m.value / maxMonthly) * 100}%` }">
              <span class="bar-value">{{ m.value }}</span>
            </div>
            <span class="bar-label">{{ m.label }}</span>
          </div>
        </div>
      </article>

      <article class="chart-card">
        <h3>{{ m.statistics.typesTitle }}</h3>
        <div class="progress-list">
          <div v-for="c in byCategory" :key="c.label" class="progress-row">
            <div class="progress-head">
              <span>{{ c.label }}</span>
              <strong>{{ c.value }} ({{ c.percent }}%)</strong>
            </div>
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: `${c.percent}%` }" />
            </div>
          </div>
        </div>
      </article>
    </div>
  </DashboardLayout>
</template>
