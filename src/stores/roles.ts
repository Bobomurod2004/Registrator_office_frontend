import { defineStore } from 'pinia'
import { ref } from 'vue'
import { http } from '@/services/http'

export interface PermissionItem {
  code: string
  name: string
  category: string
}

/**
 * Bu rol bilan xodim MUROJAATLARNING QAYSI QISMINI KO'RADI:
 *  - `all`        — barcha murojaatlar
 *  - `category`   — faqat tanlangan kategoriyalar
 *  - `department` — faqat o'z bo'limi
 *  - `none`       — deyarli hech narsa
 * DIQQAT: `none` — xavfsiz standart EMAS. Backend jamoasi aniq ogohlantirdi:
 * yangi rolga `none` qo'yilsa, xodim tizimda deyarli hech narsa ko'rmaydi.
 * Shu sabab forma bu maydonni majburiy tanlov qiladi va standart qiymat
 * sifatida `department` taklif etiladi.
 */
export type RequestScope = 'none' | 'department' | 'category' | 'all'

export const REQUEST_SCOPES: RequestScope[] = ['all', 'category', 'department', 'none']

/** `request_scope: 'category'` bo'lganda tanlanadigan xizmat kategoriyalari. */
export const REQUEST_CATEGORIES = ['reference', 'financial', 'academic', 'science'] as const

export interface Role {
  id: number
  name: string
  code: string
  description: string
  permissions: string[]
  isSystem: boolean
  usersCount: number
  /** Faol emas bo'lsa, xodim qo'shish/rol tahrirlash ro'yxatida ko'rsatilmaydi. */
  isActive: boolean
  /** `true` bo'lsa, bu rol bilan xodim qo'shishda bo'lim tanlash majburiy. */
  requiresDepartment: boolean
  /** Login+parol bilan kirish. `null` — backend bu maydonni qaytarmagan (noma'lum). */
  allowsLocalLogin: boolean | null
  requestScope: RequestScope
  requestCategories: string[]
}

export interface RolePayload {
  name: string
  code?: string
  description?: string
  permissions: string[]
  request_scope: RequestScope
  request_categories?: string[]
}

/** `Role` sxemasi (api/schema/ orqali tasdiqlangan): id, code, name, is_system,
 * is_active, request_scope, request_categories, is_department_head,
 * requires_department, allows_local_login, session_hours, permissions,
 * assignable_roles, user_count. `description` sxemada yo'q — eski nomlar
 * zaxira sifatida qoldirilgan. */
function normalizeRole(raw: any): Role {
  const permsRaw = raw.permissions ?? raw.permission_codes ?? []
  return {
    id: raw.id,
    name: raw.name ?? raw.title ?? raw.role_display ?? '',
    code: raw.code ?? raw.role_code ?? raw.slug ?? '',
    description: raw.description ?? '',
    permissions: Array.isArray(permsRaw)
      ? permsRaw.map((p: any) => (typeof p === 'string' ? p : p?.code ?? p?.codename ?? String(p?.id ?? '')))
      : [],
    isSystem: !!(raw.is_system ?? raw.is_default ?? raw.system ?? false),
    usersCount: raw.user_count ?? raw.users_count ?? raw.members_count ?? 0,
    isActive: raw.is_active == null ? true : !!raw.is_active,
    requiresDepartment: !!raw.requires_department,
    // DIQQAT: `== null` (`=== undefined` emas). Backend endi bog'langan qiymat
    // bo'lmasa ham kalitni javobdan tushirib qoldirmaydi — `null` qiymat bilan
    // yuboradi. `=== undefined` bo'lganda `null` "ruxsat yo'q" deb o'qilib,
    // department_admin/super_admin uchun parol maydoni noto'g'ri yashirilardi.
    // `null` — "noma'lum", ya'ni rol kodiga qarab aniqlanadi.
    allowsLocalLogin: raw.allows_local_login == null ? null : !!raw.allows_local_login,
    requestScope: (REQUEST_SCOPES as string[]).includes(raw.request_scope)
      ? (raw.request_scope as RequestScope)
      : 'department',
    requestCategories: Array.isArray(raw.request_categories) ? raw.request_categories.map(String) : [],
  }
}

function normalizePermissionItem(p: any, fallbackCategory: string): PermissionItem {
  if (typeof p === 'string') return { code: p, name: p, category: fallbackCategory }
  return {
    code: p.code ?? p.codename ?? String(p.id ?? ''),
    name: p.name ?? p.label ?? p.display ?? p.code ?? '',
    category: p.category ?? p.group ?? fallbackCategory,
  }
}

/** Ruxsatlar katalogi shakli ham hujjatlashtirilmagan — tekis massiv,
 * `{results: [...]}` yoki kategoriya bo'yicha guruhlangan
 * `[{category, permissions: [...]}]` ko'rinishlarining barchasi
 * qo'llab-quvvatlanadi. */
function normalizePermissionCatalog(raw: any): PermissionItem[] {
  const list: any[] = Array.isArray(raw) ? raw : raw?.results ?? raw?.permissions ?? raw?.catalog ?? []
  const flat: PermissionItem[] = []
  for (const entry of list) {
    if (entry && Array.isArray(entry.permissions)) {
      const category = entry.category ?? entry.name ?? entry.label ?? ''
      for (const p of entry.permissions) flat.push(normalizePermissionItem(p, category))
    } else if (entry) {
      flat.push(normalizePermissionItem(entry, entry.category ?? entry.group ?? ''))
    }
  }
  return flat
}

/** Rollarni boshqarish (GET/POST/PUT/PATCH/DELETE /api/v1/auth/roles/,
 * GET /api/v1/auth/roles/permission-catalog/) — faqat SuperAdmin/manage_roles. */
export const useRolesStore = defineStore('roles', () => {
  const roles = ref<Role[]>([])
  const permissionCatalog = ref<PermissionItem[]>([])
  const loading = ref(false)
  const error = ref('')
  const catalogLoading = ref(false)
  const catalogError = ref('')

  /** Sahifalar `page` raqami bo'yicha so'raladi — javobdagi `next` mutlaq URL
   * (masalan Docker ichidagi boshqa host) bo'lgani uchun unga ergashish
   * ishlamay qolishi mumkin edi. Endpoint `page_size`ni qo'llab-quvvatlamaydi
   * (sxemada faqat `ordering`/`page`/`search`), shu sabab rollar bir necha
   * sahifada kelishi mumkin. */
  async function fetchRoles() {
    loading.value = true
    error.value = ''
    try {
      const all: Role[] = []
      let page = 1
      let hasNext = true
      while (hasNext && page <= 20) {
        const { data }: { data: any } = await http.get('/api/v1/auth/roles/', { params: { page } })
        const results = data?.results ?? data
        all.push(...(Array.isArray(results) ? results : []).map(normalizeRole))
        hasNext = Boolean(data?.next)
        page++
      }
      roles.value = all
    } catch {
      error.value = "Rollar ro'yxatini yuklashda xatolik yuz berdi."
    } finally {
      loading.value = false
    }
  }

  async function fetchPermissionCatalog() {
    catalogLoading.value = true
    catalogError.value = ''
    try {
      const { data } = await http.get('/api/v1/auth/roles/permission-catalog/')
      permissionCatalog.value = normalizePermissionCatalog(data)
    } catch {
      catalogError.value = "Ruxsatlar ro'yxatini yuklashda xatolik yuz berdi."
    } finally {
      catalogLoading.value = false
    }
  }

  async function addRole(payload: RolePayload) {
    const { data } = await http.post('/api/v1/auth/roles/', payload)
    roles.value.unshift(normalizeRole(data))
  }

  async function updateRole(id: number, payload: Partial<RolePayload>) {
    const { data } = await http.patch(`/api/v1/auth/roles/${id}/`, payload)
    const idx = roles.value.findIndex((r) => r.id === id)
    if (idx !== -1) roles.value[idx] = normalizeRole(data)
  }

  async function removeRole(id: number) {
    await http.delete(`/api/v1/auth/roles/${id}/`)
    roles.value = roles.value.filter((r) => r.id !== id)
  }

  return {
    roles,
    permissionCatalog,
    loading,
    error,
    catalogLoading,
    catalogError,
    fetchRoles,
    fetchPermissionCatalog,
    addRole,
    updateRole,
    removeRole,
  }
})
