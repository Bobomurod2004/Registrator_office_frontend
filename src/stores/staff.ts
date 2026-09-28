import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { extractApiError, http } from '@/services/http'
import type { BackendRole, UserRoleAssignment } from '@/stores/auth'
import { useRolesStore } from '@/stores/roles'

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
  /** Ustun bo'lim (Fakultet → Kafedra). HEMIS buni avvaldan yuborardi, lekin
   * backendda saqlanmasdi; endi to'ldiriladi. Ildiz bo'limlarda `null`. */
  parent: number | null
  /** 11 Fakultet, 12 Kafedra, 13 Bo'lim, 14 Boshqarma, 15 Markaz, 16 Rektorat. */
  structure_type_code: string
  structure_type_name: string
}

/** Bo'lim tanlash ro'yxatlari uchun guruh (`<optgroup>`): fakultet va uning kafedralari. */
export interface DepartmentGroup {
  label: string
  items: Department[]
}

function normalizeDepartment(raw: any): Department {
  return {
    id: Number(raw?.id),
    name_uz: String(raw?.name_uz ?? ''),
    name_ru: String(raw?.name_ru ?? ''),
    name_en: String(raw?.name_en ?? ''),
    parent: raw?.parent == null || raw.parent === '' ? null : Number(raw.parent),
    structure_type_code: String(raw?.structure_type_code ?? ''),
    structure_type_name: String(raw?.structure_type_name ?? ''),
  }
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

export interface RoleAssignmentPayload {
  role: number
  department?: number | null
  request_scope?: 'none' | 'department' | 'category' | 'all'
  request_categories?: string[]
  starts_at?: string | null
  expires_at?: string | null
  note?: string
}

function normalizeRoleAssignment(raw: any): UserRoleAssignment {
  const nestedRole = raw?.role && typeof raw.role === 'object' ? raw.role : null
  const nestedDepartment = raw?.department && typeof raw.department === 'object' ? raw.department : null
  const categories = raw?.request_categories ?? raw?.categories ?? []
  return {
    id: Number(raw?.id),
    role: Number(nestedRole?.id ?? raw?.role ?? raw?.role_id),
    role_code: String(raw?.role_code ?? nestedRole?.code ?? ''),
    role_display: String(raw?.role_display ?? nestedRole?.name ?? nestedRole?.display ?? ''),
    permissions: Array.isArray(raw?.permissions ?? nestedRole?.permissions)
      ? (raw.permissions ?? nestedRole.permissions).map((permission: any) =>
          typeof permission === 'string' ? permission : String(permission?.code ?? permission?.codename ?? ''),
        ).filter(Boolean)
      : [],
    department: raw?.department == null || raw.department === ''
      ? null
      : Number(nestedDepartment?.id ?? raw.department),
    department_name: String(raw?.department_name ?? raw?.department_display ?? nestedDepartment?.name_uz ?? ''),
    request_scope: raw?.request_scope ?? 'none',
    request_categories: Array.isArray(categories) ? categories.map(String) : [],
    starts_at: raw?.starts_at ?? null,
    expires_at: raw?.expires_at ?? null,
    note: String(raw?.note ?? ''),
    is_primary: Boolean(raw?.is_primary),
    is_active: raw?.is_active == null ? true : Boolean(raw.is_active),
  }
}

/** Bir "yuklash" bosqichida nechta sahifa olinadi. `/auth/users/` da `page_size`
 * yo'q (sxema bilan tasdiqlangan), shu sabab sahifa hajmini backend belgilaydi. */
const PAGES_PER_BATCH = 8

export const useStaffStore = defineStore('staff', () => {
  const rolesStore = useRolesStore()

  const members = ref<StaffMember[]>([])
  const departments = ref<Department[]>([])
  const loading = ref(false)
  const error = ref('')
  /** Ko'rib chiqilmagan sahifalar qolgan bo'lsa — "Yana yuklash" tugmasi uchun. */
  const hasMore = ref(false)
  const nextPage = ref(1)
  /** Nechta foydalanuvchi ko'rib chiqilgani / backenddagi umumiy soni (talabalar bilan birga). */
  const scanned = ref(0)
  const totalUsers = ref(0)
  const searchTerm = ref('')

  /** `/api/v1/auth/users/` da rol bo'yicha filtr yo'q, ro'yxat talabalar bilan
   * aralash keladi. Talaba roli eng kichik yoki eng katta ID bo'lsa, saralash
   * orqali xodimlarni birinchi sahifalarga chiqarib olamiz; aks holda backend
   * tartibi qoladi. Backend `ordering=role`ni qo'llab-quvvatlamasa, DRF uni
   * shunchaki e'tiborsiz qoldiradi — zarari yo'q. */
  function staffFirstOrdering(): string | undefined {
    const ids = rolesStore.roles.map((r) => r.id).filter((id) => Number.isFinite(id))
    const studentId = rolesStore.roles.find((r) => r.code === 'student')?.id
    if (!ids.length || studentId === undefined) return undefined
    if (studentId === Math.max(...ids)) return 'role'
    if (studentId === Math.min(...ids)) return '-role'
    return undefined
  }

  function isStudent(member: StaffMember) {
    if (member.role_code) return member.role_code === 'student'
    const studentId = rolesStore.roles.find((r) => r.code === 'student')?.id
    return studentId !== undefined && member.role === studentId
  }

  /**
   * Backend `/api/v1/auth/users/` BARCHA foydalanuvchilarni qaytaradi — HEMIS
   * sinxronizatsiyasidan keyin bu 23 000+ talaba degani. Avval bu yerda barcha
   * sahifalar `next` havolasi bo'yicha oxirigacha yig'ilardi, ya'ni mingdan
   * ortiq ketma-ket so'rov — SuperAdmin uchun ro'yxat shu sabab yuklanmay
   * qolgan edi (bo'lim ma'muri faqat o'z bo'lim xodimlarini ko'rgani uchun
   * ta'sirlanmagan). Endi cheklangan sonli sahifa olinadi, sahifa `page`
   * raqami bo'yicha so'raladi (javobdagi `next` mutlaq URL — Docker ichidagi
   * boshqa host bo'lishi mumkin) va xato bo'lsa yig'ilgani saqlanib qoladi.
   */
  async function loadPages(startPage: number, reset: boolean) {
    loading.value = true
    error.value = ''
    if (reset) {
      members.value = []
      scanned.value = 0
    }

    let page = startPage
    let loadedPages = 0
    try {
      while (loadedPages < PAGES_PER_BATCH) {
        const { data } = await http.get('/api/v1/auth/users/', {
          params: { page, search: searchTerm.value || undefined, ordering: staffFirstOrdering() },
        })
        const results: StaffMember[] = data?.results ?? (Array.isArray(data) ? data : [])
        totalUsers.value = data?.count ?? results.length
        scanned.value += results.length
        members.value.push(...results.filter((member) => !isStudent(member)))
        loadedPages++
        page++
        if (!data?.next) {
          hasMore.value = false
          nextPage.value = page
          return
        }
      }
      hasMore.value = true
      nextPage.value = page
    } catch (err) {
      // Yig'ilgan qatorlar o'chirilmaydi — qisman ro'yxat hech narsadan yaxshi.
      // Xabar bo'sh chiqsa 'load' sentineli qoladi: ekranda umumiy matn ko'rsatiladi.
      error.value = extractApiError(err, '') || 'load'
      nextPage.value = page
      hasMore.value = true
    } finally {
      loading.value = false
    }
  }

  function fetchMembers(opts: { search?: string } = {}) {
    searchTerm.value = opts.search?.trim() ?? ''
    return loadPages(1, true)
  }

  function loadMoreMembers() {
    return loadPages(nextPage.value, false)
  }

  /**
   * MUHIM: `/api/v1/departments/` `page_size` parametrini QO'LLAB-QUVVATLAMAYDI
   * (sxemada faqat `is_active`/`page`/`parent`/`search`). Avval bu yerda
   * `page_size: 200` yuborilar va javobdagi `next` umuman o'qilmas edi —
   * DRF noma'lum parametrni e'tiborsiz qoldirgani uchun amalda faqat BIRINCHI
   * sahifa (~10 ta bo'lim) yuklanardi. Oqibati: xizmat/xodim formalaridagi
   * "Bo'lim" tanlovida bo'limlarning katta qismi umuman ko'rinmas, tahrirlashda
   * esa mavjud bo'lim ro'yxatda topilmay maydon bo'sh ko'rinardi.
   * Endi `next` tugaguncha sahifalab to'liq yig'iladi (bo'limlar soni kichik).
   */
  let departmentsPromise: Promise<void> | null = null

  async function loadDepartments() {
    const all: Department[] = []
    let page = 1
    let hasNext = true
    // Xavfsizlik chegarasi: backend `next`ni noto'g'ri qaytarsa cheksiz aylanmasin.
    while (hasNext && page <= 30) {
      const { data } = await http.get('/api/v1/departments/', { params: { is_active: true, page } })
      const results = data?.results ?? data
      if (Array.isArray(results)) {
        all.push(...results.map(normalizeDepartment).filter((dept) => Number.isFinite(dept.id)))
      }
      hasNext = Boolean(data?.next)
      page++
    }
    departments.value = all
  }

  /**
   * Bo'limlar ro'yxati kamdan-kam o'zgaradi, lekin deyarli har bir sahifada
   * (Xodimlar, Sozlamalar, Murojaatlar) qaytadan so'ralardi. Endi bir marta
   * yuklanib keshlanadi; `force: true` bilan majburan yangilash mumkin.
   */
  /**
   * Yassi 112 ta bo'limni tanlash ro'yxatlarida `<optgroup>` bilan ko'rsatish
   * uchun guruhlaydi: farzandi bor ildiz (odatda Fakultet) o'z guruhini
   * boshqaradi va o'zi ham tanlanadigan bo'lib qoladi; farzandi yo'q ildizlar
   * esa tuzilma turi (Boshqarma/Markaz/Rektorat...) bo'yicha yig'iladi.
   */
  const departmentGroups = computed<DepartmentGroup[]>(() => {
    const list = departments.value
    const byId = new Map(list.map((dept) => [dept.id, dept]))
    const children = new Map<number, Department[]>()
    const roots: Department[] = []

    for (const dept of list) {
      const parentId = dept.parent
      if (parentId != null && parentId !== dept.id && byId.has(parentId)) {
        const bucket = children.get(parentId)
        if (bucket) bucket.push(dept)
        else children.set(parentId, [dept])
      } else {
        roots.push(dept)
      }
    }

    const groups: DepartmentGroup[] = []
    const standalone: Department[] = []
    for (const root of roots) {
      const kids = children.get(root.id)
      if (kids?.length) groups.push({ label: root.name_uz, items: [root, ...kids] })
      else standalone.push(root)
    }

    const byType = new Map<string, Department[]>()
    for (const dept of standalone) {
      const label = dept.structure_type_name
      const bucket = byType.get(label)
      if (bucket) bucket.push(dept)
      else byType.set(label, [dept])
    }
    for (const [label, items] of byType) groups.push({ label, items })

    return groups
  })

  function fetchDepartments(opts: { force?: boolean } = {}): Promise<void> {
    if (opts.force) departmentsPromise = null
    if (departments.value.length && !opts.force) return Promise.resolve()
    departmentsPromise ??= loadDepartments().catch((err) => {
      // Keshni tozalaymiz, shunda keyingi sahifada qayta urinib ko'riladi.
      departmentsPromise = null
      throw err
    })
    const pending = departmentsPromise
    // Fon rejimida (sahifa ochilishi) xato jim yutiladi — bo'lim tanlash
    // ro'yxati bo'sh qoladi, lekin asosiy jadvallar ishlashda davom etadi.
    // `force` bilan chaqirilganda (admin tugmasi) xato chaqiruvchiga
    // yetkaziladi, shunda ekranda aniq sabab ko'rsatiladi.
    return opts.force ? pending : pending.catch(() => {})
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

  /**
   * Yaratilgan/yangilangan foydalanuvchini ro'yxatda darhol aks ettiradi.
   * Avval bu amallardan keyin `loadPages(1, true)` chaqirilar — ya'ni 23 000+
   * foydalanuvchi ustidan yana 8 ta ketma-ket so'rov ketardi. Bundan tashqari
   * yangi qo'shilgan xodim birinchi 8 sahifaga tushmasligi mumkin edi va
   * ro'yxatda umuman ko'rinmasdi (foydalanuvchiga "qo'shilmadi" bo'lib
   * tuyulardi). Backend yaratilgan obyektni qaytaradi — shuni ishlatamiz.
   */
  function upsertMember(raw: any): boolean {
    if (!raw || typeof raw !== 'object') return false
    const user = raw.user ?? raw
    if (!Number.isFinite(Number(user?.id))) return false
    const member = user as StaffMember
    if (isStudent(member)) return true
    const idx = members.value.findIndex((item) => item.id === member.id)
    if (idx === -1) members.value.unshift(member)
    else members.value[idx] = { ...members.value[idx], ...member }
    return true
  }

  async function createMember(payload: CreateStaffPayload) {
    const { data } = await http.post('/api/v1/auth/users/create/', payload)
    // Javobdan foydalanib bo'lmasa (kutilmagan shakl) — joriy qidiruvni
    // saqlagan holda ro'yxatni qayta yuklaymiz.
    if (!upsertMember(data)) await loadPages(1, true)
  }

  async function removeMember(id: number) {
    await http.delete(`/api/v1/auth/users/${id}/`)
    members.value = members.value.filter((m) => m.id !== id)
  }

  async function updateRole(id: number, role: number, password?: string) {
    const { data } = await http.patch(`/api/v1/auth/users/${id}/role/`, {
      role,
      password: password || undefined,
    })
    if (!upsertMember(data)) await loadPages(1, true)
  }

  /** Faol va revoke qilingan assignmentlar uchun backend audit ma'lumotini
   * o'zgartirmay qaytaradi. UI primary assignmentni shu yerda ham ko'rsatadi,
   * lekin uni DELETE qilmaydi. */
  async function fetchRoleAssignments(userId: number): Promise<UserRoleAssignment[]> {
    const { data } = await http.get(`/api/v1/auth/users/${userId}/role-assignments/`)
    const rows = data?.results ?? data
    return Array.isArray(rows) ? rows.map(normalizeRoleAssignment) : []
  }

  async function createRoleAssignment(userId: number, payload: RoleAssignmentPayload) {
    await http.post(`/api/v1/auth/users/${userId}/role-assignments/`, payload)
  }

  async function updateRoleAssignment(userId: number, assignmentId: number, payload: Partial<RoleAssignmentPayload>) {
    await http.patch(`/api/v1/auth/users/${userId}/role-assignments/${assignmentId}/`, payload)
  }

  async function revokeRoleAssignment(userId: number, assignmentId: number) {
    await http.delete(`/api/v1/auth/users/${userId}/role-assignments/${assignmentId}/`)
  }

  return {
    members,
    departments,
    departmentGroups,
    loading,
    error,
    hasMore,
    scanned,
    totalUsers,
    searchTerm,
    fetchMembers,
    loadMoreMembers,
    fetchDepartments,
    lookupEmployee,
    createMember,
    removeMember,
    updateRole,
    fetchRoleAssignments,
    createRoleAssignment,
    updateRoleAssignment,
    revokeRoleAssignment,
  }
})
