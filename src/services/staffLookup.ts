import { http, resolveMediaUrl } from '@/services/http'

/**
 * Tizimdagi xodimlarni qidirish (`GET /api/v1/auth/users/?is_staff=true&search=`).
 * Rahbar biriktirish ro'yxati uchun ishlatiladi (LeadershipRecipientsPanel).
 * Xodim rasmi himoyalangan (Bearer talab qiladi), shu sabab bu yerda olinmaydi —
 * ko'rinishda harf-avatar ishlatiladi.
 */
export interface StaffSearchResult {
  id: number
  fullName: string
  hemisId: string
  roleDisplay: string
  departmentName: string
  email: string
  phone: string | null
  isLocked: boolean
}

function str(v: unknown): string {
  return v == null ? '' : String(v)
}

function strOrNull(v: unknown): string | null {
  return v == null || v === '' ? null : String(v)
}

function normalizeStaff(raw: any): StaffSearchResult {
  return {
    id: Number(raw?.id) || 0,
    fullName: str(raw?.full_name),
    hemisId: str(raw?.hemis_id),
    roleDisplay: str(raw?.role_display),
    departmentName: str(raw?.department_name),
    email: str(raw?.email),
    phone: raw?.phone ? str(raw.phone) : null,
    isLocked: raw?.is_locked === true,
  }
}

export async function searchStaff(q: string, limit = 20): Promise<StaffSearchResult[]> {
  const { data } = await http.get('/api/v1/auth/users/', {
    params: { is_staff: true, search: q.trim(), page_size: limit },
  })
  const list = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : []
  return list.map(normalizeStaff)
}

/**
 * HEMIS'dan jonli xodim qidiruvi (`GET /api/v1/hemis/employees/search/`).
 * Faqat xodim/admin rollari uchun; talaba uchun backend 403 qaytaradi.
 * `q` — ism, familiya yoki HEMIS ID (kamida 2 belgi).
 *
 * Ko'p maydonlar `null` bo'lishi mumkin. Sanalar backend tomonidan `YYYY-MM-DD`
 * ko'rinishida keladi. Kodlar (`*Code`) hozircha faqat ma'lumot sifatida saqlanadi.
 */
export interface HemisEmployeeResult {
  hemisId: string
  fullName: string
  department: string
  inSystem: boolean
  userId: number | null
  userRole: string | null
  localDepartmentId: number | null
  birthDate: string | null
  phone: string | null
  academicDegree: string | null
  academicDegreeCode: string | null
  academicRank: string | null
  academicRankCode: string | null
  staffPosition: string | null
  staffPositionCode: string | null
  employeeType: string | null
  employeeTypeCode: string | null
  employeeStatus: string | null
  employeeStatusCode: string | null
  employmentForm: string | null
  employmentFormCode: string | null
  employmentStaff: string | null
  employmentStaffCode: string | null
  contractDate: string | null
  decreeDate: string | null
  departmentStructureType: string | null
  departmentStructureTypeCode: string | null
  departmentLocalityType: string | null
  departmentLocalityTypeCode: string | null
  province: string | null
  provinceCode: string | null
  district: string | null
  districtCode: string | null
  /** Rasm (agar backend yuborsa); yo'q bo'lsa harf-avatar ko'rsatiladi. */
  imageUrl: string | null
}

export interface HemisEmployeeSearch {
  source: string
  count: number
  truncated: boolean
  results: HemisEmployeeResult[]
}

function normalizeHemisEmployee(raw: any): HemisEmployeeResult {
  return {
    hemisId: str(raw?.hemis_id),
    fullName: str(raw?.full_name),
    department: str(raw?.department),
    inSystem: raw?.in_system === true,
    userId: raw?.user_id == null ? null : Number(raw.user_id) || null,
    userRole: strOrNull(raw?.user_role),
    localDepartmentId: raw?.local_department_id == null ? null : Number(raw.local_department_id) || null,
    birthDate: strOrNull(raw?.birth_date),
    phone: strOrNull(raw?.phone),
    academicDegree: strOrNull(raw?.academic_degree),
    academicDegreeCode: strOrNull(raw?.academic_degree_code),
    academicRank: strOrNull(raw?.academic_rank),
    academicRankCode: strOrNull(raw?.academic_rank_code),
    staffPosition: strOrNull(raw?.staff_position),
    staffPositionCode: strOrNull(raw?.staff_position_code),
    employeeType: strOrNull(raw?.employee_type),
    employeeTypeCode: strOrNull(raw?.employee_type_code),
    employeeStatus: strOrNull(raw?.employee_status),
    employeeStatusCode: strOrNull(raw?.employee_status_code),
    employmentForm: strOrNull(raw?.employment_form),
    employmentFormCode: strOrNull(raw?.employment_form_code),
    employmentStaff: strOrNull(raw?.employment_staff),
    employmentStaffCode: strOrNull(raw?.employment_staff_code),
    contractDate: strOrNull(raw?.contract_date),
    decreeDate: strOrNull(raw?.decree_date),
    departmentStructureType: strOrNull(raw?.department_structure_type),
    departmentStructureTypeCode: strOrNull(raw?.department_structure_type_code),
    departmentLocalityType: strOrNull(raw?.department_locality_type),
    departmentLocalityTypeCode: strOrNull(raw?.department_locality_type_code),
    province: strOrNull(raw?.province),
    provinceCode: strOrNull(raw?.province_code),
    district: strOrNull(raw?.district),
    districtCode: strOrNull(raw?.district_code),
    imageUrl: resolveMediaUrl(strOrNull(raw?.image)),
  }
}

export async function searchHemisEmployees(q: string, limit = 20): Promise<HemisEmployeeSearch> {
  const { data } = await http.get('/api/v1/hemis/employees/search/', {
    params: { q: q.trim(), limit },
  })
  const list = Array.isArray(data?.results) ? data.results : []
  return {
    source: str(data?.source),
    count: Number(data?.count) || list.length,
    truncated: data?.truncated === true,
    results: list.map(normalizeHemisEmployee),
  }
}
