import { defineStore } from 'pinia'
import { ref } from 'vue'
import { http, resolveMediaUrl } from '@/services/http'

export type GrantStatus = 'active' | 'inactive' | 'pending'
export type GrantOrdering = 'total_score' | '-total_score' | 'gpa' | '-gpa' | 'updated_at' | '-updated_at' | ''

export interface GrantEntry {
  id: number
  student: number
  studentName: string
  studentHemisId: string
  faculty: string
  course: string
  group: string
  phone: string
  gpa: string
  socialScore: string
  academicScore: string
  totalScore: string
  status: GrantStatus
  statusDisplay: string
  documentUrl: string | null
  gpaUpdatedAt: string | null
  updatedAt: string
}

/** `gpa` bu yerda ataylab yo'q — backend har tuni HEMIS'dan qayta yozib qo'yadi,
 * shu sabab formada faqat o'qish uchun, hech qachon PATCH bilan yuborilmaydi. */
export interface UpdateGrantPayload {
  social_score?: string
  academic_score?: string
  status?: GrantStatus
}

export interface FetchGrantsParams {
  page?: number
  pageSize?: number
  status?: GrantStatus | ''
  search?: string
  ordering?: GrantOrdering
  department?: number | ''
}

/** GET /api/v1/auth/grants/ — Grant obyekti Swagger'da to'liq hujjatlashtirilgan. */
function normalize(raw: any): GrantEntry {
  return {
    id: raw.id,
    student: raw.student,
    studentName: raw.student_name ?? '',
    studentHemisId: raw.student_hemis_id ?? '',
    faculty: raw.faculty ?? '',
    course: raw.course ?? '',
    group: raw.group ?? '',
    phone: raw.phone ?? '',
    gpa: raw.gpa ?? '0.00',
    socialScore: raw.social_score ?? '0.00',
    academicScore: raw.academic_score ?? '0.00',
    totalScore: raw.total_score ?? '0.00',
    status: raw.status ?? 'pending',
    statusDisplay: raw.status_display ?? '',
    documentUrl: resolveMediaUrl(raw.document),
    gpaUpdatedAt: raw.gpa_updated_at ?? null,
    updatedAt: raw.updated_at ?? '',
  }
}

function buildParams(f: FetchGrantsParams, page: number, pageSize: number) {
  const params: Record<string, unknown> = { page, page_size: pageSize }
  if (f.status) params.status = f.status
  if (f.search) params.search = f.search
  if (f.ordering) params.ordering = f.ordering
  if (f.department) params['student__student_profile__department'] = f.department
  return params
}

export interface HemisSyncTotals {
  created: number
  updated: number
  skipped: number
  errors: number
  deactivated: number
}

export interface Faculty {
  id: number
  name_uz: string
  name_ru: string
  name_en: string
  studentsCount: number
}

function normalizeFaculty(raw: any): Faculty {
  return {
    id: raw.id,
    name_uz: raw.name_uz ?? '',
    name_ru: raw.name_ru ?? '',
    name_en: raw.name_en ?? '',
    studentsCount: raw.students_count ?? 0,
  }
}

export const useGrantStudentsStore = defineStore('grantStudents', () => {
  const students = ref<GrantEntry[]>([])
  const count = ref(0)
  const page = ref(1)
  const pageSize = ref(10)
  const hasNext = ref(false)
  const hasPrevious = ref(false)
  const loading = ref(false)
  const error = ref('')

  /**
   * Ro'yxatni bir sahifa (server-taraf pagination/qidiruv/saralash/filtr bilan)
   * yuklaydi — backend `count` 5000+ bo'lishi mumkinligi sababli endi hech
   * qachon barcha sahifalar birdaniga yig'ilmaydi (avvalgi yondashuv).
   * Ro'yxat sahifasi hech qanday filtr berilmasa ham backend tavsiyasiga ko'ra
   * standart holatda `status=active` bilan chaqiriladi.
   */
  async function fetchAll(filters: FetchGrantsParams = {}) {
    loading.value = true
    error.value = ''
    const targetPage = filters.page ?? page.value
    const targetPageSize = filters.pageSize ?? pageSize.value
    try {
      const { data } = await http.get('/api/v1/auth/grants/', {
        params: buildParams(filters, targetPage, targetPageSize),
      })
      students.value = (data.results ?? []).map(normalize)
      count.value = data.count ?? 0
      hasNext.value = Boolean(data.next)
      hasPrevious.value = Boolean(data.previous)
      page.value = targetPage
      pageSize.value = targetPageSize
    } catch {
      error.value = "Grant oluvchilar ro'yxatini yuklashda xatolik yuz berdi."
      students.value = []
      count.value = 0
      hasNext.value = false
      hasPrevious.value = false
    } finally {
      loading.value = false
    }
  }

  /**
   * Excel'ga eksport qilish uchun — joriy filtrlar bo'yicha **barcha** sahifalarni
   * (ekrandagi bitta sahifa emas) to'liq yig'ib qaytaradi. Backend'ning maksimal
   * `page_size` chegarasi (100) bilan sahifalanadi.
   */
  async function fetchAllForExport(filters: FetchGrantsParams = {}): Promise<GrantEntry[]> {
    const all: GrantEntry[] = []
    let currentPage = 1
    const size = 100
    let hasMore = true
    while (hasMore) {
      const { data } = await http.get('/api/v1/auth/grants/', {
        params: buildParams(filters, currentPage, size),
      })
      all.push(...(data.results ?? []).map(normalize))
      hasMore = Boolean(data.next)
      currentPage++
    }
    return all
  }

  /* ---------- Fakultetlar ro'yxati (filtr uchun) ---------- */

  const faculties = ref<Faculty[]>([])
  const facultiesLoading = ref(false)
  const facultiesError = ref('')

  /** `GET /api/v1/departments/faculties/` — sahifalanmagan oddiy massiv, faqat
   * fakultetlarni (barcha bo'limlarni emas) qaytaradi. Fakultet filtri uchun
   * `/api/v1/departments/` o'rniga ATAYLAB shu endpoint ishlatiladi. */
  async function fetchFaculties() {
    facultiesLoading.value = true
    facultiesError.value = ''
    try {
      const { data } = await http.get('/api/v1/departments/faculties/')
      const list = Array.isArray(data) ? data : data?.results ?? []
      // Talabasi yo'q fakultetlar (masalan "Qo'shma ta'lim dasturi") ro'yxatda yashiriladi.
      faculties.value = list.map(normalizeFaculty).filter((f: Faculty) => f.studentsCount > 0)
    } catch {
      facultiesError.value = "Fakultetlar ro'yxatini yuklashda xatolik yuz berdi."
      faculties.value = []
    } finally {
      facultiesLoading.value = false
    }
  }

  /** Xodim grant ballini (ijtimoiy/akademik ko'rsatkich) yoki holatini yangilaydi.
   * `gpa` ataylab qabul qilinmaydi — u faqat HEMIS sinxronizatsiyasidan yoziladi. */
  async function updateGrant(id: number, payload: UpdateGrantPayload): Promise<void> {
    const { data } = await http.patch(`/api/v1/auth/grants/${id}/`, payload)
    const idx = students.value.findIndex((s) => s.id === id)
    if (idx !== -1) students.value[idx] = normalize(data)
  }

  /* ---------- HEMIS bilan sinxronlash — sahifalab, davom ettirish imkoniyati bilan ---------- */

  const syncing = ref(false)
  const syncPage = ref(0)
  const syncTotalPages = ref(0)
  const syncTotalCount = ref(0)
  const syncTotals = ref<HemisSyncTotals>({ created: 0, updated: 0, skipped: 0, errors: 0, deactivated: 0 })
  const syncFailedPage = ref<number | null>(null)
  const syncStopRequested = ref(false)

  function stopSync() {
    syncStopRequested.value = true
  }

  /**
   * `POST /api/v1/auth/admin/hemis-sync/` — bitta chaqiruvda bo'lmaydi (server 120s
   * limitidan oshib ketadi), shu sabab `page`/`limit` bilan navbatma-navbat
   * chaqiriladi, har sahifadan keyin progress hisobot beriladi. Xato bo'lsa
   * (`r.error`) — qaysi sahifada to'xtaganini saqlab, shu yerdan qayta
   * `startPage` bilan davom ettirish mumkin. `stopSync()` chaqirilsa, joriy
   * sahifa tugagach jarayon to'xtaydi (so'rov o'rtasida uzilmaydi).
   */
  async function syncFromHemis(startPage = 1): Promise<HemisSyncTotals> {
    const what = 'grants'
    const limit = 200

    syncing.value = true
    syncStopRequested.value = false
    syncFailedPage.value = null
    if (startPage === 1) syncTotals.value = { created: 0, updated: 0, skipped: 0, errors: 0, deactivated: 0 }

    let currentPage = startPage
    let hasMore = true

    try {
      while (hasMore) {
        if (syncStopRequested.value) break

        const { data } = await http.post(
          '/api/v1/auth/admin/hemis-sync/',
          { what, page: currentPage, limit },
          { timeout: 60000 },
        )
        const r = data?.synced?.[what]
        if (!r) throw new Error('Backend javobi kutilgan shaklda emas.')
        if (r.error) {
          syncFailedPage.value = currentPage
          throw new Error(`${currentPage}-sahifada xato: ${r.error}`)
        }

        syncTotals.value = {
          created: syncTotals.value.created + (r.created ?? 0),
          updated: syncTotals.value.updated + (r.updated ?? 0),
          skipped: syncTotals.value.skipped + (r.skipped ?? 0),
          errors: syncTotals.value.errors + (r.errors ?? 0),
          deactivated: syncTotals.value.deactivated + (r.deactivated ?? 0),
        }
        syncPage.value = currentPage
        syncTotalPages.value = r.total_pages ?? currentPage
        syncTotalCount.value = r.total_count ?? syncTotalCount.value
        hasMore = Boolean(r.has_more)
        currentPage++
      }

      if (!syncStopRequested.value) await fetchAll({ page: page.value, pageSize: pageSize.value })
      return syncTotals.value
    } finally {
      syncing.value = false
    }
  }

  return {
    students,
    count,
    page,
    pageSize,
    hasNext,
    hasPrevious,
    loading,
    error,
    fetchAll,
    fetchAllForExport,
    faculties,
    facultiesLoading,
    facultiesError,
    fetchFaculties,
    updateGrant,
    syncing,
    syncPage,
    syncTotalPages,
    syncTotalCount,
    syncTotals,
    syncFailedPage,
    syncStopRequested,
    syncFromHemis,
    stopSync,
  }
})
