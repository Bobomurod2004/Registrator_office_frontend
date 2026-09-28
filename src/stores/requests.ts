import { defineStore } from 'pinia'
import { ref } from 'vue'
import { http } from '@/services/http'
import type { FileFormat } from '@/stores/services'

export type RequestStatus = 'new' | 'in_progress' | 'redirected' | 'completed' | 'rejected' | 'expired' | 'cancelled'
export type DocumentLanguage = 'uz' | 'uz_cyrl' | 'ru' | 'en'

export interface RequestListItem {
  id: number
  request_number: string
  service_name: string
  student_name: string
  department_name: string
  status: RequestStatus
  status_display: string
  effective_status: string
  status_color: string
  student_status_label: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  sla_deadline: string | null
  sla_percent: number
  is_overdue: boolean
  created_at: string
  resolved_at: string | null
  /** Mas'ul xodim. Avval faqat detail javobida bor edi — endi ro'yxatda ham
   * qaytadi, shu sabab kartani ochmasdan ham ko'rsatish mumkin.
   * DIQQAT: backend endi `null` bo'lganda ham kalitni tushirib qoldirmaydi
   * (avval `operator_name` butunlay yo'q bo'lardi), lekin eski deploymentlar
   * uchun ixtiyoriy qoldirilgan. */
  operator?: number | null
  operator_name?: string | null
  /** Murojaat qaysi ROLGA tayinlangani ("ish kimga tushdi").
   * Bu "kim ko'radi" degani EMAS — ko'rinish `request_scope` bilan belgilanadi. */
  assigned_role?: number | null
  assigned_role_name?: string | null
}

export interface RequestDocument {
  id: number
  file: string
  file_name: string
  file_type: string
  is_generated: boolean
  is_verified: boolean
  generated_at: string
}

export interface RequestHistoryEntry {
  id: number
  old_status: RequestStatus
  old_status_display: string
  new_status: RequestStatus
  new_status_display: string
  changed_by_name: string
  comment: string
  changed_at: string
}

export interface RequestPayment {
  id: number
  amount: string
  provider: string
  provider_display: string
  transaction_id: string
  status: string
  status_display: string
  paid_at: string | null
  created_at: string
}

/** `/requests/<id>/` detail javobidagi, murojaatni shu rolga olib kelgan
 * xizmat marshruti (`ServiceRoleRoute` ning qisqartirilgan ko'rinishi). */
export interface RequestServiceRoute {
  id: number
  role: number
  role_name: string
  department: number | null
  department_name: string | null
  priority: number
  dispatch_mode: string
}

export interface RequestDetail extends RequestListItem {
  service: number
  student: number
  student_hemis_id: string
  operator: number | null
  operator_name: string | null
  service_route?: RequestServiceRoute | null
  department: number
  document_language: DocumentLanguage
  file_format: FileFormat
  notes: string
  rejection_reason: string
  is_escalated: boolean
  documents: RequestDocument[]
  history: RequestHistoryEntry[]
  rating: { id: number; stars: number; comment: string; created_at: string } | null
  payment: RequestPayment | null
  updated_at: string
}

export interface RequestFilters {
  /** `?assigned_to_me=true` — faqat menga tayinlanganlar (TZ 7.2). */
  assignedToMe?: boolean
  /** `?unassigned=true` — hali hech kimga olinmagan, "rol navbati"dagi murojaatlar. */
  unassigned?: boolean
  /** `?assigned_role=<id>` — muayyan rolga tayinlanganlar. */
  assignedRole?: number | null
}

export interface CreateRequestPayload {
  service: number
  jshshir: string
  document_language: DocumentLanguage
  file_format?: FileFormat
  notes?: string
}

export const useRequestsStore = defineStore('requests', () => {
  const requests = ref<RequestListItem[]>([])
  const loading = ref(false)
  const error = ref('')

  /** Oxirgi marta ishlatilgan `assignedToMe` holati — status o'zgartirish/
   *  yo'naltirish kabi amallardan keyingi ichki qayta yuklashlar ham shu
   *  filtrni saqlab qolishi uchun (aks holda "Menga tayinlangan" filtri
   *  faol bo'lganda ham har bir amaldan keyin butun ro'yxatga qaytib qolardi). */
  /** Oxirgi ishlatilgan server-taraf filtrlar. Status o'zgartirish/yo'naltirish
   * kabi amallardan keyin ichki `fetchRequests()` argumentsiz chaqiriladi —
   * shunda ham foydalanuvchi tanlagan filtr saqlanib qolishi kerak. */
  let lastFilters: RequestFilters = {}

  async function fetchRequests(options: RequestFilters = {}) {
    lastFilters = { ...lastFilters, ...options }
    loading.value = true
    error.value = ''
    try {
      const { data } = await http.get('/api/v1/requests/', {
        params: {
          page_size: 100,
          ...(lastFilters.assignedToMe ? { assigned_to_me: true } : {}),
          ...(lastFilters.unassigned ? { unassigned: true } : {}),
          ...(lastFilters.assignedRole ? { assigned_role: lastFilters.assignedRole } : {}),
        },
      })
      requests.value = data.results ?? data
    } catch {
      error.value = "Murojaatlar ro'yxatini yuklashda xatolik yuz berdi."
    } finally {
      loading.value = false
    }
  }

  async function fetchRequestDetail(id: number): Promise<RequestDetail> {
    const { data } = await http.get(`/api/v1/requests/${id}/`)
    return data
  }

  async function createRequest(payload: CreateRequestPayload): Promise<RequestDetail> {
    const { data } = await http.post('/api/v1/requests/', payload)
    await fetchRequests()
    return data
  }

  /** Xodim tayyor hujjatni (masalan generatsiya qilingan ma'lumotnoma) murojaatga biriktiradi. */
  async function uploadDocument(requestId: number, file: File): Promise<void> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('file_name', file.name)
    await http.post(`/api/v1/requests/${requestId}/documents/`, formData)
  }

  async function downloadDocument(requestId: number, docId: number, fileName: string) {
    const response = await http.get(`/api/v1/requests/${requestId}/documents/${docId}/download/`, {
      responseType: 'blob',
    })
    const url = URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  async function rateRequest(id: number, stars: number, comment: string) {
    await http.post(`/api/v1/requests/${id}/rate/`, { stars, comment })
  }

  async function updateStatus(
    id: number,
    status: 'in_progress' | 'completed' | 'rejected',
    payload: { comment?: string; rejection_reason?: string } = {},
  ) {
    await http.post(`/api/v1/requests/${id}/status/`, { status, ...payload })
    await fetchRequests()
  }

  async function redirectRequest(id: number, department: number, comment = '') {
    await http.post(`/api/v1/requests/${id}/redirect/`, { department, comment })
    await fetchRequests()
  }

  /** Talaba faqat 'Yangi' holatdagi o'z murojaatini bekor qila oladi. */
  async function cancelRequest(id: number, reason = '') {
    await http.post(`/api/v1/requests/${id}/cancel/`, { reason })
    await fetchRequests()
  }

  /**
   * POST /api/v1/requests/<id>/route/ — murojaatni boshqa ROLGA yo'naltiradi
   * (bo'limga yo'naltiruvchi `redirect/` dan farqli). `role` berilmasa backend
   * xizmatning marshrut qoidalari bo'yicha o'zi tanlaydi.
   * Bu amal `dispatch_requests` ruxsatini talab qiladi.
   */
  async function routeRequest(id: number, payload: { role?: number | null; comment?: string } = {}) {
    await http.post(`/api/v1/requests/${id}/route/`, {
      ...(payload.role ? { role: payload.role } : {}),
      ...(payload.comment ? { comment: payload.comment } : {}),
    })
    await fetchRequests()
  }

  return {
    routeRequest,
    requests,
    loading,
    error,
    fetchRequests,
    fetchRequestDetail,
    createRequest,
    uploadDocument,
    downloadDocument,
    rateRequest,
    updateStatus,
    redirectRequest,
    cancelRequest,
  }
})
