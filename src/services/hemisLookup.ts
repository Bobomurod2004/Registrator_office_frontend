import { fetchAuthenticatedImageUrl, http } from '@/services/http'

export interface HemisStudentInfo {
  fullName: string
  hemisId: string
  faculty: string
  group: string
  course: string
  photoUrl: string
}

/** Rasm fayli backendda himoyalangan (`IsAuthenticated`) bo'lgani uchun
 * tokenli so'rov orqali (blob) yuklanadi — oddiy URL brauzerda ochilmaydi. */
async function normalizeHemisStudent(data: any, fallbackHemisId: string): Promise<HemisStudentInfo> {
  const d = data ?? {}
  const photoUrl = await fetchAuthenticatedImageUrl(d.image || d.photo || d.avatar || '')
  return {
    fullName: d.full_name || d.student_name || d.fullName || d.name || '',
    hemisId: d.hemis_id || d.student_id_number || d.hemisId || fallbackHemisId,
    faculty: d.faculty || d.faculty_name || d.department || d.department_name || '',
    group: d.group || d.group_name || d.groupName || '',
    course: d.course != null ? String(d.course) : d.level != null ? String(d.level) : '',
    photoUrl: photoUrl ?? '',
  }
}

/** GET /api/v1/hemis/student/{hemis_id}/ — xodim istalgan talabani HEMIS ID
 * bo'yicha qidirishi uchun. Javob shakli hujjatlashtirilmagan, shu sabab
 * `/hemis/lookup/` bilan bir xil moslashuvchan o'qish qo'llaniladi. */
export async function lookupStudentByHemisId(hemisId: string): Promise<HemisStudentInfo> {
  const { data } = await http.get(`/api/v1/hemis/student/${encodeURIComponent(hemisId)}/`)
  return normalizeHemisStudent(data, hemisId)
}
