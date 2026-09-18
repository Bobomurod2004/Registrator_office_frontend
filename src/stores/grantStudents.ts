import { defineStore } from 'pinia'
import { ref } from 'vue'
import { http, resolveMediaUrl } from '@/services/http'

export type GrantStatus = 'active' | 'inactive' | 'pending'

export interface GrantEntry {
  id: number
  student: number
  studentName: string
  studentHemisId: string
  faculty: string
  course: string
  group: string
  phone: string
  gpa: string
  socialScore: string
  academicScore: string
  totalScore: string
  status: GrantStatus
  statusDisplay: string
  documentUrl: string | null
  gpaUpdatedAt: string | null
  updatedAt: string
}

export interface UpdateGrantPayload {
  gpa?: string
  social_score?: string
  academic_score?: string
  status?: GrantStatus
}

/** GET /api/v1/auth/grants/ — Grant obyekti Swagger'da to'liq hujjatlashtirilgan. */
function normalize(raw: any): GrantEntry {
  return {
    id: raw.id,
    student: raw.student,
    studentName: raw.student_name ?? '',
    studentHemisId: raw.student_hemis_id ?? '',
    faculty: raw.faculty ?? '',
    course: raw.course ?? '',
    group: raw.group ?? '',
    phone: raw.phone ?? '',
    gpa: raw.gpa ?? '0',
    socialScore: raw.social_score ?? '0',
    academicScore: raw.academic_score ?? '0',
    totalScore: raw.total_score ?? '0',
    status: raw.status ?? 'pending',
    statusDisplay: raw.status_display ?? '',
    documentUrl: resolveMediaUrl(raw.document),
    gpaUpdatedAt: raw.gpa_updated_at ?? null,
    updatedAt: raw.updated_at ?? '',
  }
}

export const useGrantStudentsStore = defineStore('grantStudents', () => {
  const students = ref<GrantEntry[]>([])
  const loading = ref(false)
  const error = ref('')

  async function fetchAll() {
    loading.value = true
    error.value = ''
    try {
      const all: GrantEntry[] = []
      let url: string | null = '/api/v1/auth/grants/'
      let params: Record<string, unknown> | undefined = { page_size: 100 }
      while (url) {
        const { data }: { data: { results?: any[]; next: string | null } } = await http.get(url, { params })
        all.push(...(data.results ?? []).map(normalize))
        url = data.next
        params = undefined
      }
      students.value = all
    } catch {
      error.value = "Grant oluvchilar ro'yxatini yuklashda xatolik yuz berdi."
      students.value = []
    } finally {
      loading.value = false
    }
  }

  /** Xodim grant ballini (GPA, ijtimoiy/akademik ko'rsatkich) yoki holatini yangilaydi. */
  async function updateGrant(id: number, payload: UpdateGrantPayload): Promise<void> {
    const { data } = await http.patch(`/api/v1/auth/grants/${id}/`, payload)
    const idx = students.value.findIndex((s) => s.id === id)
    if (idx !== -1) students.value[idx] = normalize(data)
  }

  return { students, loading, error, fetchAll, updateGrant }
})
