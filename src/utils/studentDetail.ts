import type { Messages } from '@/i18n/messages'
import type { StudentSearchResult } from '@/services/hemisLookup'

export interface StudentDetailGroup {
  title: string
  items: { label: string; value: string }[]
}

/** `YYYY-MM-DD` → `DD.MM.YYYY`; boshqa shakl o'zgarishsiz qaytadi. */
export function formatBirthDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  return match ? `${match[3]}.${match[2]}.${match[1]}` : value
}

/**
 * Qidiruv javobidagi barcha maydonlar bo'limlarga ajratiladi; bo'sh qiymatlar
 * ko'rsatilmaydi. Fakultet/kurs/guruh qisqa qatorda bo'lgani uchun bu yerda
 * takrorlanmaydi. Header qidiruvi va shaxs qidiruv paneli shuni ishlatadi.
 */
export function studentDetailGroups(s: StudentSearchResult, m: Messages): StudentDetailGroup[] {
  const d = m.header.studentDetail
  const groups: Array<{ title: string; items: Array<[string, string | number | null]> }> = [
    {
      title: d.personal,
      items: [
        [d.birthDate, s.birthDate ? formatBirthDate(s.birthDate) : ''],
        [d.gender, s.genderName],
        [d.phone, s.phone],
        [d.email, s.email],
      ],
    },
    {
      title: d.academic,
      items: [
        [d.specialty, s.specialtyCode ? `${s.specialty} (${s.specialtyCode})` : s.specialty],
        [d.semester, s.semester],
        [d.educationYear, s.educationYear],
        [d.gpa, s.gpa],
        [d.avgGrade, s.avgGrade],
        [d.totalCredit, s.totalCredit],
        [d.status, s.studentStatus],
      ],
    },
    {
      title: d.education,
      items: [
        [d.educationType, s.educationType],
        [d.educationForm, s.educationForm],
        [d.educationLang, s.educationLang],
        [d.paymentForm, s.paymentForm],
      ],
    },
    {
      title: d.address,
      items: [
        [d.province, s.province],
        [d.district, s.district],
        [d.accommodation, s.accommodation],
        [d.dormitory, s.hasDormitory ? m.profile.yes : m.profile.no],
      ],
    },
  ]
  return groups
    .map((g) => ({
      title: g.title,
      items: g.items
        .filter(([, value]) => value !== null && value !== '')
        .map(([label, value]) => ({ label, value: String(value) })),
    }))
    .filter((g) => g.items.length)
}
