<script setup lang="ts">
import { computed } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import { useAppealsStore } from '@/stores/appeals'
import { useStaffStore } from '@/stores/staff'

const appealsStore = useAppealsStore()
const staffStore = useStaffStore()

const kpis = computed(() => [
  { label: 'Jami murojaatlar', value: appealsStore.total, accent: 'blue' },
  { label: 'Yangi murojaatlar', value: appealsStore.newCount, accent: 'amber' },
  { label: 'Hal qilingan', value: appealsStore.resolvedCount, accent: 'green' },
  { label: 'Xodimlar', value: staffStore.members.length, accent: 'violet' },
])

const monthly = [
  { label: 'Yan', value: 42 },
  { label: 'Fev', value: 58 },
  { label: 'Mar', value: 75 },
  { label: 'Apr', value: 63 },
  { label: 'May', value: 88 },
  { label: 'Iyun', value: 71 },
]
const maxMonthly = Math.max(...monthly.map((m) => m.value))

const byCategory = computed(() => {
  const total = appealsStore.total || 1
  const onsite = appealsStore.appeals.filter((a) => a.category === 'onsite').length
  const general = appealsStore.appeals.filter((a) => a.category === 'general').length
  return [
    { label: 'Umumiy murojaatlar', value: general, percent: Math.round((general / total) * 100) },
    { label: 'Joyida hal qilinadigan', value: onsite, percent: Math.round((onsite / total) * 100) },
  ]
})
</script>

<template>
  <DashboardLayout>
    <h1>Statistika</h1>
    <p class="services-subtitle">Platforma bo'yicha umumiy ko'rsatkichlar va dinamika.</p>

    <div class="kpi-row">
      <div v-for="kpi in kpis" :key="kpi.label" class="kpi-card" :class="`kpi-${kpi.accent}`">
        <strong>{{ kpi.value }}</strong>
        <span>{{ kpi.label }}</span>
      </div>
    </div>

    <div class="chart-grid">
      <article class="chart-card">
        <h3>Oylik murojaatlar dinamikasi</h3>
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
        <h3>Murojaat turlari</h3>
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
