import type { Messages } from '@/i18n/messages'
import type { HemisEmployeeResult } from '@/services/staffLookup'
import { formatBirthDate } from '@/utils/studentDetail'

export interface StaffDetailGroup {
  title: string
  items: { label: string; value: string }[]
}

/**
 * Xodim qidiruv natijasidagi maydonlar bo'limlarga ajratiladi; bo'sh qiymatlar
 * ko'rsatilmaydi. Sanalar `YYYY-MM-DD` ko'rinishida `DD.MM.YYYY` ga aylanadi.
 */
export function staffDetailGroups(e: HemisEmployeeResult, m: Messages): StaffDetailGroup[] {
  const d = m.person.staffDetail
  const groups: Array<{ title: string; items: Array<[string, string | null]> }> = [
    {
      title: d.personal,
      items: [
        [d.birthDate, e.birthDate ? formatBirthDate(e.birthDate) : null],
        [d.phone, e.phone],
      ],
    },
    {
      title: d.position,
      items: [
        [d.staffPosition, e.staffPosition],
        [d.academicDegree, e.academicDegree],
        [d.academicRank, e.academicRank],
        [d.employeeType, e.employeeType],
        [d.employeeStatus, e.employeeStatus],
        [d.employmentForm, e.employmentForm],
        [d.employmentStaff, e.employmentStaff],
        [d.contractDate, e.contractDate ? formatBirthDate(e.contractDate) : null],
        [d.decreeDate, e.decreeDate ? formatBirthDate(e.decreeDate) : null],
      ],
    },
    {
      title: d.organization,
      items: [
        [d.department, e.department],
        [d.departmentType, e.departmentStructureType],
        [d.locality, e.departmentLocalityType],
      ],
    },
    {
      title: d.address,
      items: [
        [d.province, e.province],
        [d.district, e.district],
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
