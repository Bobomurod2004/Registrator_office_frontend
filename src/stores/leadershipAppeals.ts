import { defineStore } from 'pinia'
import { ref } from 'vue'
import { http } from '@/services/http'

/**
 * Rahbariyatga murojaatlar (Telegram bot orqali kelgan talaba/o'qituvchi/xodim/
 * ota-ona murojaatlari). Bu xizmat murojaatlaridan (`/api/v1/requests/`) ALOHIDA
 * modul. Murojaatchi bilan aloqa faqat botda; web-panelda mas'ul xodim javob
 * yozadi, javob botga avtomatik yuboriladi.
 */

export type AppealStatus = 'new' | 'in_review' | 'answered' | 'closed' | 'rejected'
export type ApplicantType = 'student' | 'teacher' | 'staff' | 'parent'

/** Filtr ro'yxati. "Rad etilgan" yo'q — rahbariyat murojaatiga har doim javob beriladi. */
export const APPEAL_STATUSES: AppealStatus[] = ['new', 'in_review', 'answered', 'closed']
export const APPLICANT_TYPES: ApplicantType[] = ['student', 'teacher', 'staff', 'parent']

export interface LeadershipHandler {
  id: number
  fullName: string
}

export interface LeadershipRecipient {
  id: number
  nameUz: string
  nameRu: string
  positionUz: string
  positionRu: string
  order: number
  isActive: boolean
  handlers: LeadershipHandler[]
}

/** Rahbar formasi uchun yuboriladigan payload (faqat uz/ru — backend talabi). */
export interface RecipientPayload {
  name_uz: string
  name_ru: string
  position_uz: string
  position_ru: string
  order: number
  is_active: boolean
  handlers: number[]
}

/** Mas'ul xodim nomzodi — `GET /auth/users/?is_staff=true&search=...` natijasi. */
export interface HandlerCandidate {
  id: number
  fullName: string
  hemisId: string
  roleDisplay: string
  departmentName: string
}

export interface AppealListItem {
  id: number
  trackingCode: string
  recipientId: number | null
  recipientName: string
  recipientPosition: string
  applicantType: string
  applicantTypeDisplay: string
  isAnonymous: boolean
  /** Ro'yxatda tayyor ko'rinish: "Anonim (ota-ona)" yoki murojaatchi nomi. */
  applicantDisplay: string
  subject: string
  status: string
  statusDisplay: string
  assignedTo: number | null
  assignedToName: string | null
  attachmentsCount: number
  createdAt: string
  updatedAt: string
}

export interface AppealApplicant {
  fullName: string | null
  phone: string | null
  /** `true` — raqam Telegram "kontakt ulashish" orqali kelgan, haqiqatan shu odamniki. */
  phoneVerified: boolean
  childInfo: string | null
  hemisId: string | null
  details: Record<string, string> | null
}

/** `submission` — murojaatchi botdan yuborgan, `response` — mas'ul xodim javob sifatida yuborgan. */
export type AttachmentDirection = 'submission' | 'response'

export interface AppealAttachment {
  id: number
  displayName: string
  extension: string
  size: number
  direction: AttachmentDirection
  createdAt: string | null
}

/** Javob fayli cheklovlari (backend `AppealResponseFileView` bilan bir xil). */
export const RESPONSE_FILES_MAX = 5
export const RESPONSE_FILE_MAX_BYTES = 10 * 1024 * 1024
export const RESPONSE_FILE_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png']

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
}

/** Brauzer ichida ko'rsatsa bo'ladigan turlar: rasm yoki PDF. */
export function previewKind(extension: string): 'image' | 'pdf' | null {
  const ext = extension.toLowerCase()
  if (ext === 'pdf') return 'pdf'
  if (MIME_BY_EXTENSION[ext]?.startsWith('image/')) return 'image'
  return null
}

export interface AppealNote {
  kind: string
  oldValue: string | null
  newValue: string | null
  authorName: string | null
  text: string
  createdAt: string | null
}

/** Bitta murojaat tafsiloti. `GET /appeals/{id}/` har chaqirilganda audit jurnaliga yoziladi. */
export interface AppealDetail extends AppealListItem {
  text: string
  applicant: AppealApplicant | null
  response: string
  respondedAt: string | null
  closedAt: string | null
  attachments: AppealAttachment[]
  notes: AppealNote[]
}

export interface AppealStats {
  total: number
  byStatus: { status: string; label: string; count: number }[]
  byApplicantType: { applicantType: string; label: string; count: number }[]
  byRecipient: { recipient: number; label: string; count: number }[]
  monthly: { month: string; count: number }[]
}

export interface AppealFilters {
  status?: string
  recipient?: number | null
  applicantType?: string
  assignedToMe?: boolean
  search?: string
}

export interface AppealPatch {
  status?: string
  assigned_to?: number
  response?: string
}

// --- Normalizatsiya (backend snake_case -> frontend camelCase) ---

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
/** Sahifalangan (`results`) yoki oddiy massiv javobini bir xil qaytaradi. */
function list(data: any): any[] {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  return []
}

function normalizeRecipient(raw: any): LeadershipRecipient {
  const names: any[] = Array.isArray(raw?.handler_names) ? raw.handler_names : []
  const ids: unknown[] = Array.isArray(raw?.handlers) ? raw.handlers : []
  const handlers: LeadershipHandler[] = names.length
    ? names.map((h) => ({ id: num(h?.id), fullName: str(h?.full_name) }))
    : ids.map((id) => ({ id: num(id), fullName: '' }))
  return {
    id: num(raw?.id),
    nameUz: str(raw?.name_uz),
    nameRu: str(raw?.name_ru),
    positionUz: str(raw?.position_uz),
    positionRu: str(raw?.position_ru),
    order: num(raw?.order),
    isActive: raw?.is_active !== false,
    handlers,
  }
}

function normalizeCandidate(raw: any): HandlerCandidate {
  return {
    id: num(raw?.id),
    fullName: str(raw?.full_name) || str(raw?.hemis_id),
    hemisId: str(raw?.hemis_id),
    roleDisplay: str(raw?.role_display),
    departmentName: str(raw?.department_name),
  }
}

function normalizeListItem(raw: any): AppealListItem {
  return {
    id: num(raw?.id),
    trackingCode: str(raw?.tracking_code),
    recipientId: numOrNull(raw?.recipient),
    recipientName: str(raw?.recipient_name),
    recipientPosition: str(raw?.recipient_position),
    applicantType: str(raw?.applicant_type),
    applicantTypeDisplay: str(raw?.applicant_type_display),
    isAnonymous: raw?.is_anonymous === true,
    applicantDisplay: str(raw?.applicant_display),
    subject: str(raw?.subject),
    status: str(raw?.status),
    statusDisplay: str(raw?.status_display),
    assignedTo: numOrNull(raw?.assigned_to),
    assignedToName: strOrNull(raw?.assigned_to_name),
    attachmentsCount: num(raw?.attachments_count),
    createdAt: str(raw?.created_at),
    updatedAt: str(raw?.updated_at),
  }
}

function normalizeDetails(raw: unknown): Record<string, string> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value != null && value !== '') out[key] = String(value)
  }
  return Object.keys(out).length ? out : null
}

function normalizeDetail(raw: any): AppealDetail {
  const a = raw?.applicant
  return {
    ...normalizeListItem(raw),
    text: str(raw?.text),
    applicant:
      a && typeof a === 'object'
        ? {
            fullName: strOrNull(a.full_name),
            phone: strOrNull(a.phone),
            phoneVerified: a.phone_verified === true,
            childInfo: strOrNull(a.child_info),
            hemisId: strOrNull(a.hemis_id),
            details: normalizeDetails(a.details),
          }
        : null,
    response: str(raw?.response),
    respondedAt: strOrNull(raw?.responded_at),
    closedAt: strOrNull(raw?.closed_at),
    attachments: list(raw?.attachments).map((x) => ({
      id: num(x?.id),
      displayName: str(x?.display_name),
      extension: str(x?.extension),
      size: num(x?.size),
      direction: x?.direction === 'response' ? 'response' : 'submission',
      createdAt: strOrNull(x?.created_at),
    })),
    notes: list(raw?.notes).map((n) => ({
      kind: str(n?.kind),
      oldValue: strOrNull(n?.old_value),
      newValue: strOrNull(n?.new_value),
      authorName: strOrNull(n?.author_name),
      text: str(n?.text ?? n?.comment),
      createdAt: strOrNull(n?.created_at),
    })),
  }
}

function normalizeStats(raw: any): AppealStats {
  return {
    total: num(raw?.total),
    byStatus: list(raw?.by_status).map((x) => ({ status: str(x?.status), label: str(x?.label), count: num(x?.count) })),
    byApplicantType: list(raw?.by_applicant_type).map((x) => ({
      applicantType: str(x?.applicant_type),
      label: str(x?.label),
      count: num(x?.count),
    })),
    byRecipient: list(raw?.by_recipient).map((x) => ({
      recipient: num(x?.recipient),
      label: str(x?.label),
      count: num(x?.count),
    })),
    monthly: list(raw?.monthly).map((x) => ({ month: str(x?.month), count: num(x?.count) })),
  }
}

/** Qiymati bo'sh bo'lgan filtrlarni yubormaslik uchun query yig'adi. */
function buildParams(filters: AppealFilters, page: number): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = { page, ordering: '-created_at' }
  if (filters.status) params.status = filters.status
  if (filters.recipient) params.recipient = filters.recipient
  if (filters.applicantType) params.applicant_type = filters.applicantType
  if (filters.assignedToMe) params.assigned_to_me = true
  const q = filters.search?.trim()
  if (q) params.search = q
  return params
}

export const useLeadershipAppealsStore = defineStore('leadershipAppeals', () => {
  const recipients = ref<LeadershipRecipient[]>([])
  const items = ref<AppealListItem[]>([])
  const count = ref(0)
  const hasNext = ref(false)
  const currentPage = ref(1)
  const stats = ref<AppealStats | null>(null)

  // --- Rahbarlar (SuperAdmin) ---

  async function fetchRecipients(): Promise<void> {
    const { data } = await http.get('/api/v1/appeals/recipients/')
    recipients.value = list(data).map(normalizeRecipient).sort((a, b) => a.order - b.order)
  }

  async function createRecipient(payload: RecipientPayload): Promise<void> {
    await http.post('/api/v1/appeals/recipients/', payload)
    await fetchRecipients()
  }

  async function updateRecipient(id: number, payload: Partial<RecipientPayload>): Promise<void> {
    await http.patch(`/api/v1/appeals/recipients/${id}/`, payload)
    await fetchRecipients()
  }

  /** Murojaati bor rahbar o'chirilmaydi (400) — bunday holda `is_active=false` qilinadi. */
  async function removeRecipient(id: number): Promise<void> {
    await http.delete(`/api/v1/appeals/recipients/${id}/`)
    recipients.value = recipients.value.filter((r) => r.id !== id)
  }

  /** Faqat xodimlar (talaba va bot orqali kirgan o'qituvchilar server tomonida chiqarib tashlanadi). */
  async function searchHandlers(query: string): Promise<HandlerCandidate[]> {
    const { data } = await http.get('/api/v1/auth/users/', {
      params: { is_staff: true, search: query.trim(), page_size: 20 },
    })
    return list(data).map(normalizeCandidate)
  }

  // --- Murojaatlar ---

  async function fetchAppeals(filters: AppealFilters = {}, page = 1): Promise<void> {
    const { data } = await http.get('/api/v1/appeals/', { params: buildParams(filters, page) })
    items.value = list(data).map(normalizeListItem)
    count.value = typeof data?.count === 'number' ? data.count : items.value.length
    hasNext.value = Boolean(data?.next)
    currentPage.value = page
  }

  /** Faqat foydalanuvchi aniq ochganda chaqiriladi (har chaqiruv audit yozadi). */
  async function fetchAppeal(id: number): Promise<AppealDetail> {
    const { data } = await http.get(`/api/v1/appeals/${id}/`)
    return normalizeDetail(data)
  }

  /** Holat, mas'ul yoki javob o'zgartiriladi; so'ng tafsilot qayta yuklanadi va ro'yxat yangilanadi. */
  async function patchAppeal(id: number, payload: AppealPatch): Promise<AppealDetail> {
    await http.patch(`/api/v1/appeals/${id}/`, payload)
    const detail = await fetchAppeal(id)
    const index = items.value.findIndex((x) => x.id === id)
    if (index >= 0) items.value[index] = detail
    return detail
  }

  async function addNote(id: number, text: string): Promise<AppealDetail> {
    await http.post(`/api/v1/appeals/${id}/notes/`, { text })
    return fetchAppeal(id)
  }

  /**
   * Faylni Bearer token bilan blob sifatida oladi (oddiy havola ishlamaydi).
   * Blob turi kengaytmadan aniq beriladi — aks holda `<img>`/`<iframe>` uni ko'rsatmasligi mumkin.
   * Chaqiruvchi ishi tugagach `URL.revokeObjectURL()` qilishi kerak.
   */
  async function fetchAttachmentUrl(appealId: number, attachment: AppealAttachment): Promise<string> {
    const response = await http.get(`/api/v1/appeals/${appealId}/attachments/${attachment.id}/download/`, {
      responseType: 'blob',
    })
    const type = MIME_BY_EXTENSION[attachment.extension.toLowerCase()] || response.data?.type || ''
    const blob = type ? new Blob([response.data], { type }) : response.data
    return URL.createObjectURL(blob)
  }

  /** Faylni diskka saqlash. `url` berilsa (oldindan ochilgan), qayta yuklanmaydi. */
  async function downloadAttachment(appealId: number, attachment: AppealAttachment, url?: string): Promise<void> {
    const objectUrl = url ?? (await fetchAttachmentUrl(appealId, attachment))
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = attachment.displayName || `ilova-${attachment.id}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    if (!url) URL.revokeObjectURL(objectUrl)
  }

  /** Javob fayli: multipart `file`; backend uni darhol murojaatchi botiga yuboradi. */
  async function uploadResponseFile(appealId: number, file: File): Promise<void> {
    const form = new FormData()
    form.append('file', file)
    await http.post(`/api/v1/appeals/${appealId}/response-files/`, form, { timeout: 60000 })
  }

  async function fetchStats(): Promise<void> {
    const { data } = await http.get('/api/v1/appeals/stats/')
    stats.value = normalizeStats(data)
  }

  return {
    recipients,
    items,
    count,
    hasNext,
    currentPage,
    stats,
    fetchRecipients,
    createRecipient,
    updateRecipient,
    removeRecipient,
    searchHandlers,
    fetchAppeals,
    fetchAppeal,
    patchAppeal,
    addNote,
    fetchAttachmentUrl,
    downloadAttachment,
    uploadResponseFile,
    fetchStats,
  }
})
