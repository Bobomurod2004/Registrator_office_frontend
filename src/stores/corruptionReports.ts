import { defineStore } from 'pinia'
import { ref } from 'vue'
import { http } from '@/services/http'

/**
 * Korrupsiya haqidagi xabarlar (`/api/v1/anti-corruption/`). Bot va saytdagi ochiq
 * forma orqali keladi. Faqat `handle_corruption_reports` ruxsatli xodimlar ko'radi
 * (SuperAdmin bu ruxsatni avtomatik olmaydi). Xabar mazmuni maxfiy: ro'yxatda
 * ko'rsatilmaydi, tafsilot har ochilganda backend audit jurnaliga yozadi.
 */

export type ReportStatus = 'new' | 'under_review' | 'investigating' | 'confirmed' | 'not_confirmed' | 'rejected'
export type ReportCategory =
  | 'bribery'
  | 'extortion'
  | 'abuse_of_power'
  | 'conflict_of_interest'
  | 'nepotism'
  | 'other'
export type AnonymityMode = 'anonymous' | 'confidential' | 'open'

export const REPORT_STATUSES: ReportStatus[] = [
  'new',
  'under_review',
  'investigating',
  'confirmed',
  'not_confirmed',
  'rejected',
]
export const REPORT_CATEGORIES: ReportCategory[] = [
  'bribery',
  'extortion',
  'abuse_of_power',
  'conflict_of_interest',
  'nepotism',
  'other',
]
export const ANONYMITY_MODES: AnonymityMode[] = ['anonymous', 'confidential', 'open']
/** Yakuniy holatlar (backend `CLOSED_STATUSES`). */
export const CLOSED_STATUSES: ReportStatus[] = ['confirmed', 'not_confirmed', 'rejected']

export interface ReportListItem {
  id: number
  trackingCode: string
  category: string
  categoryDisplay: string
  status: string
  statusDisplay: string
  anonymityMode: string
  anonymityModeDisplay: string
  departmentId: number | null
  departmentName: string | null
  assignedTo: number | null
  assignedToName: string | null
  attachmentsCount: number
  createdAt: string
  updatedAt: string
}

export interface ReportAttachment {
  id: number
  displayName: string
  extension: string
  size: number
  direction: 'submission' | 'response'
  createdAt: string | null
}

export interface ReportNote {
  kind: string
  kindDisplay: string
  text: string
  oldValue: string | null
  newValue: string | null
  authorName: string | null
  createdAt: string | null
}

export interface ReportReporter {
  id: number
  fullName: string | null
  hemisId: string | null
  phone: string | null
}

export interface ReportDetail extends ReportListItem {
  description: string
  incidentDate: string | null
  incidentPlace: string
  accusedPersons: string
  /** Tizimdagi foydalanuvchi (login qilib yuborgan bo'lsa). Anonimda `null`. */
  reporter: ReportReporter | null
  reporterName: string
  contact: string
  responseToReporter: string
  respondedAt: string | null
  closedAt: string | null
  attachments: ReportAttachment[]
  notes: ReportNote[]
}

export interface ReportStats {
  total: number
  byStatus: { status: string; label: string; count: number }[]
  byCategory: { category: string; label: string; count: number }[]
  monthly: { month: string; count: number }[]
}

export interface ReportFilters {
  status?: string
  category?: string
  anonymityMode?: string
  assignedToMe?: boolean
  search?: string
}

export interface ReportPatch {
  status?: ReportStatus
  assigned_to?: number | null
  response_to_reporter?: string
}

export interface OfficerCandidate {
  id: number
  fullName: string
  roleDisplay: string
  departmentName: string
}

const str = (v: unknown): string => (v == null ? '' : String(v))
const strOrNull = (v: unknown): string | null => (v == null || v === '' ? null : String(v))
const num = (v: unknown): number => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}
const numOrNull = (v: unknown): number | null => {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
function list(data: any): any[] {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  return []
}

function normalizeListItem(raw: any): ReportListItem {
  return {
    id: num(raw?.id),
    trackingCode: str(raw?.tracking_code),
    category: str(raw?.category),
    categoryDisplay: str(raw?.category_display),
    status: str(raw?.status),
    statusDisplay: str(raw?.status_display),
    anonymityMode: str(raw?.anonymity_mode),
    anonymityModeDisplay: str(raw?.anonymity_mode_display),
    departmentId: numOrNull(raw?.department),
    departmentName: strOrNull(raw?.department_name),
    assignedTo: numOrNull(raw?.assigned_to),
    assignedToName: strOrNull(raw?.assigned_to_name),
    attachmentsCount: num(raw?.attachments_count),
    createdAt: str(raw?.created_at),
    updatedAt: str(raw?.updated_at),
  }
}

function normalizeDetail(raw: any): ReportDetail {
  const rep = raw?.reporter
  const attachments = list(raw?.attachments)
  return {
    ...normalizeListItem(raw),
    attachmentsCount: attachments.length,
    description: str(raw?.description),
    incidentDate: strOrNull(raw?.incident_date),
    incidentPlace: str(raw?.incident_place),
    accusedPersons: str(raw?.accused_persons),
    reporter:
      rep && typeof rep === 'object'
        ? {
            id: num(rep.id),
            fullName: strOrNull(rep.full_name),
            hemisId: strOrNull(rep.hemis_id),
            phone: strOrNull(rep.phone),
          }
        : null,
    reporterName: str(raw?.reporter_name),
    contact: str(raw?.contact),
    responseToReporter: str(raw?.response_to_reporter),
    respondedAt: strOrNull(raw?.responded_at),
    closedAt: strOrNull(raw?.closed_at),
    attachments: attachments.map((x) => ({
      id: num(x?.id),
      displayName: str(x?.display_name),
      extension: str(x?.extension),
      size: num(x?.size),
      direction: x?.direction === 'response' ? 'response' : 'submission',
      createdAt: strOrNull(x?.created_at),
    })),
    notes: list(raw?.notes).map((n) => ({
      kind: str(n?.kind),
      kindDisplay: str(n?.kind_display),
      text: str(n?.text),
      oldValue: strOrNull(n?.old_value),
      newValue: strOrNull(n?.new_value),
      authorName: strOrNull(n?.author_name),
      createdAt: strOrNull(n?.created_at),
    })),
  }
}

function normalizeStats(raw: any): ReportStats {
  return {
    total: num(raw?.total),
    byStatus: list(raw?.by_status).map((x) => ({ status: str(x?.status), label: str(x?.label), count: num(x?.count) })),
    byCategory: list(raw?.by_category).map((x) => ({
      category: str(x?.category),
      label: str(x?.label),
      count: num(x?.count),
    })),
    monthly: list(raw?.monthly).map((x) => ({ month: str(x?.month), count: num(x?.count) })),
  }
}

function buildParams(filters: ReportFilters, page: number): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = { page, ordering: '-created_at' }
  if (filters.status) params.status = filters.status
  if (filters.category) params.category = filters.category
  if (filters.anonymityMode) params.anonymity_mode = filters.anonymityMode
  if (filters.assignedToMe) params.assigned_to_me = 'true'
  const q = filters.search?.trim()
  if (q) params.search = q
  return params
}

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
}

const base = '/api/v1/anti-corruption'

export const useCorruptionReportsStore = defineStore('corruptionReports', () => {
  const items = ref<ReportListItem[]>([])
  const count = ref(0)
  const hasNext = ref(false)
  const stats = ref<ReportStats | null>(null)

  async function fetchReports(filters: ReportFilters = {}, page = 1): Promise<void> {
    const { data } = await http.get(`${base}/reports/`, { params: buildParams(filters, page) })
    items.value = list(data).map(normalizeListItem)
    count.value = typeof data?.count === 'number' ? data.count : items.value.length
    hasNext.value = Boolean(data?.next)
  }

  /** Faqat foydalanuvchi aniq ochganda chaqiriladi (har chaqiruv audit yozadi). */
  async function fetchReport(id: number): Promise<ReportDetail> {
    const { data } = await http.get(`${base}/reports/${id}/`)
    return normalizeDetail(data)
  }

  /** PATCH javobi to'liq tafsilotni qaytaradi — qayta GET kerak emas. */
  async function patchReport(id: number, payload: ReportPatch): Promise<ReportDetail> {
    const { data } = await http.patch(`${base}/reports/${id}/`, payload)
    const detail = normalizeDetail(data)
    const index = items.value.findIndex((x) => x.id === id)
    if (index >= 0) {
      const prev = items.value[index]!
      items.value[index] = { ...detail, attachmentsCount: prev.attachmentsCount }
    }
    // Holat o'zgargan bo'lsa yuqoridagi hisoblar ham yangilansin (xato bo'lsa jim o'tiladi).
    if (payload.status && stats.value) void fetchStats().catch(() => undefined)
    return detail
  }

  async function addNote(id: number, text: string): Promise<ReportDetail> {
    await http.post(`${base}/reports/${id}/notes/`, { text })
    return fetchReport(id)
  }

  async function fetchAttachmentUrl(reportId: number, attachment: ReportAttachment): Promise<string> {
    const response = await http.get(`${base}/reports/${reportId}/attachments/${attachment.id}/download/`, {
      responseType: 'blob',
    })
    const type = MIME_BY_EXTENSION[attachment.extension.toLowerCase()] || response.data?.type || ''
    const blob = type ? new Blob([response.data], { type }) : response.data
    return URL.createObjectURL(blob)
  }

  async function downloadAttachment(reportId: number, attachment: ReportAttachment, url?: string): Promise<void> {
    const objectUrl = url ?? (await fetchAttachmentUrl(reportId, attachment))
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = attachment.displayName || `ilova-${attachment.id}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    if (!url) URL.revokeObjectURL(objectUrl)
  }

  /** Faqat bot orqali kelgan xabar uchun (aks holda backend 400 va sababini qaytaradi). */
  async function uploadResponseFile(reportId: number, file: File): Promise<void> {
    const form = new FormData()
    form.append('file', file)
    await http.post(`${base}/reports/${reportId}/response-files/`, form, { timeout: 60000 })
  }

  async function fetchStats(): Promise<void> {
    const { data } = await http.get(`${base}/stats/`)
    stats.value = normalizeStats(data)
  }

  /**
   * Mas'ul nomzodlari. Alohida "bo'lim xodimlari" endpointi yo'q — tizimdagi xodimlar
   * qidiriladi, ruxsatni (`handle_corruption_reports`) PATCH paytida backend tekshiradi.
   */
  async function searchOfficers(query: string): Promise<OfficerCandidate[]> {
    const { data } = await http.get('/api/v1/auth/users/', {
      params: { is_staff: true, search: query.trim(), page_size: 20 },
    })
    return list(data).map((raw) => ({
      id: num(raw?.id),
      fullName: str(raw?.full_name) || str(raw?.hemis_id),
      roleDisplay: str(raw?.role_display),
      departmentName: str(raw?.department_name),
    }))
  }

  return {
    items,
    count,
    hasNext,
    stats,
    fetchReports,
    fetchReport,
    patchReport,
    addNote,
    fetchAttachmentUrl,
    downloadAttachment,
    uploadResponseFile,
    fetchStats,
    searchOfficers,
  }
})
