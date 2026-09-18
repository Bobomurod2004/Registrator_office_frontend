import { defineStore } from 'pinia'
import { ref } from 'vue'
import { http } from '@/services/http'

export interface SystemSettingEntry {
  id: number
  key: string
  value: string
  description: string
  updatedByName: string
  updatedAt: string
}

export interface SystemSettingPayload {
  key: string
  value: string
  description?: string
}

function normalize(raw: any): SystemSettingEntry {
  return {
    id: raw.id,
    key: raw.key ?? '',
    value: raw.value ?? '',
    description: raw.description ?? '',
    updatedByName: raw.updated_by_name ?? '',
    updatedAt: raw.updated_at ?? '',
  }
}

/** Tizim sozlamalari — generic kalit/qiymat konfiguratsiya ombori
 * (GET/POST/PATCH/DELETE /api/v1/system-settings/), faqat SuperAdmin/
 * DepartmentAdmin uchun. */
export const useSystemSettingsStore = defineStore('systemSettings', () => {
  const entries = ref<SystemSettingEntry[]>([])
  const loading = ref(false)
  const error = ref('')

  async function fetchAll() {
    loading.value = true
    error.value = ''
    try {
      const all: SystemSettingEntry[] = []
      let url: string | null = '/api/v1/system-settings/'
      let params: Record<string, unknown> | undefined = { page_size: 100 }
      while (url) {
        const { data }: { data: { results?: any[]; next: string | null } } = await http.get(url, { params })
        all.push(...(data.results ?? []).map(normalize))
        url = data.next
        params = undefined
      }
      entries.value = all
    } catch {
      error.value = "Sozlamalarni yuklashda xatolik yuz berdi."
      entries.value = []
    } finally {
      loading.value = false
    }
  }

  async function addEntry(payload: SystemSettingPayload) {
    const { data } = await http.post('/api/v1/system-settings/', payload)
    entries.value.unshift(normalize(data))
  }

  async function updateEntry(id: number, payload: Partial<SystemSettingPayload>) {
    const { data } = await http.patch(`/api/v1/system-settings/${id}/`, payload)
    const idx = entries.value.findIndex((e) => e.id === id)
    if (idx !== -1) entries.value[idx] = normalize(data)
  }

  async function removeEntry(id: number) {
    await http.delete(`/api/v1/system-settings/${id}/`)
    entries.value = entries.value.filter((e) => e.id !== id)
  }

  return { entries, loading, error, fetchAll, addEntry, updateEntry, removeEntry }
})
