import { http, resolveMediaUrl } from '@/services/http'

/** GET /api/v1/hemis/students/search/ — Swagger'da to'liq hujjatlashtirilgan,
 * shu sabab taxminiy (defensive) parsing shart emas, maydonlar to'g'ridan-to'g'ri
 * map qilinadi. */
export interface StudentSearchResult {
  hemisId: string
  fullName: string
  firstName: string
  secondName: string
  thirdName: string
  phone: string | null
  email: string
  photoUrl: string
  gender: string
  genderName: string
  birthDate: string
  faculty: string
  specialty: string
  specialtyCode: string
  group: string
  course: string
  semester: string
  educationYear: string
  educationLang: string
  educationForm: string
  educationType: string
  paymentForm: string
  gpa: number | null
  avgGrade: number | null
  totalCredit: number | null
  studentStatus: string
  province: string
  district: string
  accommodation: string
  hasDormitory: boolean
  inSystem: boolean
  userId: number | null
}

export interface StudentSearchResponse {
  source: 'local' | 'hemis'
  count: number
  truncated: boolean
  results: StudentSearchResult[]
}

function normalizeSearchResult(raw: any): StudentSearchResult {
  return {
    hemisId: raw.hemis_id ?? '',
    fullName: raw.full_name ?? '',
    firstName: raw.first_name ?? '',
    secondName: raw.second_name ?? '',
    thirdName: raw.third_name ?? '',
    phone: raw.phone ?? null,
    email: raw.email ?? '',
    photoUrl: resolveMediaUrl(raw.image) ?? '',
    gender: raw.gender ?? '',
    genderName: raw.gender_name ?? '',
    birthDate: raw.birth_date ?? '',
    faculty: raw.faculty ?? '',
    specialty: raw.specialty ?? '',
    specialtyCode: raw.specialty_code ?? '',
    group: raw.group ?? '',
    course: raw.course ?? '',
    semester: raw.semester ?? '',
    educationYear: raw.education_year ?? '',
    educationLang: raw.education_lang ?? '',
    educationForm: raw.education_form ?? '',
    educationType: raw.education_type ?? '',
    paymentForm: raw.payment_form ?? '',
    gpa: raw.gpa ?? null,
    avgGrade: raw.avg_grade ?? null,
    totalCredit: raw.total_credit ?? null,
    studentStatus: raw.student_status ?? '',
    province: raw.province ?? '',
    district: raw.district ?? '',
    accommodation: raw.accommodation ?? '',
    hasDormitory: !!raw.has_dormitory,
    inSystem: !!raw.in_system,
    userId: raw.user_id ?? null,
  }
}

/**
 * Talabani ism/familiya/HEMIS ID bo'yicha qidiradi. Avval bizning bazadan
 * (`source: 'local'`) qidiradi, bazada topilmasa backend'ning o'zi HEMIS'dan
 * qidiradi (`source: 'hemis'`) — bu natija bazaga yozilmaydi. `source: 'hemis'`
 * uzatilsa bazani chetlab, to'g'ridan-to'g'ri HEMIS'dan qidiradi (masalan
 * bazada qisman topilgandan keyin "HEMIS'dan qidirish" tugmasi bosilganda).
 * Faqat xodimlar uchun — talaba chaqirsa backend 403 qaytaradi.
 */
export async function searchStudents(
  q: string,
  opts: { source?: 'hemis'; limit?: number } = {},
): Promise<StudentSearchResponse> {
  const { data } = await http.get('/api/v1/hemis/students/search/', {
    params: { q, source: opts.source, limit: opts.limit },
  })
  return {
    source: data?.source ?? 'local',
    count: data?.count ?? 0,
    truncated: !!data?.truncated,
    results: Array.isArray(data?.results) ? data.results.map(normalizeSearchResult) : [],
  }
}
