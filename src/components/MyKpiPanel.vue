<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useLocaleStore } from '@/stores/locale'
import { useStatisticsStore } from '@/stores/statistics'
import StarDistribution from '@/components/stats/StarDistribution.vue'

/** `standalone` — o'zi ma'lumot yuklaydi va o'zining 6/12 oy tanlovini ko'rsatadi
 * (Murojaatlar sahifasi). Statistika sahifasida davrni sahifaning o'zi boshqaradi
 * va `fetchAll()` my-kpi'ni ham yuklaydi, shuning uchun u yerda `false`. */
const props = withDefaults(defineProps<{ standalone?: boolean; allowEmployeeSelect?: boolean }>(), {
  standalone: false,
  allowEmployeeSelect: false,
})

const authStore = useAuthStore()
const localeStore = useLocaleStore()
const statsStore = useStatisticsStore()
const m = computed(() => localeStore.m)

const loading = ref(false)
const showEmployeeSelect = computed(() => props.allowEmployeeSelect && authStore.isAdmin)
const selectedEmployeeId = ref<number | ''>(showEmployeeSelect.value ? (statsStore.myKpiEmployeeId ?? '') : '')

async function load() {
  loading.value = true
  try {
    await statsStore.fetchMyKpi(selectedEmployeeId.value === '' ? null : selectedEmployeeId.value)
  } finally {
    loading.value = false
  }
}

/**
 * Xodim tanlash ro'yxati ATAYLAB `statistics/employees/` dan to'ldiriladi,
 * `staffStore.members` dan EMAS. Sabablari:
 *  1. `staffStore.members` — `/auth/users/` ustidan cheklangan sahifali skan
 *     (23 000+ talaba aralash keladi), ya'ni xodimlarning bir qismi ro'yxatga
 *     umuman tushmasdi — admin ularning KPI'sini tanlay olmasdi.
 *  2. `my-kpi` faqat murojaatlarga javob beradigan xodim (operator) uchun
 *     ma'noga ega. `statistics/employees/` aynan shu xodimlarni qaytaradi,
 *     shu sabab ro'yxatda KPI'si bo'sh chiqadigan odam bo'lmaydi.
 */
onMounted(() => {
  if (props.standalone) void load()
  if (showEmployeeSelect.value && !statsStore.employees.length) void statsStore.fetchEmployees()
})

const kpi = computed(() => statsStore.myKpi)

const monthMax = computed(() =>
  Math.max(1, ...(kpi.value?.months ?? []).map((row) => row.completed + row.notCompleted + row.overdue)),
)

function barWidth(value: number) {
  return `${(value / monthMax.value) * 100}%`
}
</script>

<template>
  <article class="panel-v2 my-kpi-panel">
    <div class="panel-v2-head">
      <h3>
        <svg class="panel-v2-icon" viewBox="0 0 24 24">
          <path d="M12 2 1 8l11 6 9-4.9V17h2V8L12 2Zm0 8.4L4.2 6.4 12 4l7.8 2.4L12 10.4ZM5 12.2v3.6c0 2 3.1 3.6 7 3.6s7-1.6 7-3.6v-3.6l-7 3.8-7-3.8Z" />
        </svg>
        {{ m.statistics.myKpiTitle }}
      </h3>
      <div class="my-kpi-controls">
        <span v-if="showEmployeeSelect" class="select-wrap my-kpi-employee-select">
          <select v-model="selectedEmployeeId" class="field-input" @change="load">
            <option value="">{{ m.statistics.myKpiMineOption }}</option>
            <option v-for="employee in statsStore.employees" :key="employee.id" :value="employee.id">
              {{ employee.fullName }}
            </option>
          </select>
          <svg class="select-arrow" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
        </span>
      </div>
    </div>

    <p v-if="loading && !kpi" class="appeal-empty">{{ m.grant.loading }}</p>
    <p v-else-if="!kpi" class="form-error">{{ statsStore.myKpiError || m.statistics.myKpiLoadError }}</p>
    <template v-else>
      <div class="my-kpi-row">
        <div class="my-kpi-item is-completed">
          <strong>{{ kpi.completed }}</strong>
          <span>{{ m.statistics.myKpiCompleted }}</span>
        </div>
        <div class="my-kpi-item is-not-completed">
          <strong>{{ kpi.notCompleted }}</strong>
          <span>{{ m.statistics.myKpiNotCompleted }}</span>
        </div>
        <div class="my-kpi-item is-overdue">
          <strong>{{ kpi.overdue }}</strong>
          <span>{{ m.statistics.myKpiOverdue }}</span>
          <small v-if="kpi.onTime || kpi.late">
            {{ m.statistics.myKpiOnTime }}: {{ kpi.onTime }} · {{ m.statistics.myKpiLate }}: {{ kpi.late }}
          </small>
        </div>
        <div v-if="kpi.openNow !== null" class="my-kpi-item is-open">
          <strong>{{ kpi.openNow }}</strong>
          <span>{{ m.statistics.myKpiOpenNow }}</span>
        </div>
        <div class="my-kpi-item is-response">
          <strong>{{ kpi.avgResponseHours === null ? '—' : Math.round(kpi.avgResponseHours * 10) / 10 }}</strong>
          <span>{{ m.statistics.myKpiAvgResponse }}</span>
          <small>{{ m.statistics.myKpiHoursUnit }}</small>
        </div>
        <div class="my-kpi-item is-rating">
          <strong>{{ kpi.ratingCount ? `${kpi.avgRating.toFixed(1)} ★` : '—' }}</strong>
          <span>{{ m.statistics.myKpiAvgRating }}</span>
          <small>{{ kpi.ratingCount }} {{ m.statistics.myKpiRatingsUnit }}</small>
        </div>
      </div>

      <div v-if="kpi.ratingCount" class="my-kpi-months">
        <h4>{{ m.statistics.myKpiDistributionTitle }}</h4>
        <StarDistribution :distribution="kpi.ratingDistribution" />
      </div>

      <div class="my-kpi-months">
        <h4>{{ m.statistics.myKpiMonthlyTitle }}</h4>
        <p v-if="!kpi.months.length" class="appeal-empty">{{ m.statistics.myKpiNoData }}</p>
        <div v-for="row in kpi.months" :key="row.label" class="my-kpi-month">
          <span class="my-kpi-month-label">{{ row.label }}</span>
          <span class="my-kpi-month-bar">
            <span class="is-completed" :style="{ width: barWidth(row.completed) }" :title="m.statistics.myKpiCompleted" />
            <span class="is-not-completed" :style="{ width: barWidth(row.notCompleted) }" :title="m.statistics.myKpiNotCompleted" />
            <span class="is-overdue" :style="{ width: barWidth(row.overdue) }" :title="m.statistics.myKpiOverdue" />
          </span>
          <span class="my-kpi-month-values">{{ row.completed }} / {{ row.notCompleted }} / {{ row.overdue }}</span>
        </div>
        <div v-if="kpi.months.length" class="my-kpi-legend">
          <span><i class="is-completed" />{{ m.statistics.myKpiCompleted }}</span>
          <span><i class="is-not-completed" />{{ m.statistics.myKpiNotCompleted }}</span>
          <span><i class="is-overdue" />{{ m.statistics.myKpiOverdue }}</span>
        </div>
      </div>
    </template>
  </article>
</template>
