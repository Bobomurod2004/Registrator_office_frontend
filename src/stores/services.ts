import { defineStore } from 'pinia'
import { ref } from 'vue'
import { http } from '@/services/http'

/** Backend CategoryEnum: reference/financial/academic/science.
 * Frontend'da mavjud 4 ta tab bilan mos keladi:
 * reference → docs, financial → finance, science → research, academic → academic. */
export type ServiceCategory = 'reference' | 'financial' | 'academic' | 'science'
export type FileFormat = 'pdf' | 'excel' | 'pdf_excel'
export type SlaUnit = 'hours' | 'days'
export type ServiceLang = 'uz' | 'uz_cyrl' | 'ru' | 'en'

export interface Service {
  id: number
  code: string
  name_uz: string
  name_uz_cyrl: string
  name_ru: string
  name_en: string
  description_uz: string
  description_uz_cyrl: string
  description_ru: string
  description_en: string
  category: ServiceCategory
  category_display: string
  department: number
  department_name: string
  sla_value: number
  sla_unit: SlaUnit
  sla_text: string
  output_format: FileFormat
  output_format_display: string
  requires_payment: boolean
  payment_amount: string | null
  is_active: boolean
  order: number
}

export interface ServicePayload {
  code: string
  name_uz: string
  name_uz_cyrl?: string
  name_ru?: string
  name_en?: string
  description_uz?: string
  description_uz_cyrl?: string
  description_ru?: string
  description_en?: string
  category: ServiceCategory
  department: number
  sla_value: number
  sla_unit: SlaUnit
  output_format: FileFormat
  requires_payment: boolean
  payment_amount?: string | null
  is_active: boolean
  order?: number
}

function normalize(raw: any): Service {
  return {
    id: raw.id,
    code: raw.code ?? '',
    name_uz: raw.name_uz ?? '',
    name_uz_cyrl: raw.name_uz_cyrl ?? '',
    name_ru: raw.name_ru ?? '',
    name_en: raw.name_en ?? '',
    description_uz: raw.description_uz ?? '',
    description_uz_cyrl: raw.description_uz_cyrl ?? '',
    description_ru: raw.description_ru ?? '',
    description_en: raw.description_en ?? '',
    category: raw.category,
    category_display: raw.category_display ?? '',
    department: raw.department,
    department_name: raw.department_name ?? '',
    sla_value: raw.sla_value ?? 0,
    sla_unit: raw.sla_unit ?? 'days',
    sla_text: raw.sla_text ?? '',
    output_format: raw.output_format ?? 'pdf',
    output_format_display: raw.output_format_display ?? '',
    requires_payment: !!raw.requires_payment,
    payment_amount: raw.payment_amount ?? null,
    is_active: !!raw.is_active,
    order: raw.order ?? 0,
  }
}

export const useServicesStore = defineStore('services', () => {
  const services = ref<Service[]>([])
  const loading = ref(false)
  const error = ref('')

  async function fetchServices() {
    loading.value = true
    error.value = ''
    try {
      const all: Service[] = []
      let url: string | null = '/api/v1/services/'
      let params: Record<string, unknown> | undefined = { page_size: 100 }
      while (url) {
        const { data }: { data: { results?: any[]; next: string | null } } = await http.get(url, { params })
        all.push(...(data.results ?? []).map(normalize))
        url = data.next ?? null
        params = undefined
      }
      services.value = all
    } catch {
      error.value = "Xizmatlar ro'yxatini yuklashda xatolik yuz berdi."
    } finally {
      loading.value = false
    }
  }

  async function addService(payload: ServicePayload) {
    const { data } = await http.post('/api/v1/services/', payload)
    services.value.unshift(normalize(data))
  }

  async function updateService(id: number, payload: Partial<ServicePayload>) {
    const { data } = await http.patch(`/api/v1/services/${id}/`, payload)
    const idx = services.value.findIndex((s) => s.id === id)
    if (idx !== -1) services.value[idx] = normalize(data)
  }

  async function removeService(id: number) {
    await http.delete(`/api/v1/services/${id}/`)
    services.value = services.value.filter((s) => s.id !== id)
  }

  return { services, loading, error, fetchServices, addService, updateService, removeService }
})
