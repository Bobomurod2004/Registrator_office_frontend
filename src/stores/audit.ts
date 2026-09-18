import { defineStore } from 'pinia'
import { ref } from 'vue'
import { http } from '@/services/http'

export type AuditAction =
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'request_create'
  | 'request_status_change'
  | 'request_assign'
  | 'document_download'
  | 'document_upload'
  | 'user_create'
  | 'user_update'
  | 'user_delete'
  | 'settings_change'
  | 'grant_update'

export interface AuditLogEntry {
  id: number
  user: number | null
  user_name: string
  action: AuditAction
  action_display: string
  entity: string
  entity_id: number | null
  ip_address: string | null
  user_agent: string
  created_at: string
}

export interface AuditFilters {
  action?: string
  search?: string
  page?: number
}

export const useAuditStore = defineStore('audit', () => {
  const entries = ref<AuditLogEntry[]>([])
  const count = ref(0)
  const page = ref(1)
  const hasNext = ref(false)
  const hasPrevious = ref(false)
  const loading = ref(false)
  const error = ref('')

  async function fetchLogs(filters: AuditFilters = {}) {
    loading.value = true
    error.value = ''
    page.value = filters.page ?? 1

    try {
      const { data } = await http.get('/api/v1/audit/', {
        params: {
          page: page.value,
          action: filters.action || undefined,
          search: filters.search || undefined,
        },
      })
      entries.value = data.results
      count.value = data.count
      hasNext.value = Boolean(data.next)
      hasPrevious.value = Boolean(data.previous)
    } catch (err: any) {
      error.value = err?.response?.status === 403
        ? 'Bu bo\'limni ko\'rish uchun ruxsat yo\'q.'
        : 'Audit jurnalini yuklashda xatolik yuz berdi.'
      entries.value = []
    } finally {
      loading.value = false
    }
  }

  return { entries, count, page, hasNext, hasPrevious, loading, error, fetchLogs }
})
