import { defineStore } from 'pinia'
import { ref } from 'vue'
import { http } from '@/services/http'
import type { BackendRole } from '@/stores/auth'

export interface StaffMember {
  id: number
  hemis_id: string
  full_name: string
  role: number
  role_code: BackendRole
  role_display: string
  department_name: string
  is_active: boolean
}

export interface Department {
  id: number
  name_uz: string
  name_ru: string
  name_en: string
}

/** GET /api/v1/hemis/employee-lookup/{employee_id_number}/ javobi hujjatlashtirilmagan,
 * shu sabab bo'lishi mumkin bo'lgan ikkala shakl (bizning bazada bor / faqat HEMIS'da bor)
 * moslashuvchan tarzda o'qiladi. */
export interface EmployeeLookupResult {
  exists: boolean
  user?: {
    id: number
    hemis_id: string
    full_name: string
    role: number
    role_code: BackendRole
    role_display: string
    department_name: string
  }
  full_name?: string
  department_name?: string
  position?: string
}

/** `role` endi Role ID (butun son) — backenddagi rollar tizimi o'zgarishi. */
export interface CreateStaffPayload {
  employee_id_number: string
  full_name?: string
  role: number
  department?: number | null
  email?: string
  phone?: string
  password?: string
}

export const useStaffStore = defineStore('staff', () => {
  const members = ref<StaffMember[]>([])
  const departments = ref<Department[]>([])
  const loading = ref(false)
  const error = ref('')

  async function fetchMembers() {
    loading.value = true
    error.value = ''
    try {
      // Backend /api/v1/auth/users/ barcha foydalanuvchilarni (talabalar bilan
      // birga) qaytaradi va rol bo'yicha filter parametri yo'q — shu sabab
      // talabalar shu yerda, client tarafda, chiqarib tashlanadi. Talabalar
      // ham sahifalash limitiga kirgani uchun, xodimlar keyingi sahifalarda
      // qolib ketmasligi uchun barcha sahifalar to'liq yig'ib olinadi.
      const all: StaffMember[] = []
      let url: string | null = '/api/v1/auth/users/'
      let params: Record<string, number> | undefined = { page_size: 100 }
      while (url) {
        const { data }: { data: { results?: StaffMember[]; next: string | null } } = await http.get(url, { params })
        all.push(...(data.results ?? []))
        url = data.next
        params = undefined
      }
      members.value = all.filter((member) => member.role_code !== 'student')
    } catch {
      error.value = 'load'
    } finally {
      loading.value = false
    }
  }

  async function fetchDepartments() {
    try {
      const { data } = await http.get('/api/v1/departments/', { params: { is_active: true, page_size: 200 } })
      departments.value = data.results ?? data
    } catch {
      // Jim tur — bo'lim tanlash ro'yxati shunchaki bo'sh qoladi, asosiy
      // xodimlar jadvali (fetchMembers) ishlashda davom etadi.
    }
  }

  async function lookupEmployee(employeeIdNumber: string): Promise<EmployeeLookupResult> {
    const { data } = await http.get(`/api/v1/hemis/employee-lookup/${encodeURIComponent(employeeIdNumber)}/`)
    return {
      exists: Boolean(data.exists ?? data.already_exists ?? data.user),
      user: data.user,
      full_name: data.full_name,
      department_name: data.department_name,
      position: data.position,
    }
  }

  async function createMember(payload: CreateStaffPayload) {
    await http.post('/api/v1/auth/users/create/', payload)
    await fetchMembers()
  }

  async function removeMember(id: number) {
    await http.delete(`/api/v1/auth/users/${id}/`)
    members.value = members.value.filter((m) => m.id !== id)
  }

  async function updateRole(id: number, role: number, password?: string) {
    await http.patch(`/api/v1/auth/users/${id}/role/`, {
      role,
      password: password || undefined,
    })
    await fetchMembers()
  }

  return {
    members,
    departments,
    loading,
    error,
    fetchMembers,
    fetchDepartments,
    lookupEmployee,
    createMember,
    removeMember,
    updateRole,
  }
})
