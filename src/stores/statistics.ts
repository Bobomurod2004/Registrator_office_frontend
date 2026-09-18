import { defineStore } from 'pinia'
import { ref } from 'vue'
import { http, extractApiError } from '@/services/http'

/** DIQQAT: quyidagi /api/v1/statistics/* endpointlarining javob shakli
 * Swagger sxemasida hujjatlashtirilmagan ("No response body"). Shu sabab
 * har bir parser eng ehtimoliy maydon nomlarini sinab ko'radigan tarzda
 * moslashuvchan yozilgan. Agar backend boshqa maydon nomi qaytarsa, faqat
 * shu fayldagi tegishli normalize funksiyasini tuzatish kifoya. */

export interface KpiBlock {
  value: number
  changePercent: number
  trend: number[]
}

export interface OverviewData {
  total: KpiBlock
  new: KpiBlock
  inProgress: KpiBlock
  completed: KpiBlock
  staff: KpiBlock
  todayCompleted: number
  avgRating: number
}

export interface SeriesPoint {
  label: string
  value: number
}

export interface GenderPoint {
  label: string
  male: number
  female: number
}

export interface CategorySlice {
  key: string
  label: string
  count: number
  percent: number
}

export interface DepartmentPerf {
  label: string
  value: number
}

export interface StatusSlice {
  key: string
  label: string
  count: number
  percent: number
  color: string
}

export interface MyKpi {
  completed: number
  rejected: number
  overdue: number
  avgRating: number
}

function n(v: unknown): number {
  const num = Number(v)
  return Number.isFinite(num) ? num : 0
}

function emptyKpiBlock(): KpiBlock {
  return { value: 0, changePercent: 0, trend: [0, 0, 0, 0, 0, 0, 0] }
}

function normalizeKpiBlock(raw: any): KpiBlock {
  if (raw == null) return emptyKpiBlock()
  if (typeof raw === 'number') return { value: raw, changePercent: 0, trend: [raw, raw, raw, raw, raw, raw, raw] }
  const trend = raw.trend ?? raw.daily_trend ?? raw.last_7_days ?? []
  return {
    value: n(raw.value ?? raw.count ?? raw.total),
    changePercent: n(raw.change_percent ?? raw.change ?? raw.percent_change ?? raw.trend_percent),
    trend: Array.isArray(trend) && trend.length ? trend.map(n) : emptyKpiBlock().trend,
  }
}

/** GET /api/v1/statistics/overview/ — haqiqiy javobda o'zbekcha kalitlar
 * ishlatiladi (Swagger orqali tasdiqlangan): jami_murojaatlar, yangi_murojaatlar,
 * jarayonda, hal_qilingan, xodimlar (har biri {value, change_percent, trend}),
 * bugun_bajarilgan ({value}), ortacha_baholash ({value, count}). */
function normalizeOverview(raw: any): OverviewData {
  const d = raw ?? {}
  return {
    total: normalizeKpiBlock(d.jami_murojaatlar ?? d.total),
    new: normalizeKpiBlock(d.yangi_murojaatlar ?? d.new ?? d.new_requests),
    inProgress: normalizeKpiBlock(d.jarayonda ?? d.in_progress ?? d.inProgress),
    completed: normalizeKpiBlock(d.hal_qilingan ?? d.completed ?? d.resolved),
    staff: normalizeKpiBlock(d.xodimlar ?? d.staff ?? d.staff_count),
    todayCompleted: n(d.bugun_bajarilgan?.value ?? d.today ?? d.today_count),
    avgRating: n(d.ortacha_baholash?.value ?? d.avg_rating ?? d.average_rating),
  }
}

/** Vaqt qatori (monthly-trend, sla-trend) — haqiqiy javob `{ months: [...] }`
 * ko'rinishida (Swagger orqali tasdiqlangan), har bir elementda ham matnli
 * `label` ("Mar"), ham raqamli `month` (3) bor — grafik uchun `label` ustuvor
 * olinishi shart (aks holda "Mar" o'rniga "3" chiqib qolardi). */
function normalizeSeries(raw: any, valueKeys: string[]): SeriesPoint[] {
  const list = Array.isArray(raw) ? raw : (raw?.months ?? null)
  if (Array.isArray(list)) {
    return list.map((item) => {
      const label = item.label ?? item.name ?? item.month ?? ''
      let value = 0
      for (const key of valueKeys) {
        if (item[key] != null) {
          value = n(item[key])
          break
        }
      }
      return { label: String(label), value }
    })
  }
  if (raw && Array.isArray(raw.labels)) {
    const values: number[] = raw.data ?? raw.values ?? []
    return raw.labels.map((label: string, i: number) => ({ label, value: n(values[i]) }))
  }
  return []
}

/** GET /api/v1/statistics/gender-monthly/ — `{ months: [{label, erkak, ayol}] }`. */
function normalizeGenderSeries(raw: any): GenderPoint[] {
  const list = Array.isArray(raw) ? raw : (raw?.months ?? null)
  if (Array.isArray(list)) {
    return list.map((item) => ({
      label: String(item.label ?? item.name ?? item.month ?? ''),
      male: n(item.erkak ?? item.male ?? item.men),
      female: n(item.ayol ?? item.female ?? item.women),
    }))
  }
  if (raw && Array.isArray(raw.labels)) {
    const male: number[] = raw.male ?? []
    const female: number[] = raw.female ?? []
    return raw.labels.map((label: string, i: number) => ({ label, male: n(male[i]), female: n(female[i]) }))
  }
  return []
}

/** GET /api/v1/statistics/category-breakdown/ — `{ total, categories: [{key,label,count,percent}] }`. */
function normalizeCategoryBreakdown(raw: any): CategorySlice[] {
  const list = Array.isArray(raw) ? raw : (raw?.categories ?? raw?.results ?? raw?.items ?? [])
  return list.map((item: any) => ({
    key: item.key ?? item.category ?? '',
    label: item.label ?? item.category_display ?? item.name ?? '',
    count: n(item.count ?? item.value),
    percent: n(item.percent),
  }))
}

/** GET /api/v1/statistics/department-performance/ — `{ departments: [{id,name,total,completed,percent}] }`. */
function normalizeDepartmentPerformance(raw: any): DepartmentPerf[] {
  const list = Array.isArray(raw) ? raw : (raw?.departments ?? raw?.results ?? raw?.items ?? [])
  return list.map((item: any) => ({
    label: item.name ?? item.department_name ?? item.label ?? '',
    value: n(item.percent ?? item.performance_percent ?? item.value),
  }))
}

const STATUS_COLORS: Record<string, string> = {
  new: '#2563eb',
  in_progress: '#eab308',
  redirected: '#c2410c',
  completed: '#16a34a',
  rejected: '#dc2626',
  expired: '#7c4a1e',
  cancelled: '#6b7280',
}

/** GET /api/v1/statistics/status-summary/ — `{ period_months, total, statuses: [{key,label,count,percent}] }`. */
function normalizeStatusSummary(raw: any): StatusSlice[] {
  const list = Array.isArray(raw) ? raw : (raw?.statuses ?? raw?.results ?? raw?.items ?? [])
  return list.map((item: any) => {
    const key = item.key ?? item.status ?? ''
    return {
      key,
      label: item.label ?? item.status_display ?? '',
      count: n(item.count ?? item.value),
      percent: n(item.percent),
      color: STATUS_COLORS[key] ?? '#2f6dff',
    }
  })
}

export interface HeatmapResult {
  rows: string[]
  cols: string[]
  data: number[][]
}

/** GET /api/v1/statistics/activity-heatmap/ —
 * `{ hour_buckets: [...], days: [{day, counts: [...]}, ...] }`. */
function normalizeHeatmap(raw: any, fallbackRows: string[], fallbackCols: string[]): HeatmapResult {
  if (raw && Array.isArray(raw.days) && raw.days.every((d: any) => Array.isArray(d?.counts))) {
    return {
      rows: raw.days.map((d: any) => String(d.day ?? '')),
      cols: raw.hour_buckets ?? raw.cols ?? fallbackCols,
      data: raw.days.map((d: any) => d.counts.map(n)),
    }
  }
  if (raw && Array.isArray(raw.matrix)) {
    return {
      rows: raw.days ?? raw.rows ?? fallbackRows,
      cols: raw.hours ?? raw.cols ?? fallbackCols,
      data: raw.matrix.map((row: unknown[]) => row.map(n)),
    }
  }
  if (Array.isArray(raw) && raw.length) {
    const rows = fallbackRows
    const cols = fallbackCols
    const data = rows.map(() => cols.map(() => 0))
    for (const item of raw) {
      const dayIdx = n(item.day ?? item.weekday ?? item.day_index)
      const hourLabel = item.hour_bucket ?? item.hour ?? item.bucket
      const colIdx = cols.indexOf(hourLabel)
      const value = n(item.count ?? item.value)
      const rowData = dayIdx >= 0 && dayIdx < rows.length ? data[dayIdx] : undefined
      if (rowData && colIdx >= 0) rowData[colIdx] = value
    }
    return { rows, cols, data }
  }
  return { rows: fallbackRows, cols: fallbackCols, data: fallbackRows.map(() => fallbackCols.map(() => 0)) }
}

/** GET /api/v1/statistics/my-kpi/ — `{ rating: {average, count}, months: [{label, bajargan, bajarmagan, kechikkan}] }`.
 * Tanlangan davr (6/12 oy) bo'yicha oylik sonlar yig'indisi ko'rsatiladi. */
function normalizeMyKpi(raw: any): MyKpi {
  const d = raw ?? {}
  const months = Array.isArray(d.months) ? d.months : null
  if (months) {
    const sum = (key: string) => months.reduce((acc: number, m: any) => acc + n(m[key]), 0)
    return {
      completed: sum('bajargan'),
      rejected: sum('bajarmagan'),
      overdue: sum('kechikkan'),
      avgRating: n(d.rating?.average),
    }
  }
  return {
    completed: n(d.completed),
    rejected: n(d.rejected),
    overdue: n(d.overdue),
    avgRating: n(d.avg_rating ?? d.average_rating ?? d.rating),
  }
}

export const useStatisticsStore = defineStore('statistics', () => {
  const months = ref<6 | 12>(6)
  const loading = ref(false)
  const error = ref('')

  const overview = ref<OverviewData | null>(null)
  const monthlyTrend = ref<SeriesPoint[]>([])
  const genderMonthly = ref<GenderPoint[]>([])
  const categoryBreakdown = ref<CategorySlice[]>([])
  const departmentPerformance = ref<DepartmentPerf[]>([])
  const slaTrend = ref<SeriesPoint[]>([])
  const statusSummary = ref<StatusSlice[]>([])
  const heatmap = ref<HeatmapResult>({ rows: [], cols: [], data: [] })
  const myKpi = ref<MyKpi | null>(null)
  const myKpiError = ref('')

  async function fetchAll(weekdays: string[], hourBuckets: string[]) {
    loading.value = true
    error.value = ''
    try {
      const params = { months: months.value }
      const [ov, mt, gm, cb, dp, sla, ss, hm, mk] = await Promise.allSettled([
        http.get('/api/v1/statistics/overview/'),
        http.get('/api/v1/statistics/monthly-trend/', { params }),
        http.get('/api/v1/statistics/gender-monthly/', { params }),
        http.get('/api/v1/statistics/category-breakdown/'),
        http.get('/api/v1/statistics/department-performance/'),
        http.get('/api/v1/statistics/sla-trend/', { params }),
        http.get('/api/v1/statistics/status-summary/', { params }),
        http.get('/api/v1/statistics/activity-heatmap/'),
        http.get('/api/v1/statistics/my-kpi/', { params }),
      ])

      if (ov.status === 'fulfilled') overview.value = normalizeOverview(ov.value.data)
      if (mt.status === 'fulfilled') monthlyTrend.value = normalizeSeries(mt.value.data, ['count', 'value'])
      if (gm.status === 'fulfilled') genderMonthly.value = normalizeGenderSeries(gm.value.data)
      if (cb.status === 'fulfilled') categoryBreakdown.value = normalizeCategoryBreakdown(cb.value.data)
      if (dp.status === 'fulfilled') departmentPerformance.value = normalizeDepartmentPerformance(dp.value.data)
      if (sla.status === 'fulfilled') slaTrend.value = normalizeSeries(sla.value.data, ['sla_percent', 'percent', 'value'])
      if (ss.status === 'fulfilled') statusSummary.value = normalizeStatusSummary(ss.value.data)
      if (hm.status === 'fulfilled') heatmap.value = normalizeHeatmap(hm.value.data, weekdays, hourBuckets)
      if (mk.status === 'fulfilled') {
        myKpi.value = normalizeMyKpi(mk.value.data)
        myKpiError.value = ''
      } else {
        myKpi.value = null
        myKpiError.value = extractApiError(mk.reason, '')
      }

      if ([ov, mt, gm, cb, dp, sla, ss, hm, mk].every((r) => r.status === 'rejected')) {
        error.value = "Statistika ma'lumotlarini yuklashda xatolik yuz berdi."
      }
    } finally {
      loading.value = false
    }
  }

  const myKpiEmployeeId = ref<number | null>(null)

  /** `employee_id` — faqat bo'lim admin/SuperAdmin uchun, boshqa xodimning KPI'sini
   * ko'rish imkonini beradi (backend'da yangi qo'shilgan parametr). Berilmasa —
   * so'rov yuborayotgan xodimning o'zi haqida qaytadi. */
  async function fetchMyKpi(employeeId?: number | null) {
    myKpiEmployeeId.value = employeeId ?? null
    myKpiError.value = ''
    try {
      const { data } = await http.get('/api/v1/statistics/my-kpi/', {
        params: { months: months.value, employee_id: employeeId ?? undefined },
      })
      myKpi.value = normalizeMyKpi(data)
    } catch (err) {
      myKpi.value = null
      myKpiError.value = extractApiError(err, '')
    }
  }

  async function downloadExport(format: 'pdf' | 'excel' | 'csv') {
    const ext = format === 'excel' ? 'xlsx' : format
    const response = await http.get(`/api/v1/statistics/export/${format}/`, {
      params: { months: months.value },
      responseType: 'blob',
    })
    const url = URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = `statistika-hisobot.${ext}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return {
    months,
    loading,
    error,
    overview,
    monthlyTrend,
    genderMonthly,
    categoryBreakdown,
    departmentPerformance,
    slaTrend,
    statusSummary,
    heatmap,
    myKpi,
    myKpiEmployeeId,
    myKpiError,
    fetchAll,
    fetchMyKpi,
    downloadExport,
  }
})
