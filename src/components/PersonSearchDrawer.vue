<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import StudentSearchItem from '@/components/StudentSearchItem.vue'
import StaffSearchItem from '@/components/StaffSearchItem.vue'
import { useLocaleStore } from '@/stores/locale'
import { searchStudents, type StudentSearchResult } from '@/services/hemisLookup'
import { searchHemisEmployees, type HemisEmployeeResult } from '@/services/staffLookup'
import { extractApiError, isForbidden } from '@/services/http'

/**
 * O'ng tomondan ochiladigan shaxs qidiruvi. Murojaatda faqat ism kelganda
 * rahbar/xodim shaxsni topishi uchun: talabalar (HEMIS) va xodimlar (tizim).
 * Talaba natijasi to'liq HEMIS ma'lumoti bilan ochiladi (StudentSearchItem).
 */
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const localeStore = useLocaleStore()
const m = computed(() => localeStore.m)

type Tab = 'students' | 'staff'
const tab = ref<Tab>('students')
const query = ref('')
const loading = ref(false)
const error = ref('')
const truncated = ref(false)
const source = ref<'local' | 'hemis' | null>(null)
const students = ref<StudentSearchResult[]>([])
const staff = ref<HemisEmployeeResult[]>([])
const expandedHemisId = ref<string | null>(null)
const expandedStaffId = ref<string | null>(null)

let debounce: number | undefined
let requestSeq = 0

function reset() {
  students.value = []
  staff.value = []
  error.value = ''
  truncated.value = false
  source.value = null
  expandedHemisId.value = null
  expandedStaffId.value = null
}

async function run(from?: 'hemis') {
  const q = query.value.trim()
  const seq = ++requestSeq
  if (q.length < 2) {
    reset()
    error.value = q.length > 0 ? m.value.header.searchMinChars : ''
    loading.value = false
    return
  }
  loading.value = true
  error.value = ''
  try {
    if (tab.value === 'students') {
      const res = await searchStudents(q, { source: from })
      if (seq !== requestSeq) return
      students.value = res.results
      source.value = res.source
      truncated.value = res.truncated
      expandedHemisId.value = res.results.length === 1 ? res.results[0]!.hemisId : null
      if (!res.results.length) error.value = m.value.header.searchNotFound
    } else {
      const res = await searchHemisEmployees(q)
      if (seq !== requestSeq) return
      staff.value = res.results
      truncated.value = res.truncated
      expandedStaffId.value = res.results.length === 1 ? res.results[0]!.hemisId : null
      if (!res.results.length) error.value = m.value.person.staffNotFound
    }
  } catch (err) {
    if (seq !== requestSeq) return
    students.value = []
    staff.value = []
    error.value = isForbidden(err)
      ? m.value.person.staffForbidden
      : extractApiError(err, m.value.person.loadError)
  } finally {
    if (seq === requestSeq) loading.value = false
  }
}

function onInput() {
  window.clearTimeout(debounce)
  debounce = window.setTimeout(() => void run(), 400)
}

function switchTab(next: Tab) {
  if (tab.value === next) return
  tab.value = next
  reset()
  if (query.value.trim().length >= 2) void run()
}

function toggleStudent(hemisId: string) {
  expandedHemisId.value = expandedHemisId.value === hemisId ? null : hemisId
}

function toggleStaff(hemisId: string) {
  expandedStaffId.value = expandedStaffId.value === hemisId ? null : hemisId
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) window.addEventListener('keydown', onKeydown)
    else window.removeEventListener('keydown', onKeydown)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  window.clearTimeout(debounce)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="person-drawer-root">
      <div class="person-drawer-overlay" @click="emit('close')" />
      <aside class="person-drawer" role="dialog" aria-modal="true" :aria-label="m.person.title">
        <header class="person-drawer-head">
          <h2>{{ m.person.title }}</h2>
          <button type="button" class="person-drawer-close" :aria-label="m.person.close" @click="emit('close')">×</button>
        </header>

        <div class="person-drawer-tabs">
          <button
            type="button"
            class="person-drawer-tab"
            :class="{ active: tab === 'students' }"
            @click="switchTab('students')"
          >
            {{ m.person.tabStudents }}
          </button>
          <button
            type="button"
            class="person-drawer-tab"
            :class="{ active: tab === 'staff' }"
            @click="switchTab('staff')"
          >
            {{ m.person.tabStaff }}
          </button>
        </div>

        <input
          v-model="query"
          class="form-control person-drawer-input"
          type="search"
          :placeholder="tab === 'students' ? m.person.studentPlaceholder : m.person.staffPlaceholder"
          autofocus
          @input="onInput"
        />
        <p class="person-drawer-hint">{{ m.person.hint }}</p>

        <div class="person-drawer-body">
          <p v-if="loading" class="person-drawer-status">{{ m.header.searching }}</p>
          <p v-else-if="error" class="person-drawer-status person-drawer-error">{{ error }}</p>

          <template v-else-if="tab === 'students' && students.length">
            <p v-if="truncated" class="person-drawer-status">{{ m.header.tooManyResults }}</p>
            <StudentSearchItem
              v-for="student in students"
              :key="student.hemisId"
              :student="student"
              :expanded="expandedHemisId === student.hemisId"
              @toggle="toggleStudent(student.hemisId)"
            />
            <button
              v-if="source === 'local'"
              type="button"
              class="app-search-hemis-btn"
              :disabled="loading"
              @click="run('hemis')"
            >
              {{ m.header.searchFromHemis }}
            </button>
          </template>

          <template v-else-if="tab === 'staff' && staff.length">
            <p v-if="truncated" class="person-drawer-status">{{ m.header.tooManyResults }}</p>
            <StaffSearchItem
              v-for="s in staff"
              :key="s.hemisId"
              :employee="s"
              :expanded="expandedStaffId === s.hemisId"
              @toggle="toggleStaff(s.hemisId)"
            />
          </template>
        </div>
      </aside>
    </div>
  </Teleport>
</template>
