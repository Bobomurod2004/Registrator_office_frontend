import { defineStore } from 'pinia'
import { ref } from 'vue'
import { http } from '@/services/http'
import { useLocaleStore } from '@/stores/locale'

export type ContentLang = 'uz' | 'uz_cyrl' | 'ru' | 'en'

export interface ContactEntry {
  id: number
  title: string
  phone: string
  shortNumber: string
  name_uz: string
  name_uz_cyrl: string
  name_ru: string
  name_en: string
  createdAt: string
  updatedAt: string
}

export interface ContactTranslations {
  name_uz: string
  name_uz_cyrl?: string
  name_ru?: string
  name_en?: string
}

function currentLang(): ContentLang {
  const map: Record<string, ContentLang> = { UZ: 'uz', UZ_CYRL: 'uz_cyrl', RU: 'ru', EN: 'en' }
  return map[useLocaleStore().locale] ?? 'uz'
}

function normalize(raw: any): ContactEntry {
  return {
    id: raw.id,
    title: raw.name ?? '',
    phone: raw.phone ?? '',
    shortNumber: raw.short_phone ?? '',
    name_uz: raw.name_uz ?? '',
    name_uz_cyrl: raw.name_uz_cyrl ?? '',
    name_ru: raw.name_ru ?? '',
    name_en: raw.name_en ?? '',
    createdAt: raw.created_at ?? '',
    updatedAt: raw.updated_at ?? '',
  }
}

export const useContactsStore = defineStore('contacts', () => {
  const entries = ref<ContactEntry[]>([])
  const loading = ref(false)
  const error = ref('')

  async function fetchAll() {
    loading.value = true
    error.value = ''
    try {
      const all: ContactEntry[] = []
      let url: string | null = '/api/v1/contacts/'
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

  async function addEntry(translations: ContactTranslations, phone: string, shortNumber: string) {
    const { data } = await http.post(
      '/api/v1/contacts/',
      { ...translations, phone, short_phone: shortNumber || undefined },
      { params: { lang: currentLang() } },
    )
    entries.value.unshift(normalize(data))
  }

  async function updateEntry(id: number, translations: ContactTranslations, phone: string, shortNumber: string) {
    const { data } = await http.patch(
      `/api/v1/contacts/${id}/`,
      { ...translations, phone, short_phone: shortNumber || '' },
      { params: { lang: currentLang() } },
    )
    const idx = entries.value.findIndex((e) => e.id === id)
    if (idx !== -1) entries.value[idx] = normalize(data)
  }

  async function removeEntry(id: number) {
    await http.delete(`/api/v1/contacts/${id}/`)
    entries.value = entries.value.filter((e) => e.id !== id)
  }

  return { entries, loading, error, fetchAll, addEntry, updateEntry, removeEntry }
})
