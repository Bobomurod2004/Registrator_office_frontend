import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface StaffMember {
  id: string
  name: string
  position: string
  department: string
  phone: string
}

const STORAGE_KEY = 'r-office-staff'

const SEED: StaffMember[] = [
  {
    id: 'EMP-1001',
    name: 'Nodira Aliyeva',
    position: 'Registrator',
    department: 'Registrator ofisi',
    phone: '+998 90 123 45 67',
  },
  {
    id: 'EMP-1002',
    name: 'Bekzod Tursunov',
    position: 'Dekan muovini',
    department: 'Filologiya fakulteti',
    phone: '+998 91 222 33 44',
  },
  {
    id: 'EMP-1003',
    name: 'Sevara Qodirova',
    position: 'Buxgalter',
    department: 'Buxgalteriya',
    phone: '+998 93 555 66 77',
  },
]

function load(): StaffMember[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StaffMember[]) : [...SEED]
  } catch {
    return [...SEED]
  }
}

export const useStaffStore = defineStore('staff', () => {
  const members = ref<StaffMember[]>(load())

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members.value))
  }

  function addMember(payload: Omit<StaffMember, 'id'>) {
    const id = `EMP-${1004 + members.value.length}`
    members.value.unshift({ id, ...payload })
    save()
  }

  function removeMember(id: string) {
    members.value = members.value.filter((m) => m.id !== id)
    save()
  }

  return { members, addMember, removeMember }
})
