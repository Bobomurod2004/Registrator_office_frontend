import { defineStore } from 'pinia'
import { ref } from 'vue'
import { http } from '@/services/http'
import { useLocaleStore } from '@/stores/locale'

export type ContentLang = 'uz' | 'uz_cyrl' | 'ru' | 'en'

export interface InfoEntry {
  id: number
  title: string
  bodyHtml: string
  name_uz: string
  name_uz_cyrl: string
  name_ru: string
  name_en: string
  description_uz: string
  description_uz_cyrl: string
  description_ru: string
  description_en: string
  createdAt: string
  updatedAt: string
}

export interface InfoTranslations {
  name_uz: string
  name_uz_cyrl?: string
  name_ru?: string
  name_en?: string
  description_uz: string
  description_uz_cyrl?: string
  description_ru?: string
  description_en?: string
}

function currentLang(): ContentLang {
  const map: Record<string, ContentLang> = { UZ: 'uz', UZ_CYRL: 'uz_cyrl', RU: 'ru', EN: 'en' }
  return map[useLocaleStore().locale] ?? 'uz'
}

function normalize(raw: any): InfoEntry {
  return {
    id: raw.id,
    title: raw.name ?? '',
    bodyHtml: raw.description ?? '',
    name_uz: raw.name_uz ?? '',
    name_uz_cyrl: raw.name_uz_cyrl ?? '',
    name_ru: raw.name_ru ?? '',
    name_en: raw.name_en ?? '',
    description_uz: raw.description_uz ?? '',
    description_uz_cyrl: raw.description_uz_cyrl ?? '',
    description_ru: raw.description_ru ?? '',
    description_en: raw.description_en ?? '',
    createdAt: raw.created_at ?? '',
    updatedAt: raw.updated_at ?? '',
  }
}

export const useInfoStore = defineStore('info', () => {
  const entries = ref<InfoEntry[]>([])
  const loading = ref(false)
  const error = ref('')

  async function fetchAll() {
    loading.value = true
    error.value = ''
    try {
      const all: InfoEntry[] = []
      let url: string | null = '/api/v1/info/'
      let params: Record<string, string> | undefined = { lang: currentLang() }
      while (url) {
        const { data }: { data: { results?: any[]; next: string | null } } = await http.get(url, { params })
        all.push(...(data.results ?? []).map(normalize))
        url = data.next
        params = undefined
      }
      entries.value = all
    } catch {
      error.value = 'load'
      entries.value = []
    } finally {
      loading.value = false
    }
  }

  async function addEntry(payload: InfoTranslations) {
    const { data } = await http.post('/api/v1/info/', payload, { params: { lang: currentLang() } })
    entries.value.unshift(normalize(data))
  }

  async function updateEntry(id: number, payload: InfoTranslations) {
    const { data } = await http.patch(`/api/v1/info/${id}/`, payload, { params: { lang: currentLang() } })
    const idx = entries.value.findIndex((e) => e.id === id)
    if (idx !== -1) entries.value[idx] = normalize(data)
  }

  async function removeEntry(id: number) {
    await http.delete(`/api/v1/info/${id}/`)
    entries.value = entries.value.filter((e) => e.id !== id)
  }

  return { entries, loading, error, fetchAll, addEntry, updateEntry, removeEntry }
})
