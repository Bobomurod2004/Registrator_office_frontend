<script setup lang="ts">
import { computed } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useLocaleStore } from '@/stores/locale'

const authStore = useAuthStore()
const localeStore = useLocaleStore()
const m = computed(() => localeStore.m)

const seats = [
  { total: 120, used: 118 },
  { total: 85, used: 80 },
  { total: 60, used: 57 },
  { total: 45, used: 45 },
]

const grantRows = computed(() =>
  seats.map((s, idx) => ({
    faculty: m.value.grant.faculties[idx] ?? '',
    total: s.total,
    used: s.used,
  })),
)

const totals = computed(() => {
  const total = seats.reduce((s, r) => s + r.total, 0)
  const used = seats.reduce((s, r) => s + r.used, 0)
  return { total, used, free: total - used }
})
</script>

<template>
  <DashboardLayout>
    <h1>{{ m.grant.title }}</h1>
    <p class="services-subtitle">{{ m.grant.subtitle }}</p>

    <!-- Talaba ko'rinishi: shaxsiy grant holati -->
    <div v-if="!authStore.isStaff" class="grant-status-card">
      <div class="grant-badge">{{ m.grant.badge }}</div>
      <div>
        <h3>{{ m.grant.statusTitle }}</h3>
        <p>{{ m.grant.statusText }}</p>
      </div>
    </div>

    <div class="kpi-row">
      <div class="kpi-card kpi-blue">
        <strong>{{ totals.total }}</strong>
        <span>{{ m.grant.totalSeats }}</span>
      </div>
      <div class="kpi-card kpi-green">
        <strong>{{ totals.used }}</strong>
        <span>{{ m.grant.used }}</span>
      </div>
      <div class="kpi-card kpi-amber">
        <strong>{{ totals.free }}</strong>
        <span>{{ m.grant.free }}</span>
      </div>
    </div>

    <article class="chart-card">
      <h3>{{ m.grant.byFaculty }}</h3>
      <div class="staff-table-wrap">
        <table class="staff-table">
          <thead>
            <tr>
              <th>{{ m.grant.colFaculty }}</th>
              <th>{{ m.grant.colTotal }}</th>
              <th>{{ m.grant.colUsed }}</th>
              <th>{{ m.grant.colFree }}</th>
              <th>{{ m.grant.colFill }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in grantRows" :key="row.faculty">
              <td>{{ row.faculty }}</td>
              <td>{{ row.total }}</td>
              <td>{{ row.used }}</td>
              <td>{{ row.total - row.used }}</td>
              <td>
                <div class="progress-track sm">
                  <div class="progress-fill" :style="{ width: `${(row.used / row.total) * 100}%` }" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  </DashboardLayout>
</template>
