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
export type DispatchMode = 'auto_balanced' | 'manual_review'

export interface ServiceRoleRoute {
  id: number
  service: number
  role: number
  role_name: string
  role_code: string
  /**
   * ATAYLAB almashtirish (override). Avval seed migratsiyasi har bir marshrutga
   * xizmat bo'limining NUSXASINI yozib qo'ygan va o'sha nusxa ustun kelardi —
   * shu sabab xizmat formasidan bo'limni o'zgartirish marshrutga ta'sir
   * qilmasdi. Endi:
   *   `null`      → murojaat XIZMATNING bo'limiga tushadi (odatdagi holat);
   *   to'ldirilgan → ataylab BOSHQA bo'limga yo'naltirish.
   */
  department: number | null
  department_name: string | null
  /** Murojaat haqiqatda tushadigan bo'lim (override bo'lmasa — xizmatning bo'limi). */
  effective_department: number | null
  effective_department_name: string | null
  /**
   * Shu bo'limda shu roldagi faol xodimlar soni. `0` bo'lsa marshrut amalda
   * ishlamaydi: murojaat yaratiladi va to'g'ri bo'limga tushadi, lekin hech
   * kimga tayinlanmasdan rol navbatida jim turib qoladi.
   * `null` — backend bu maydonni qaytarmadi (noma'lum), ogohlantirish
   * ko'rsatilmaydi (aks holda eski deploymentda soxta ogohlantirish chiqardi).
   */
  eligible_staff_count: number | null
  priority: number
  dispatch_mode: DispatchMode
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ServiceRoleRoutePayload {
  role: number
  department?: number | null
  priority?: number
  dispatch_mode: DispatchMode
  is_active?: boolean
}

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
  routing_rules: ServiceRoleRoute[]
}

/** Maydon umuman kelmasa `null` (noma'lum), kelsa — xavfsiz son. */
function toCountOrNull(value: unknown): number | null {
  if (value == null || value === '') return null
  const count = Number(value)
  return Number.isFinite(count) ? count : null
}

function normalizeRoute(raw: any): ServiceRoleRoute {
  return {
    id: Number(raw.id),
    service: Number(raw.service),
    role: Number(raw.role),
    role_name: raw.role_name ?? '',
    role_code: raw.role_code ?? '',
    department: raw.department == null ? null : Number(raw.department),
    department_name: raw.department_name ?? null,
    effective_department: raw.effective_department == null ? null : Number(raw.effective_department),
    effective_department_name: raw.effective_department_name ?? null,
    eligible_staff_count: toCountOrNull(raw.eligible_staff_count),
    priority: Number(raw.priority ?? 1),
    dispatch_mode: raw.dispatch_mode === 'manual_review' ? 'manual_review' : 'auto_balanced',
    is_active: raw.is_active == null ? true : Boolean(raw.is_active),
    created_at: raw.created_at ?? '',
    updated_at: raw.updated_at ?? '',
  }
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
    routing_rules: Array.isArray(raw.routing_rules) ? raw.routing_rules.map(normalizeRoute) : [],
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

  async function fetchServiceRoutes(serviceId: number): Promise<ServiceRoleRoute[]> {
    const { data } = await http.get(`/api/v1/services/${serviceId}/routes/`, { params: { page_size: 100 } })
    const routes = (data?.results ?? data ?? []).map(normalizeRoute)
    const service = services.value.find((item) => item.id === serviceId)
    if (service) service.routing_rules = routes
    return routes
  }

  async function addServiceRoute(serviceId: number, payload: ServiceRoleRoutePayload) {
    const { data } = await http.post(`/api/v1/services/${serviceId}/routes/`, payload)
    const route = normalizeRoute(data)
    const service = services.value.find((item) => item.id === serviceId)
    if (service) service.routing_rules = [...service.routing_rules, route].sort((a, b) => a.priority - b.priority)
    return route
  }

  async function updateServiceRoute(serviceId: number, routeId: number, payload: Partial<ServiceRoleRoutePayload>) {
    const { data } = await http.patch(`/api/v1/services/${serviceId}/routes/${routeId}/`, payload)
    const route = normalizeRoute(data)
    const service = services.value.find((item) => item.id === serviceId)
    if (service) {
      const index = service.routing_rules.findIndex((item) => item.id === routeId)
      if (index !== -1) service.routing_rules[index] = route
      service.routing_rules.sort((a, b) => a.priority - b.priority)
    }
    return route
  }

  async function removeServiceRoute(serviceId: number, routeId: number) {
    await http.delete(`/api/v1/services/${serviceId}/routes/${routeId}/`)
    const service = services.value.find((item) => item.id === serviceId)
    if (service) service.routing_rules = service.routing_rules.filter((route) => route.id !== routeId)
  }

  return {
    services, loading, error, fetchServices, addService, updateService, removeService,
    fetchServiceRoutes, addServiceRoute, updateServiceRoute, removeServiceRoute,
  }
})
