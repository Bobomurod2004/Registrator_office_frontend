import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type AppealCategory = 'onsite' | 'general'
export type AppealStatus = 'new' | 'in_progress' | 'resolved'

export interface Appeal {
  id: string
  studentName: string
  topic: string
  category: AppealCategory
  message: string
  status: AppealStatus
  createdAt: string
}

const STORAGE_KEY = 'r-office-appeals'

const SEED: Appeal[] = [
  {
    id: 'A-1042',
    studentName: 'Madina Yusupova',
    topic: "Ma'lumotnoma kechikishi",
    category: 'general',
    message: "O'qish joyidan ma'lumotnoma 3 kundan beri tayyor bo'lmadi.",
    status: 'new',
    createdAt: '2026-05-28',
  },
  {
    id: 'A-1041',
    studentName: 'Jasur Rahimov',
    topic: 'Auditoriya kaliti',
    category: 'onsite',
    message: '305-auditoriya eshigi ochilmayapti, yordam kerak.',
    status: 'in_progress',
    createdAt: '2026-05-27',
  },
  {
    id: 'A-1039',
    studentName: 'Dilnoza Karimova',
    topic: "To'lov kvitansiyasi",
    category: 'general',
    message: "Kontrakt to'lovi tizimda ko'rinmayapti.",
    status: 'resolved',
    createdAt: '2026-05-25',
  },
]

function load(): Appeal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Appeal[]) : [...SEED]
  } catch {
    return [...SEED]
  }
}

export const useAppealsStore = defineStore('appeals', () => {
  const appeals = ref<Appeal[]>(load())

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appeals.value))
  }

  const total = computed(() => appeals.value.length)
  const newCount = computed(() => appeals.value.filter((a) => a.status === 'new').length)
  const inProgressCount = computed(
    () => appeals.value.filter((a) => a.status === 'in_progress').length,
  )
  const resolvedCount = computed(() => appeals.value.filter((a) => a.status === 'resolved').length)

  function addAppeal(payload: {
    studentName: string
    topic: string
    category: AppealCategory
    message: string
  }) {
    const id = `A-${1043 + appeals.value.length}`
    appeals.value.unshift({
      id,
      studentName: payload.studentName,
      topic: payload.topic,
      category: payload.category,
      message: payload.message,
      status: 'new',
      createdAt: new Date().toISOString().slice(0, 10),
    })
    save()
  }

  function setStatus(id: string, status: AppealStatus) {
    const item = appeals.value.find((a) => a.id === id)
    if (item) {
      item.status = status
      save()
    }
  }

  return {
    appeals,
    total,
    newCount,
    inProgressCount,
    resolvedCount,
    addAppeal,
    setStatus,
  }
})
