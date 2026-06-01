<script setup lang="ts">
import { computed } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

interface GrantRow {
  faculty: string
  total: number
  used: number
}

const grantRows: GrantRow[] = [
  { faculty: 'Ingliz tili fakulteti', total: 120, used: 118 },
  { faculty: 'Roman-german fakulteti', total: 85, used: 80 },
  { faculty: 'Sharq tillari fakulteti', total: 60, used: 57 },
  { faculty: 'Tarjima fakulteti', total: 45, used: 45 },
]

const totals = computed(() => {
  const total = grantRows.reduce((s, r) => s + r.total, 0)
  const used = grantRows.reduce((s, r) => s + r.used, 0)
  return { total, used, free: total - used }
})
</script>

<template>
  <DashboardLayout>
    <h1>Ta'lim granti</h1>
    <p class="services-subtitle">Davlat granti o'rinlari taqsimoti va holati.</p>

    <!-- Talaba ko'rinishi: shaxsiy grant holati -->
    <div v-if="!authStore.isStaff" class="grant-status-card">
      <div class="grant-badge">Grant</div>
      <div>
        <h3>Sizning grant holatingiz</h3>
        <p>
          Hozirgi semestrda <strong>davlat granti</strong> asosida o'qiyapsiz. Keyingi semestr uchun
          reyting natijalari e'lon qilingach holat yangilanadi.
        </p>
      </div>
    </div>

    <div class="kpi-row">
      <div class="kpi-card kpi-blue">
        <strong>{{ totals.total }}</strong>
        <span>Jami grant o'rinlari</span>
      </div>
      <div class="kpi-card kpi-green">
        <strong>{{ totals.used }}</strong>
        <span>Band qilingan</span>
      </div>
      <div class="kpi-card kpi-amber">
        <strong>{{ totals.free }}</strong>
        <span>Bo'sh o'rinlar</span>
      </div>
    </div>

    <article class="chart-card">
      <h3>Fakultetlar kesimida</h3>
      <div class="staff-table-wrap">
        <table class="staff-table">
          <thead>
            <tr>
              <th>Fakultet</th>
              <th>Jami</th>
              <th>Band</th>
              <th>Bo'sh</th>
              <th>To'ldirilganligi</th>
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
