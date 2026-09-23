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

export interface RequestDetail extends RequestListItem {
  service: number
  student: number
  student_hemis_id: string
  operator: number | null
  operator_name: string
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
  let lastAssignedToMe = false

  /** `assignedToMe: true` — xodim faqat o'ziga tayinlangan murojaatlarni
   *  ko'radi (backend: `?assigned_to_me=true`, TZ 7.2). */
  async function fetchRequests(options: { assignedToMe?: boolean } = {}) {
    lastAssignedToMe = options.assignedToMe ?? lastAssignedToMe
    loading.value = true
    error.value = ''
    try {
      const { data } = await http.get('/api/v1/requests/', {
        params: {
          page_size: 100,
          ...(lastAssignedToMe ? { assigned_to_me: true } : {}),
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

  return {
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
