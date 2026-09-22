import { defineStore } from 'pinia'
import { ref } from 'vue'
import { http } from '@/services/http'

export interface PermissionItem {
  code: string
  name: string
  category: string
}

export interface Role {
  id: number
  name: string
  code: string
  description: string
  permissions: string[]
  isSystem: boolean
  usersCount: number
}

export interface RolePayload {
  name: string
  code?: string
  description?: string
  permissions: string[]
}

/** Rol obyektining aniq maydon nomlari Swagger'da hujjatlashtirilmagan
 * ("No response body"), shu sabab bir nechta ehtimoliy nom moslashuvchan
 * tarzda o'qiladi — xuddi shu loyihadagi boshqa hujjatlanmagan endpointlar
 * (masalan statistics.ts) uchun qo'llanilgan naqsh. */
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
    usersCount: raw.users_count ?? raw.user_count ?? raw.members_count ?? 0,
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

  async function fetchRoles() {
    loading.value = true
    error.value = ''
    try {
      const all: Role[] = []
      let url: string | null = '/api/v1/auth/roles/'
      let params: Record<string, unknown> | undefined = { page_size: 100 }
      while (url) {
        const { data }: { data: any } = await http.get(url, { params })
        const results = data?.results ?? data
        all.push(...(Array.isArray(results) ? results : []).map(normalizeRole))
        url = data?.next ?? null
        params = undefined
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
