<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import * as XLSX from 'xlsx'
import DashboardLayout from '@/components/DashboardLayout.vue'
import { extractApiError } from '@/services/http'
import { useAuthStore } from '@/stores/auth'
import { useLocaleStore } from '@/stores/locale'
import { useGrantStudentsStore, type GrantStatus } from '@/stores/grantStudents'

const authStore = useAuthStore()
const localeStore = useLocaleStore()
const m = computed(() => localeStore.m)
const gsStore = useGrantStudentsStore()

onMounted(() => {
  if (authStore.isStaff) gsStore.fetchAll()
})

/* ---------- HEMIS bilan sinxronlash (faqat admin) ---------- */

const syncError = ref('')
const syncedMsg = ref(false)

async function syncHemisGrants() {
  syncError.value = ''
  try {
    await gsStore.syncFromHemis()
    syncedMsg.value = true
    window.setTimeout(() => (syncedMsg.value = false), 4000)
  } catch (err) {
    syncError.value = extractApiError(err, m.value.grant.hemisSyncError)
  }
}

/* ---------- Grant oluvchi talabalar ro'yxati (haqiqiy backend, filtr/tahrir/eksport) ---------- */

const facultyFilter = ref('')
const statusFilter = ref<'' | GrantStatus>('')
const searchQuery = ref('')

const facultyOptions = computed(() => {
  const set = new Set(gsStore.students.map((s) => s.faculty).filter(Boolean))
  return Array.from(set).sort()
})

const filteredStudents = computed(() =>
  gsStore.students.filter((s) => {
    if (facultyFilter.value && s.faculty !== facultyFilter.value) return false
    if (statusFilter.value && s.status !== statusFilter.value) return false
    const q = searchQuery.value.trim().toLowerCase()
    if (q && !s.studentName.toLowerCase().includes(q) && !s.phone.toLowerCase().includes(q)) return false
    return true
  }),
)

function resetFilters() {
  facultyFilter.value = ''
  statusFilter.value = ''
  searchQuery.value = ''
}

function initials(name: string) {
  return name.trim().charAt(0).toUpperCase() || '?'
}

function exportToExcel() {
  const rows = filteredStudents.value.map((s) => ({
    [m.value.grant.colStudentId]: s.studentHemisId,
    [m.value.grant.colFullName]: s.studentName,
    [m.value.grant.colCourse]: s.course,
    [m.value.grant.colGroup]: s.group,
    [m.value.grant.colFaculty]: s.faculty,
    [m.value.grant.colStatus]: s.statusDisplay,
    [m.value.grant.colPhone]: s.phone,
    [m.value.grant.colSocialScore]: s.socialScore,
    [m.value.grant.colGpa]: s.gpa,
    [m.value.grant.colAcademicPerformance]: s.academicScore,
    [m.value.grant.colTotalScore]: s.totalScore,
    [m.value.grant.colGpaUpdatedAt]: s.gpaUpdatedAt ?? '',
  }))
  const sheet = XLSX.utils.json_to_sheet(rows)
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, 'Grant talabalari')
  XLSX.writeFile(book, 'grant-talabalari.xlsx')
}

/* ---------- Xodim: grant ballini tahrirlash ---------- */

const editingId = ref<number | null>(null)
const editForm = ref({ gpa: '', social_score: '', academic_score: '', status: 'active' as GrantStatus })
const editSaving = ref(false)
const editError = ref('')

function startEdit(id: number) {
  const s = gsStore.students.find((x) => x.id === id)
  if (!s) return
  editingId.value = id
  editForm.value = { gpa: s.gpa, social_score: s.socialScore, academic_score: s.academicScore, status: s.status }
  editError.value = ''
}

function cancelEdit() {
  editingId.value = null
  editError.value = ''
}

async function saveEdit(id: number) {
  editSaving.value = true
  editError.value = ''
  try {
    await gsStore.updateGrant(id, editForm.value)
    editingId.value = null
  } catch (err) {
    editError.value = extractApiError(err, m.value.grant.updateError)
  } finally {
    editSaving.value = false
  }
}
</script>

<template>
  <DashboardLayout>
    <h1>{{ m.grant.title }}</h1>
    <p class="services-subtitle">{{ m.grant.subtitle }}</p>

    <!-- Talaba ko'rinishi: shaxsiy grant holati -->
    <div v-if="!authStore.isStaff" class="grant-status-card">
      <div class="grant-badge">{{ m.grant.badge }}</div>
      <div>
        <h3>{{ m.grant.statusTitle }}</h3>
        <p>{{ m.grant.statusText }}</p>
      </div>
    </div>

    <!-- Grant oluvchi talabalar ro'yxati -->
    <div v-if="authStore.isStaff" class="info-header-row gs-header">
      <div>
        <h2 class="gs-title">{{ m.grant.studentsTitle }}</h2>
        <p class="services-subtitle">{{ m.grant.studentsSubtitle }}</p>
      </div>
      <button
        v-if="authStore.isAdmin"
        type="button"
        class="appeal-btn"
        :disabled="gsStore.syncing"
        @click="syncHemisGrants"
      >
        <span v-if="gsStore.syncing" class="spinner-border spinner-border-sm" />
        {{ gsStore.syncing ? m.grant.hemisSyncing : m.grant.hemisSync }}
      </button>
    </div>
    <p v-if="authStore.isAdmin && syncedMsg" class="form-success">{{ m.grant.hemisSynced }}</p>
    <p v-if="authStore.isAdmin && syncError" class="form-error">{{ syncError }}</p>

    <div v-if="authStore.isStaff" class="gs-filters">
      <label class="field gs-filter-field">
        <span class="field-label">{{ m.grant.colFaculty }}</span>
        <span class="select-wrap">
          <select v-model="facultyFilter" class="field-input">
            <option value="">{{ m.grant.allFaculties }}</option>
            <option v-for="f in facultyOptions" :key="f" :value="f">{{ f }}</option>
          </select>
          <svg class="select-arrow" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
        </span>
      </label>

      <label class="field gs-filter-field">
        <span class="field-label">{{ m.grant.colStatus }}</span>
        <span class="select-wrap">
          <select v-model="statusFilter" class="field-input">
            <option value="">{{ m.grant.allStatuses }}</option>
            <option value="active">{{ m.grant.statuses.active }}</option>
            <option value="pending">{{ m.grant.statuses.pending }}</option>
            <option value="inactive">{{ m.grant.statuses.inactive }}</option>
          </select>
          <svg class="select-arrow" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
        </span>
      </label>

      <label class="field gs-filter-field gs-filter-search">
        <span class="field-label">{{ m.grant.searchLabel }}</span>
        <input v-model="searchQuery" type="text" class="field-input" :placeholder="m.grant.searchPlaceholder" />
      </label>

      <button type="button" class="appeal-btn" @click="resetFilters">{{ m.grant.resetFilters }}</button>
      <button type="button" class="appeal-btn primary gs-export-btn" @click="exportToExcel">
        <svg viewBox="0 0 24 24"><path d="M5 20h14v-2H5v2ZM13 4h-2v9.17L7.5 9.67 6.09 11.08 12 17l5.91-5.92L16.5 9.67 13 13.17V4Z" /></svg>
        {{ m.grant.exportExcel }}
      </button>
    </div>

    <p v-if="authStore.isStaff && gsStore.error" class="form-error">{{ gsStore.error }}</p>
    <p v-if="authStore.isStaff && gsStore.loading" class="appeal-empty">{{ m.grant.loading }}</p>

    <div v-if="authStore.isStaff && !gsStore.loading" class="staff-table-wrap gs-table-wrap">
      <table class="staff-table">
        <thead>
          <tr>
            <th>{{ m.grant.colStudentId }}</th>
            <th>{{ m.grant.colFullName }}</th>
            <th>{{ m.grant.colCourse }}</th>
            <th>{{ m.grant.colGroup }}</th>
            <th>{{ m.grant.colFaculty }}</th>
            <th>{{ m.grant.colStatus }}</th>
            <th>{{ m.grant.colPhone }}</th>
            <th>{{ m.grant.colSocialScore }}</th>
            <th>{{ m.grant.colGpa }}</th>
            <th>{{ m.grant.colAcademicPerformance }}</th>
            <th>{{ m.grant.colTotalScore }}</th>
            <th>{{ m.grant.colGpaUpdatedAt }}</th>
            <th>{{ m.grant.colDocument }}</th>
            <th>{{ m.grant.colActions }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in filteredStudents" :key="s.id">
            <td>{{ s.studentHemisId }}</td>
            <td>
              <span class="gs-photo gs-photo-fallback">{{ initials(s.studentName) }}</span>
              {{ s.studentName }}
            </td>
            <td>{{ s.course }}</td>
            <td>{{ s.group }}</td>
            <td>{{ s.faculty }}</td>
            <td>
              <span v-if="editingId !== s.id" class="gs-status-badge" :class="`gs-status-${s.status}`">
                {{ s.statusDisplay || m.grant.statuses[s.status] }}
              </span>
              <span v-else class="select-wrap">
                <select v-model="editForm.status" class="field-input gs-edit-input">
                  <option value="active">{{ m.grant.statuses.active }}</option>
                  <option value="pending">{{ m.grant.statuses.pending }}</option>
                  <option value="inactive">{{ m.grant.statuses.inactive }}</option>
                </select>
              </span>
            </td>
            <td>{{ s.phone }}</td>
            <td>
              <span v-if="editingId !== s.id">{{ s.socialScore }}</span>
              <input v-else v-model="editForm.social_score" type="text" class="gs-edit-input" />
            </td>
            <td>
              <span v-if="editingId !== s.id">{{ s.gpa }}</span>
              <input v-else v-model="editForm.gpa" type="text" class="gs-edit-input" />
            </td>
            <td>
              <span v-if="editingId !== s.id">{{ s.academicScore }}</span>
              <input v-else v-model="editForm.academic_score" type="text" class="gs-edit-input" />
            </td>
            <td>{{ s.totalScore }}</td>
            <td>{{ s.gpaUpdatedAt || '—' }}</td>
            <td>
              <a v-if="s.documentUrl" :href="s.documentUrl" target="_blank" rel="noopener" class="gs-doc-link">
                {{ m.grant.documentView }}
              </a>
              <span v-else>—</span>
            </td>
            <td>
              <div class="gs-row-actions">
                <template v-if="editingId === s.id">
                  <button type="button" class="btn appeal-btn primary" :disabled="editSaving" @click="saveEdit(s.id)">
                    {{ m.grant.saveScore }}
                  </button>
                  <button type="button" class="btn appeal-btn" :disabled="editSaving" @click="cancelEdit">
                    {{ m.grant.cancelEdit }}
                  </button>
                </template>
                <button v-else type="button" class="btn appeal-btn" @click="startEdit(s.id)">
                  {{ m.grant.editScore }}
                </button>
              </div>
              <p v-if="editingId === s.id && editError" class="form-error">{{ editError }}</p>
            </td>
          </tr>
          <tr v-if="!filteredStudents.length">
            <td colspan="14" class="contact-empty">{{ m.grant.noStudents }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </DashboardLayout>
</template>
