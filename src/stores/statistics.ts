import { defineStore } from 'pinia'
import { ref } from 'vue'
import { http, extractApiError } from '@/services/http'

/** /api/v1/statistics/* javoblari o'zbekcha kalitlar bilan keladi. Ba'zi eski endpointlar
 * uchun parserlar bir nechta ehtimoliy nomni sinaydi; backend maydon nomini o'zgartirsa,
 * faqat shu fayldagi tegishli normalize funksiyasini tuzatish kifoya. */

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

export interface MyKpiMonth {
  label: string
  completed: number
  notCompleted: number
  overdue: number
  onTime: number
  late: number
  ratingCount: number
  avgRating: number | null
}

/** 1–5 yulduz taqsimoti, indeks 0 → 1★ ... indeks 4 → 5★. */
export type StarDistribution = [number, number, number, number, number]

export interface MyKpi {
  completed: number
  notCompleted: number
  overdue: number
  onTime: number
  late: number
  openNow: number | null
  avgResponseHours: number | null
  avgRating: number
  ratingCount: number
  ratingDistribution: StarDistribution
  months: MyKpiMonth[]
}

/** monthly-trend / weekly-summary elementi. `slaPercent`, `avgResponseHours`, `avgRating`
 * — `null` bo'lishi mumkin (o'sha davrda yopilgan murojaat/baho yo'q) va grafikda 0 emas,
 * bo'sh joy sifatida ko'rsatilishi kerak. */
export interface TrendPoint {
  label: string
  count: number
  completed: number
  rejected: number
  expired: number
  cancelled: number
  onTime: number
  late: number
  slaPercent: number | null
  avgResponseHours: number | null
  ratingCount: number
  avgRating: number | null
}

export interface EmployeeStat {
  id: number
  fullName: string
  roleDisplay: string
  departmentName: string
  assigned: number
  openNow: number
  responded: number
  completed: number
  rejected: number
  onTime: number
  late: number
  expired: number
  slaPercent: number | null
  avgResponseHours: number | null
  ratingCount: number
  avgRating: number | null
  ratingDistribution: StarDistribution
}

export interface EmployeeResponse {
  requestNumber: string
  service: string
  studentName: string
  studentHemisId: string
  status: string
  responseHours: number | null
  onTime: boolean | null
  responderName: string
  rating: { stars: number; comment: string; createdAt: string } | null
}

export interface RatingsAnalysis {
  average: number | null
  count: number
  distribution: StarDistribution
  months: Array<{ label: string; count: number; average: number | null }>
  services: Array<{ name: string; count: number; average: number | null }>
  recent: Array<{ stars: number; comment: string; createdAt: string; service: string; studentName: string; requestNumber: string }>
}

function n(v: unknown): number {
  const num = Number(v)
  return Number.isFinite(num) ? num : 0
}

/** `null`/`undefined`/bo'sh qiymatni `null` qoldiradi (0 ga aylantirmaydi) — "ma'lumot yo'q" va
 * "0%" ni farqlash uchun. */
function nOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const num = Number(v)
  return Number.isFinite(num) ? num : null
}

/** `{"1": 0, ..., "5": 10}` yoki `[{stars, count}]` ko'rinishidagi taqsimotni o'qiydi. */
function normalizeDistribution(raw: any): StarDistribution {
  const dist: StarDistribution = [0, 0, 0, 0, 0]
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const stars = n(item?.stars ?? item?.yulduz ?? item?.star)
      if (stars >= 1 && stars <= 5) dist[stars - 1] = n(item?.count ?? item?.soni)
    }
  } else if (raw && typeof raw === 'object') {
    for (let s = 1; s <= 5; s++) dist[s - 1] = n(raw[s] ?? raw[String(s)])
  }
  return dist
}

function formatDayMonth(iso: unknown): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ''))
  return match ? `${match[3]}.${match[2]}` : String(iso ?? '')
}

/** monthly-trend va weekly-summary elementlari bir xil maydonlarga ega; haftalikda yorliq
 * `week_start` sanasidan ("14.09") olinadi. */
function normalizeTrendPoint(item: any): TrendPoint {
  const label = item.label ?? (item.week_start ? formatDayMonth(item.week_start) : item.month ?? '')
  return {
    label: String(label),
    count: n(item.kelgan ?? item.count),
    completed: n(item.bajarilgan),
    rejected: n(item.rad_etilgan),
    expired: n(item.muddati_otgan),
    cancelled: n(item.bekor_qilingan),
    onTime: n(item.oz_vaqtida),
    late: n(item.kechikib),
    slaPercent: nOrNull(item.sla_percent),
    avgResponseHours: nOrNull(item.ortacha_javob_soat),
    ratingCount: n(item.baholar_soni),
    avgRating: nOrNull(item.ortacha_baho),
  }
}

function normalizeTrend(raw: any, wrapperKeys: string[]): TrendPoint[] {
  let list: unknown = Array.isArray(raw) ? raw : null
  for (const key of wrapperKeys) {
    if (list) break
    if (Array.isArray(raw?.[key])) list = raw[key]
  }
  const points = Array.isArray(list) ? list.map(normalizeTrendPoint) : []
  // Backend davr uchun bo'sh oylarni ham qaytarishi mumkin. Grafik tizimda
  // ma'lumot paydo bo'lgan oydan boshlanishi kerak; o'rtadagi bo'sh oylar esa
  // ketma-ketlik buzilmasligi uchun saqlanadi.
  return trimLeadingEmpty(points, (point) =>
    point.count > 0 ||
    point.completed > 0 ||
    point.rejected > 0 ||
    point.expired > 0 ||
    point.cancelled > 0 ||
    point.onTime > 0 ||
    point.late > 0 ||
    point.ratingCount > 0,
  )
}

/** Faqat davr boshidagi "nol" yozuvlarni olib tashlaydi, keyingi bo'sh davrlar qoladi. */
function trimLeadingEmpty<T>(items: T[], hasData: (item: T) => boolean): T[] {
  const firstDataIndex = items.findIndex(hasData)
  return firstDataIndex === -1 ? [] : items.slice(firstDataIndex)
}

/** GET /api/v1/statistics/employees/ — `{ employees: [{ employee: {...}, tayinlangan, ... , baho: {soni, ortacha, taqsimot} }] }`. */
function normalizeEmployeeStat(item: any): EmployeeStat {
  // Yangi endpoint `employee: {...}` qaytaradi, ayrim eski deploymentlar
  // esa xodim maydonlarini to'g'ridan-to'g'ri element ichiga joylaydi.
  const e = item?.employee ?? item?.user ?? item ?? {}
  const baho = item?.baho ?? item?.rating ?? {}
  return {
    id: n(e.id ?? item?.employee_id),
    fullName: e.full_name ?? e.name ?? '',
    roleDisplay: e.role_display ?? e.role ?? '',
    departmentName: e.department_name ?? e.department ?? '',
    assigned: n(item?.tayinlangan ?? item?.assigned),
    openNow: n(item?.hozir_ochiq ?? item?.open_now),
    responded: n(item?.javob_bergan ?? item?.responded),
    completed: n(item?.bajargan ?? item?.completed),
    rejected: n(item?.rad_etgan ?? item?.rejected),
    onTime: n(item?.oz_vaqtida ?? item?.on_time),
    late: n(item?.kechikib ?? item?.late),
    expired: n(item?.muddati_otgan ?? item?.expired),
    slaPercent: nOrNull(item?.sla_percent ?? item?.slaPercent),
    avgResponseHours: nOrNull(item?.ortacha_javob_soat ?? item?.avg_response_hours),
    ratingCount: n(baho.soni ?? baho.count),
    avgRating: nOrNull(baho.ortacha ?? baho.average),
    ratingDistribution: normalizeDistribution(baho.taqsimot ?? baho.distribution),
  }
}

/** GET /api/v1/statistics/responses/ — sahifalangan, har bir natija bitta murojaat. */
function normalizeEmployeeResponse(item: any): EmployeeResponse {
  const baho = item?.baho
  return {
    requestNumber: item.request_number ?? '',
    service: typeof item.service === 'string' ? item.service : item.service?.name ?? item.service_name ?? '',
    studentName: item.student?.full_name ?? '',
    studentHemisId: item.student?.hemis_id ?? '',
    status: item.status ?? '',
    responseHours: nOrNull(item.javob_soat),
    onTime: typeof item.oz_vaqtida === 'boolean' ? item.oz_vaqtida : null,
    responderName: item.javob_bergan?.full_name ?? '',
    rating: baho ? { stars: n(baho.stars), comment: baho.comment ?? '', createdAt: baho.created_at ?? '' } : null,
  }
}

/** GET /api/v1/statistics/ratings/ — DIQQAT: bu endpointning aniq maydon nomlari bizga
 * yuborilmagan (faqat tavsif: umumiy o'rtacha, 1–5 taqsimot, oylar, xizmatlar, oxirgi 10 izoh).
 * Loyihaning qolgan statistik javoblaridagi o'zbekcha nomlash naqshiga (`soni`/`ortacha`/`taqsimot`)
 * asoslanib, bir nechta ehtimoliy nom sinaladi. Biror bo'lim bo'sh chiqsa — shu funksiyani
 * haqiqiy javobga moslab tuzatish kifoya. */
function normalizeRatings(raw: any): RatingsAnalysis {
  const d = raw ?? {}
  const overall = d.umumiy ?? d.overall ?? d.summary ?? d
  const monthsRaw = d.months ?? d.oylar ?? []
  const servicesRaw = d.services ?? d.xizmatlar ?? d.by_service ?? []
  const recentRaw = d.recent ?? d.recent_comments ?? d.oxirgi_izohlar ?? d.latest_comments ?? d.comments ?? []
  return {
    average: nOrNull(overall.ortacha ?? overall.average ?? overall.avg ?? overall.ortacha_baho),
    count: n(overall.soni ?? overall.count ?? overall.total ?? overall.baholar_soni),
    distribution: normalizeDistribution(d.taqsimot ?? d.distribution ?? overall.taqsimot ?? overall.distribution),
    months: trimLeadingEmpty((Array.isArray(monthsRaw) ? monthsRaw : []).map((m: any) => ({
      label: String(m.label ?? m.month ?? ''),
      count: n(m.soni ?? m.count ?? m.baholar_soni),
      average: nOrNull(m.ortacha ?? m.average ?? m.ortacha_baho),
    })), (month) => month.count > 0),
    services: (Array.isArray(servicesRaw) ? servicesRaw : []).map((s: any) => ({
      name: String(s.service ?? s.name ?? s.nomi ?? s.service_name ?? s.label ?? ''),
      count: n(s.soni ?? s.count ?? s.baholar_soni),
      average: nOrNull(s.ortacha ?? s.average ?? s.ortacha_baho),
    })),
    recent: (Array.isArray(recentRaw) ? recentRaw : []).map((r: any) => ({
      stars: n(r.stars ?? r.yulduz),
      comment: String(r.comment ?? r.izoh ?? ''),
      createdAt: String(r.created_at ?? ''),
      service: String(typeof r.service === 'string' ? r.service : r.service?.name ?? r.service_name ?? ''),
      studentName: String(typeof r.student === 'string' ? r.student : r.student?.full_name ?? r.student_name ?? ''),
      requestNumber: String(r.request_number ?? ''),
    })),
  }
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

/** GET /api/v1/statistics/gender-monthly/ — `{ months: [{label, erkak, ayol}] }`. */
function normalizeGenderSeries(raw: any): GenderPoint[] {
  const list = Array.isArray(raw) ? raw : (raw?.months ?? null)
  if (Array.isArray(list)) {
    return trimLeadingEmpty(list.map((item) => ({
      label: String(item.label ?? item.name ?? item.month ?? ''),
      male: n(item.erkak ?? item.male ?? item.men),
      female: n(item.ayol ?? item.female ?? item.women),
    })), (point) => point.male > 0 || point.female > 0)
  }
  if (raw && Array.isArray(raw.labels)) {
    const male: number[] = raw.male ?? []
    const female: number[] = raw.female ?? []
    return trimLeadingEmpty(
      raw.labels.map((label: string, i: number) => ({ label, male: n(male[i]), female: n(female[i]) })),
      (point) => point.male > 0 || point.female > 0,
    )
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
 * `bajarmagan` — "bajarilmagan" (rad etilgan emas). Jami sonlar tanlangan davr (6/12 oy)
 * bo'yicha oylik qiymatlar yig'indisi; oylik taqsimot ham saqlanadi. */
function normalizeMyKpi(raw: any): MyKpi {
  // API ayrim deploymentlarda javobni `data` ichiga o'raydi; ikkala shaklni
  // qabul qilish kerak, aks holda haqiqiy murojaat bo'lsa ham hamma karta 0
  // bo'lib ko'rinadi.
  const d = raw?.data ?? raw ?? {}
  const monthsRaw = d.months ?? d.oylar ?? d.results ?? d.items ?? []
  const months: MyKpiMonth[] = trimLeadingEmpty<MyKpiMonth>((Array.isArray(monthsRaw) ? monthsRaw : []).map((m: any) => ({
    label: String(m.label ?? m.month ?? ''),
    completed: n(m.bajargan ?? m.bajarilgan ?? m.completed),
    notCompleted: n(m.bajarmagan ?? m.bajarilmagan ?? m.not_completed ?? m.rejected),
    overdue: n(m.kechikkan ?? m.muddati_otgan ?? m.overdue),
    onTime: n(m.oz_vaqtida ?? m.on_time),
    late: n(m.kechikib ?? m.late),
    ratingCount: n(m.baholar_soni ?? m.baho_soni ?? m.rating_count),
    avgRating: nOrNull(m.ortacha_baho ?? m.baho_ortacha ?? m.avg_rating),
  })), (month) =>
    month.completed > 0 ||
    month.notCompleted > 0 ||
    month.overdue > 0 ||
    month.onTime > 0 ||
    month.late > 0 ||
    month.ratingCount > 0,
  )
  const sum = (key: 'completed' | 'notCompleted' | 'overdue' | 'onTime' | 'late') =>
    months.reduce((acc, m) => acc + m[key], 0)
  const hasMonthlyBreakdown = months.length > 0
  return {
    // Ayrim backend versiyalari oylik qatorlarsiz, faqat umumiy sonlarni
    // qaytaradi. Shunda xodimning KPI kartalari 0 bo'lib qolmasligi kerak.
    completed: hasMonthlyBreakdown ? sum('completed') : n(d.bajargan ?? d.bajarilgan ?? d.completed),
    notCompleted: hasMonthlyBreakdown ? sum('notCompleted') : n(d.bajarmagan ?? d.bajarilmagan ?? d.not_completed ?? d.rejected),
    overdue: hasMonthlyBreakdown ? sum('overdue') : n(d.kechikkan ?? d.muddati_otgan ?? d.overdue),
    onTime: hasMonthlyBreakdown ? sum('onTime') : n(d.oz_vaqtida ?? d.on_time),
    late: hasMonthlyBreakdown ? sum('late') : n(d.kechikib ?? d.late),
    openNow: nOrNull(d.hozir_ochiq ?? d.open_now ?? d.ochiq),
    avgResponseHours: nOrNull(d.ortacha_javob_soat ?? d.avg_response_hours),
    avgRating: n(d.rating?.average ?? d.baho?.ortacha ?? d.ortacha_baho ?? d.avg_rating),
    ratingCount: n(d.rating?.count ?? d.baho?.soni ?? d.baholar_soni ?? d.baho_soni ?? d.rating_count),
    ratingDistribution: normalizeDistribution(
      d.rating?.distribution ?? d.rating?.taqsimot ?? d.baho?.taqsimot ?? d.taqsimot,
    ),
    months,
  }
}

export const useStatisticsStore = defineStore('statistics', () => {
  // API maksimal davrni qaytaradi; normalizatorlar tizim ishga tushganidan
  // oldingi bo'sh oylarni ko'rsatmaydi.
  const months = ref(12)
  const loading = ref(false)
  const error = ref('')

  const overview = ref<OverviewData | null>(null)
  /** SLA grafigi ham shundan (`slaPercent`) chiziladi — `monthly-trend` `sla_percent: null`ni
   * rasman qaytaradi, shu sabab alohida `/sla-trend/` so'rovi endi kerak emas. */
  const monthlyTrend = ref<TrendPoint[]>([])
  const genderMonthly = ref<GenderPoint[]>([])
  const categoryBreakdown = ref<CategorySlice[]>([])
  const departmentPerformance = ref<DepartmentPerf[]>([])
  const statusSummary = ref<StatusSlice[]>([])
  const heatmap = ref<HeatmapResult>({ rows: [], cols: [], data: [] })
  const myKpi = ref<MyKpi | null>(null)
  const myKpiError = ref('')
  const myKpiEmployeeId = ref<number | null>(null)

  async function fetchAll(weekdays: string[], hourBuckets: string[]) {
    loading.value = true
    error.value = ''
    try {
      const params = { months: months.value }
      const [ov, mt, gm, cb, dp, ss, hm, mk] = await Promise.allSettled([
        http.get('/api/v1/statistics/overview/'),
        http.get('/api/v1/statistics/monthly-trend/', { params }),
        http.get('/api/v1/statistics/gender-monthly/', { params }),
        http.get('/api/v1/statistics/category-breakdown/'),
        http.get('/api/v1/statistics/department-performance/'),
        http.get('/api/v1/statistics/status-summary/', { params }),
        http.get('/api/v1/statistics/activity-heatmap/'),
        http.get('/api/v1/statistics/my-kpi/', {
          params: { ...params, employee_id: myKpiEmployeeId.value ?? undefined },
        }),
      ])

      if (ov.status === 'fulfilled') overview.value = normalizeOverview(ov.value.data)
      if (mt.status === 'fulfilled') monthlyTrend.value = normalizeTrend(mt.value.data, ['months'])
      if (gm.status === 'fulfilled') genderMonthly.value = normalizeGenderSeries(gm.value.data)
      if (cb.status === 'fulfilled') categoryBreakdown.value = normalizeCategoryBreakdown(cb.value.data)
      if (dp.status === 'fulfilled') departmentPerformance.value = normalizeDepartmentPerformance(dp.value.data)
      if (ss.status === 'fulfilled') statusSummary.value = normalizeStatusSummary(ss.value.data)
      if (hm.status === 'fulfilled') heatmap.value = normalizeHeatmap(hm.value.data, weekdays, hourBuckets)
      if (mk.status === 'fulfilled') {
        myKpi.value = normalizeMyKpi(mk.value.data)
        myKpiError.value = ''
      } else {
        myKpi.value = null
        myKpiError.value = extractApiError(mk.reason, '')
      }

      if ([ov, mt, gm, cb, dp, ss, hm, mk].every((r) => r.status === 'rejected')) {
        error.value = "Statistika ma'lumotlarini yuklashda xatolik yuz berdi."
      }
    } finally {
      loading.value = false
    }
  }

  /* ---------- Haftalik trend (GET /api/v1/statistics/weekly-summary/?weeks=12) ---------- */

  const weeklyTrend = ref<TrendPoint[]>([])
  const weeklyError = ref('')

  async function fetchWeekly(weeks = 12) {
    weeklyError.value = ''
    try {
      const { data } = await http.get('/api/v1/statistics/weekly-summary/', { params: { weeks } })
      weeklyTrend.value = normalizeTrend(data, ['weeks', 'results', 'items'])
    } catch (err) {
      weeklyTrend.value = []
      weeklyError.value = extractApiError(err, "Haftalik statistikani yuklab bo'lmadi.")
    }
  }

  /* ---------- Xodimlar reytingi (faqat Bo'lim ma'muri / SuperAdmin) ---------- */

  const employees = ref<EmployeeStat[]>([])
  const employeesLoading = ref(false)
  const employeesError = ref('')

  /** Backend ro'yxatni `javob_bergan` bo'yicha kamayish tartibida qaytaradi — qayta saralanmaydi. */
  async function fetchEmployees() {
    employeesLoading.value = true
    employeesError.value = ''
    try {
      const { data } = await http.get('/api/v1/statistics/employees/', { params: { months: months.value } })
      const list = Array.isArray(data) ? data : data?.employees ?? data?.results ?? data?.items ?? []
      employees.value = list.map(normalizeEmployeeStat)
    } catch (err) {
      employees.value = []
      employeesError.value = extractApiError(err, "Xodimlar statistikasini yuklab bo'lmadi.")
    } finally {
      employeesLoading.value = false
    }
  }

  /** GET /api/v1/statistics/responses/ — bitta xodim ishlagan murojaatlar (20 tadan sahifalangan). */
  async function fetchEmployeeResponses(employeeId: number, opts: { status?: string; page?: number } = {}) {
    const { data } = await http.get('/api/v1/statistics/responses/', {
      params: { employee_id: employeeId, status: opts.status || undefined, page: opts.page ?? 1 },
    })
    return {
      count: n(data?.count),
      hasNext: Boolean(data?.next),
      hasPrevious: Boolean(data?.previous),
      results: (Array.isArray(data?.results) ? data.results : []).map(normalizeEmployeeResponse),
    }
  }

  /* ---------- Baholar tahlili (GET /api/v1/statistics/ratings/) ---------- */

  const ratings = ref<RatingsAnalysis | null>(null)
  const ratingsLoading = ref(false)
  const ratingsError = ref('')

  async function fetchRatings() {
    ratingsLoading.value = true
    ratingsError.value = ''
    try {
      const { data } = await http.get('/api/v1/statistics/ratings/', { params: { months: months.value } })
      ratings.value = normalizeRatings(data)
    } catch (err) {
      ratings.value = null
      ratingsError.value = extractApiError(err, "Baholar statistikasini yuklab bo'lmadi.")
    } finally {
      ratingsLoading.value = false
    }
  }

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
    statusSummary,
    heatmap,
    myKpi,
    myKpiEmployeeId,
    myKpiError,
    weeklyTrend,
    weeklyError,
    employees,
    employeesLoading,
    employeesError,
    ratings,
    ratingsLoading,
    ratingsError,
    fetchAll,
    fetchMyKpi,
    fetchWeekly,
    fetchEmployees,
    fetchEmployeeResponses,
    fetchRatings,
    downloadExport,
  }
})
