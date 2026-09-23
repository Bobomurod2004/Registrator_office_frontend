<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import KpiCard from '@/components/stats/KpiCard.vue'
import LiveClockCard from '@/components/stats/LiveClockCard.vue'
import CircularProgress from '@/components/stats/CircularProgress.vue'
import LineChart from '@/components/stats/LineChart.vue'
import PieChart from '@/components/stats/PieChart.vue'
import Heatmap from '@/components/stats/Heatmap.vue'
import MyKpiPanel from '@/components/MyKpiPanel.vue'
import StaffPerformancePanel from '@/components/stats/StaffPerformancePanel.vue'
import RatingsPanel from '@/components/stats/RatingsPanel.vue'
import { useAuthStore } from '@/stores/auth'
import { useLocaleStore } from '@/stores/locale'
import { useStatisticsStore, type TrendPoint } from '@/stores/statistics'
import { extractApiError } from '@/services/http'

const authStore = useAuthStore()
const localeStore = useLocaleStore()
const m = computed(() => localeStore.m)
const statsStore = useStatisticsStore()

const lastUpdatedAt = ref(new Date())
const refreshing = ref(false)

async function loadAll() {
  await statsStore.fetchAll(m.value.statistics.weekdaysShort, m.value.statistics.hourBuckets)
  lastUpdatedAt.value = new Date()
}

async function refreshNow() {
  refreshing.value = true
  try {
    await loadAll()
  } finally {
    refreshing.value = false
  }
}

type StatsTab = 'overview' | 'staff' | 'ratings'
const activeTab = ref<StatsTab>('overview')
const staffLoaded = ref(false)
const ratingsLoaded = ref(false)

/** Xodimlar reytingi va baholar faqat o'z tabi ochilganda (bir marta) yuklanadi. */
function openTab(tab: StatsTab) {
  activeTab.value = tab
  if (tab === 'staff' && !staffLoaded.value) {
    staffLoaded.value = true
    void statsStore.fetchEmployees()
  }
  if (tab === 'ratings' && !ratingsLoaded.value) {
    ratingsLoaded.value = true
    void statsStore.fetchRatings()
  }
}

onMounted(() => {
  loadAll()
})

type TrendMode = 'monthly' | 'weekly'
const trendMode = ref<TrendMode>('monthly')
const weeklyLoaded = ref(false)

function setTrendMode(mode: TrendMode) {
  trendMode.value = mode
  if (mode === 'weekly' && !weeklyLoaded.value) {
    weeklyLoaded.value = true
    void statsStore.fetchWeekly(12)
  }
}

const trendPoints = computed(() => (trendMode.value === 'weekly' ? statsStore.weeklyTrend : statsStore.monthlyTrend))

function trendTooltip(p: TrendPoint) {
  const s = m.value.statistics
  const parts = [
    `${s.trendReceived}: ${p.count}`,
    `${s.trendCompleted}: ${p.completed}`,
    `${s.trendRejected}: ${p.rejected}`,
    `${s.myKpiOnTime}: ${p.onTime}`,
    `${s.myKpiLate}: ${p.late}`,
    `SLA: ${p.slaPercent === null ? '—' : `${p.slaPercent}%`}`,
  ]
  if (p.avgResponseHours !== null) parts.push(`${s.myKpiAvgResponse}: ${p.avgResponseHours} ${s.myKpiHoursUnit}`)
  return parts.join('\n')
}

const ICONS = {
  total: 'M6 4h9l3 3v13H6V4Zm8 1.5V8h2.5L14 5.5ZM8 11h8v1.5H8V11Zm0 3h8v1.5H8V14Zm0 3h5v1.5H8V17Z',
  new: 'M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9Zm.75 9.75V7h-1.5v6.31l4.15 4.15 1.06-1.06Z',
  progress: 'M6 2h12v2l-4.5 4.5V9h-3v-.5L6 4V2Zm0 20v-2l4.5-4.5V15h3v.5L18 20v2H6Z',
  resolved: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm-1.5 14.5-4-4 1.4-1.4 2.6 2.6 6.6-6.6 1.4 1.4Z',
  staff: 'M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-8 1a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm0 2c-2.3 0-5 1.2-5 3.5V20h6v-2.5c0-1 .4-1.9 1-2.7A8 8 0 0 0 8 14Zm8 0c-2.7 0-6 1.4-6 4v2h12v-2c0-2.6-3.3-4-6-4Z',
}

function trendDirection(percent: number): 'up' | 'down' | 'flat' {
  if (percent > 0) return 'up'
  if (percent < 0) return 'down'
  return 'flat'
}

const kpis = computed(() => {
  const ov = statsStore.overview
  const blank = { value: 0, changePercent: 0, trend: [0, 0, 0, 0, 0, 0, 0] }
  return [
    { key: 'total', label: m.value.statistics.totalAppeals, icon: ICONS.total, accent: 'blue' as const, block: ov?.total ?? blank },
    { key: 'new', label: m.value.statistics.newAppeals, icon: ICONS.new, accent: 'orange' as const, block: ov?.new ?? blank },
    { key: 'progress', label: m.value.statistics.inProgress, icon: ICONS.progress, accent: 'cyan' as const, block: ov?.inProgress ?? blank },
    { key: 'resolved', label: m.value.statistics.resolved, icon: ICONS.resolved, accent: 'green' as const, block: ov?.completed ?? blank },
    { key: 'staff', label: m.value.statistics.staffCount, icon: ICONS.staff, accent: 'purple' as const, block: ov?.staff ?? blank },
  ]
})

const yAxisTop = computed(() => {
  const max = Math.max(1, ...trendPoints.value.map((p) => p.count))
  return Math.ceil(max / 25) * 25 || 25
})
const yAxisSteps = computed(() => [yAxisTop.value, yAxisTop.value * 0.75, yAxisTop.value * 0.5, yAxisTop.value * 0.25, 0])

const CATEGORY_COLORS: Record<string, string> = {
  reference: 'var(--dash-green)',
  financial: 'var(--dash-blue)',
  academic: 'var(--dash-cyan)',
  science: 'var(--dash-orange)',
}

const categoryPieSlices = computed(() =>
  statsStore.categoryBreakdown.map((c) => ({
    label: c.label,
    value: c.count,
    color: CATEGORY_COLORS[c.key] ?? 'var(--dash-purple)',
  })),
)

const genderSeries = computed(() => [
  { name: m.value.statistics.male, color: 'var(--dash-blue)', values: statsStore.genderMonthly.map((p) => p.male) },
  { name: m.value.statistics.female, color: 'var(--dash-purple)', values: statsStore.genderMonthly.map((p) => p.female) },
])
const genderLabels = computed(() => statsStore.genderMonthly.map((p) => p.label))

/** `slaPercent: null` (davrda yopilgan murojaat yo'q) — grafikda 0% emas, uzilish bo'lib chiziladi. */
const slaSeries = computed(() => [
  { name: m.value.statistics.slaTrendTitle, color: 'var(--dash-green)', values: statsStore.monthlyTrend.map((p) => p.slaPercent) },
])
const slaLabels = computed(() => statsStore.monthlyTrend.map((p) => p.label))

const deptYAxisSteps = [100, 75, 50, 25, 0]

const resolvedPercent = computed(
  () => statsStore.statusSummary.find((s) => s.key === 'completed')?.percent ?? 0,
)

const exporting = ref<'pdf' | 'excel' | 'csv' | null>(null)
const exportError = ref('')

async function runExport(format: 'pdf' | 'excel' | 'csv') {
  exporting.value = format
  exportError.value = ''
  try {
    await statsStore.downloadExport(format)
  } catch (err) {
    exportError.value = extractApiError(err, m.value.statistics.exportError)
  } finally {
    exporting.value = null
  }
}

async function exportPdf() {
  await runExport('pdf')
}
async function exportExcelRaw() {
  await runExport('excel')
}
async function exportCsv() {
  await runExport('csv')
}
</script>

<template>
  <DashboardLayout>
    <div class="stats-dashboard-v2">
      <div class="stats-header-row-v2">
        <div>
          <h1 class="stats-title-v2">{{ m.statistics.title }}<span class="stats-title-dot" /></h1>
          <p class="services-subtitle">{{ m.statistics.subtitle }}</p>
        </div>

        <LiveClockCard :last-updated-at="lastUpdatedAt" :refreshing="refreshing" @refresh="refreshNow" />
      </div>

      <div class="export-toolbar-v2">
        <button type="button" class="appeal-btn export-btn-v2" :disabled="exporting !== null" @click="exportPdf">
          <svg viewBox="0 0 24 24"><path d="M6 2h9l5 5v15H6V2Zm8 1.5V8h4.5L14 3.5ZM8 13h2.2c1.3 0 2.1.8 2.1 2s-.8 2-2.1 2H9v2H8v-6Zm1 1v2h1.2c.6 0 1-.3 1-1s-.4-1-1-1H9Zm4.5-1H15c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2h-1.5v-6Zm1 1v4H15c.5 0 1-.4 1-1v-2c0-.6-.5-1-1-1h-.5Z" /></svg>
          {{ exporting === 'pdf' ? m.statistics.exporting : m.statistics.exportPdf }}
        </button>
        <button type="button" class="appeal-btn export-btn-v2" :disabled="exporting !== null" @click="exportExcelRaw">
          <svg viewBox="0 0 24 24"><path d="M5 20h14v-2H5v2ZM13 4h-2v9.17L7.5 9.67 6.09 11.08 12 17l5.91-5.92L16.5 9.67 13 13.17V4Z" /></svg>
          {{ exporting === 'excel' ? m.statistics.exporting : m.statistics.exportExcelRaw }}
        </button>
        <button type="button" class="appeal-btn export-btn-v2" :disabled="exporting !== null" @click="exportCsv">
          <svg viewBox="0 0 24 24"><path d="M5 20h14v-2H5v2ZM13 4h-2v9.17L7.5 9.67 6.09 11.08 12 17l5.91-5.92L16.5 9.67 13 13.17V4Z" /></svg>
          {{ exporting === 'csv' ? m.statistics.exporting : m.statistics.exportCsv }}
        </button>
      </div>

      <p v-if="exportError" class="form-error">{{ exportError }}</p>
      <p v-if="statsStore.error" class="form-error">{{ statsStore.error }}</p>

      <div v-if="authStore.isStaff" class="services-tabs stats-tabs">
        <button class="btn service-tab-btn" :class="{ active: activeTab === 'overview' }" @click="openTab('overview')">
          {{ m.statistics.tabOverview }}
        </button>
        <button
          v-if="authStore.isAdmin"
          class="btn service-tab-btn"
          :class="{ active: activeTab === 'staff' }"
          @click="openTab('staff')"
        >
          {{ m.statistics.tabStaff }}
        </button>
        <button class="btn service-tab-btn" :class="{ active: activeTab === 'ratings' }" @click="openTab('ratings')">
          {{ m.statistics.tabRatings }}
        </button>
      </div>

      <StaffPerformancePanel v-if="activeTab === 'staff' && authStore.isAdmin" />
      <RatingsPanel v-else-if="activeTab === 'ratings'" />

      <template v-else>
      <div class="kpi-row-v2">
        <KpiCard
          v-for="kpi in kpis"
          :key="kpi.key"
          :label="kpi.label"
          :value="kpi.block.value"
          :icon-path="kpi.icon"
          :accent="kpi.accent"
          :trend-percent="Math.abs(kpi.block.changePercent)"
          :trend-direction="trendDirection(kpi.block.changePercent)"
          :trend-suffix="m.statistics.trendSuffix"
          :sparkline-points="kpi.block.trend"
        />
      </div>

      <div class="chart-grid-v2">
        <article class="panel-v2">
          <div class="panel-v2-head">
            <h3>
              <svg class="panel-v2-icon" viewBox="0 0 24 24">
                <path d="M3 3h2v18H3V3Zm4 10h3v8H7v-8Zm5-6h3v14h-3V7Zm5 3h3v11h-3V10Z" />
              </svg>
              {{ trendMode === 'weekly' ? m.statistics.weeklyTitle : m.statistics.monthlyTitle }}
            </h3>
            <div class="trend-toggle">
              <button type="button" :class="{ active: trendMode === 'monthly' }" @click="setTrendMode('monthly')">
                {{ m.statistics.trendMonthly }}
              </button>
              <button type="button" :class="{ active: trendMode === 'weekly' }" @click="setTrendMode('weekly')">
                {{ m.statistics.trendWeekly }}
              </button>
            </div>
          </div>

          <p v-if="trendMode === 'weekly' && statsStore.weeklyError" class="form-error">{{ statsStore.weeklyError }}</p>
          <div class="bar-chart-wrap-v2">
            <div class="bar-y-axis-v2">
              <span v-for="step in yAxisSteps" :key="step">{{ step }}</span>
            </div>
            <div class="bar-chart-v2" :class="{ 'is-dense': trendPoints.length > 8 }">
              <div v-for="(p, i) in trendPoints" :key="`${p.label}-${i}`" class="bar-col-v2" :title="trendTooltip(p)">
                <div class="bar-v2" :style="{ height: `${(p.count / yAxisTop) * 100}%` }">
                  <span class="bar-value-v2">{{ p.count }}</span>
                </div>
                <span class="bar-label-v2">{{ p.label }}</span>
              </div>
            </div>
          </div>
        </article>

        <article class="panel-v2">
          <h3>
            <svg class="panel-v2-icon" viewBox="0 0 24 24">
              <path d="M11 3.06V13h9.94A9 9 0 0 0 11 3.06ZM9 5.08A9 9 0 1 0 18.92 15H9V5.08Z" />
            </svg>
            {{ m.statistics.typesTitle }}
          </h3>
          <PieChart :slices="categoryPieSlices" />
        </article>
      </div>

      <div class="chart-grid-v2">
        <article class="panel-v2">
          <h3>
            <svg class="panel-v2-icon" viewBox="0 0 24 24">
              <path d="M3 3h2v18H3V3Zm3.6 14.6 4-5 3 3 5.6-6.6L20.6 10l-7 8.3-3-3-3.4 4.2-2-1.9Z" />
            </svg>
            {{ m.statistics.genderChartTitle }}
          </h3>
          <LineChart :labels="genderLabels" :series="genderSeries" />
        </article>

        <article class="panel-v2">
          <h3>
            <svg class="panel-v2-icon" viewBox="0 0 24 24">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 15h-2v-2h2Zm0-4h-2V7h2Z" />
            </svg>
            {{ m.statistics.slaTrendTitle }}
          </h3>
          <LineChart :labels="slaLabels" :series="slaSeries" suffix="%" :max="100" />
          <p class="line-chart-note">{{ m.statistics.slaNullNote }}</p>
        </article>
      </div>

      <div class="chart-grid-v2">
        <article class="panel-v2">
          <h3>
            <svg class="panel-v2-icon" viewBox="0 0 24 24">
              <path d="M3 3h2v18H3V3Zm4 10h3v8H7v-8Zm5-6h3v14h-3V7Zm5 3h3v11h-3V10Z" />
            </svg>
            {{ m.statistics.departmentPerfTitle }}
          </h3>
          <div class="bar-chart-wrap-v2">
            <div class="bar-y-axis-v2">
              <span v-for="step in deptYAxisSteps" :key="step">{{ step }}</span>
            </div>
            <div class="bar-chart-v2">
              <div v-for="d in statsStore.departmentPerformance" :key="d.label" class="bar-col-v2">
                <div class="bar-v2" :style="{ height: `${d.value}%` }">
                  <span class="bar-value-v2">{{ d.value }}%</span>
                </div>
                <span class="bar-label-v2 dept-label-v2">{{ d.label }}</span>
              </div>
            </div>
          </div>
        </article>

        <article class="panel-v2">
          <h3>
            <svg class="panel-v2-icon" viewBox="0 0 24 24">
              <path d="M3 13h4v8H3v-8Zm7-8h4v16h-4V5Zm7 4h4v12h-4V9Z" />
            </svg>
            {{ m.statistics.heatmapTitle }}
          </h3>
          <Heatmap :rows="statsStore.heatmap.rows" :cols="statsStore.heatmap.cols" :data="statsStore.heatmap.data" />
        </article>
      </div>

      <!-- SuperAdmin murojaatlarga javob beruvchi xodim bo'lmasligi mumkin;
           uning bo'sh shaxsiy KPI'si o'rniga "Xodimlar" tabida barcha xodim
           ko'rsatkichlari chiqadi. -->
      <MyKpiPanel v-if="authStore.isStaff && !authStore.isSuperAdmin" allow-employee-select />

      <article class="panel-v2 summary-panel-v2">
        <div class="summary-particles" />

        <CircularProgress :percent="resolvedPercent" color-from="var(--dash-cyan)" color-to="var(--dash-blue)" />

        <div class="summary-body">
          <h3>{{ m.statistics.overallStatusTitle }}</h3>

          <div class="status-bar-v2">
            <span
              v-for="s in statsStore.statusSummary"
              :key="s.key"
              class="status-bar-v2-segment"
              :style="{ width: `${s.percent}%`, background: s.color }"
            />
          </div>

          <div class="status-legend-v2">
            <span v-for="s in statsStore.statusSummary" :key="s.key" class="status-legend-v2-item">
              <span class="legend-dot-v2" :style="{ background: s.color }" />
              <span class="status-legend-v2-text">{{ s.label }}<strong>{{ s.count }} ({{ s.percent }}%)</strong></span>
            </span>
          </div>
        </div>
      </article>
      </template>
    </div>
  </DashboardLayout>
</template>
