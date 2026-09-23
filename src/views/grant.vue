<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import * as XLSX from 'xlsx'
import DashboardLayout from '@/components/DashboardLayout.vue'
import { extractApiError } from '@/services/http'
import { useAuthStore } from '@/stores/auth'
import { useLocaleStore } from '@/stores/locale'
import { useGrantStudentsStore, type Faculty, type GrantOrdering, type GrantStatus } from '@/stores/grantStudents'

const authStore = useAuthStore()
const localeStore = useLocaleStore()
const m = computed(() => localeStore.m)
const gsStore = useGrantStudentsStore()

onMounted(() => {
  if (authStore.isStaff) {
    gsStore.fetchFaculties()
    load(1)
  }
})

function facultyLabel(f: Faculty) {
  if (localeStore.locale === 'RU') return f.name_ru || f.name_uz
  if (localeStore.locale === 'EN') return f.name_en || f.name_uz
  return f.name_uz
}

/* ---------- Grant oluvchi talabalar ro'yxati (server-taraf pagination/qidiruv/filtr) ---------- */

const departmentFilter = ref<number | ''>('')
const statusFilter = ref<'' | GrantStatus>('active')
const orderingFilter = ref<GrantOrdering>('')
const searchQuery = ref('')

function currentFilters() {
  return {
    status: statusFilter.value,
    search: searchQuery.value.trim() || undefined,
    ordering: orderingFilter.value || undefined,
    department: departmentFilter.value || undefined,
  }
}

function load(page = 1) {
  gsStore.fetchAll({ ...currentFilters(), page })
}

let searchTimer: number | undefined
function onSearchInput() {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => load(1), 400)
}
onBeforeUnmount(() => window.clearTimeout(searchTimer))

function resetFilters() {
  departmentFilter.value = ''
  statusFilter.value = 'active'
  orderingFilter.value = ''
  searchQuery.value = ''
  load(1)
}

function goPrev() {
  if (gsStore.hasPrevious) load(gsStore.page - 1)
}

function goNext() {
  if (gsStore.hasNext) load(gsStore.page + 1)
}

function initials(name: string) {
  return name.trim().charAt(0).toUpperCase() || '?'
}

function formatGpa(gpa: string) {
  return Number(gpa) > 0 ? gpa : m.value.grant.colGpaNotAvailable
}

const exporting = ref(false)
const exportError = ref('')

async function exportToExcel() {
  exporting.value = true
  exportError.value = ''
  try {
    const all = await gsStore.fetchAllForExport(currentFilters())
    const rows = all.map((s) => ({
      [m.value.grant.colStudentId]: s.studentHemisId,
      [m.value.grant.colFullName]: s.studentName,
      [m.value.grant.colCourse]: s.course,
      [m.value.grant.colGroup]: s.group,
      [m.value.grant.colFaculty]: s.faculty,
      [m.value.grant.colStatus]: s.statusDisplay,
      [m.value.grant.colPhone]: s.phone || '—',
      [m.value.grant.colSocialScore]: s.socialScore,
      [m.value.grant.colGpa]: formatGpa(s.gpa),
      [m.value.grant.colAcademicPerformance]: s.academicScore,
      [m.value.grant.colTotalScore]: s.totalScore,
      [m.value.grant.colGpaUpdatedAt]: s.gpaUpdatedAt ?? '',
    }))
    const sheet = XLSX.utils.json_to_sheet(rows)
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, 'Grant talabalari')
    XLSX.writeFile(book, 'grant-talabalari.xlsx')
  } catch (err) {
    exportError.value = extractApiError(err, m.value.grant.loadError)
  } finally {
    exporting.value = false
  }
}

/* ---------- Xodim: grant ballini tahrirlash (GPA faqat o'qish uchun) ---------- */

const editingId = ref<number | null>(null)
const editForm = ref({ social_score: '', academic_score: '', status: 'active' as GrantStatus })
const editSaving = ref(false)
const editError = ref('')

function startEdit(id: number) {
  const s = gsStore.students.find((x) => x.id === id)
  if (!s) return
  editingId.value = id
  editForm.value = { social_score: s.socialScore, academic_score: s.academicScore, status: s.status }
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

/* ---------- HEMIS bilan sinxronlash (faqat admin) — sahifalab, progress bilan ---------- */

const syncError = ref('')
const syncedMsg = ref(false)
const syncStoppedMsg = ref(false)

async function syncHemisGrants(startPage = 1) {
  syncError.value = ''
  syncedMsg.value = false
  syncStoppedMsg.value = false
  try {
    await gsStore.syncFromHemis(startPage)
    if (gsStore.syncStopRequested) {
      syncStoppedMsg.value = true
    } else if (gsStore.syncFailedPage === null) {
      syncedMsg.value = true
      window.setTimeout(() => (syncedMsg.value = false), 4000)
    }
  } catch (err) {
    const apiMsg = extractApiError(err, '')
    syncError.value = apiMsg || (err instanceof Error ? err.message : m.value.grant.hemisSyncError)
  }
}

function stopHemisSync() {
  gsStore.stopSync()
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
        v-if="authStore.isAdmin && !gsStore.syncing"
        type="button"
        class="appeal-btn"
        @click="syncHemisGrants(gsStore.syncFailedPage ?? 1)"
      >
        {{ gsStore.syncFailedPage ? m.grant.hemisSyncResume : m.grant.hemisSync }}
      </button>
    </div>

    <div v-if="authStore.isAdmin && gsStore.syncing" class="gs-sync-progress">
      <div class="gs-sync-progress-head">
        <span class="spinner-border spinner-border-sm" />
        <span>{{ m.grant.hemisSyncing }}</span>
        <span v-if="gsStore.syncTotalPages" class="gs-sync-page">
          {{ gsStore.syncPage }} / {{ gsStore.syncTotalPages }} {{ m.grant.syncPageProgress }}
        </span>
        <button type="button" class="appeal-btn gs-sync-stop" @click="stopHemisSync">
          {{ m.grant.hemisSyncStop }}
        </button>
      </div>
      <div v-if="gsStore.syncTotalPages" class="progress-track sm">
        <div
          class="progress-fill"
          :style="{ width: `${Math.min(100, (gsStore.syncPage / gsStore.syncTotalPages) * 100)}%` }"
        />
      </div>
      <div class="gs-sync-totals">
        <span>{{ m.grant.syncCreated }}: {{ gsStore.syncTotals.created }}</span>
        <span>{{ m.grant.syncUpdated }}: {{ gsStore.syncTotals.updated }}</span>
        <span>{{ m.grant.syncSkipped }}: {{ gsStore.syncTotals.skipped }}</span>
        <span v-if="gsStore.syncTotals.errors">{{ m.grant.syncErrors }}: {{ gsStore.syncTotals.errors }}</span>
        <span>{{ m.grant.syncDeactivated }}: {{ gsStore.syncTotals.deactivated }}</span>
        <span v-if="gsStore.syncTotalCount">{{ m.grant.syncTotalCount }}: {{ gsStore.syncTotalCount }}</span>
      </div>
    </div>

    <p v-if="authStore.isAdmin && syncedMsg" class="form-success">{{ m.grant.hemisSynced }}</p>
    <p v-if="authStore.isAdmin && syncStoppedMsg && !gsStore.syncing" class="form-error">{{ m.grant.hemisSyncStopped }}</p>
    <p v-if="authStore.isAdmin && syncError" class="form-error">{{ syncError }}</p>

    <div v-if="authStore.isStaff" class="gs-filters">
      <label class="field gs-filter-field">
        <span class="field-label">{{ m.grant.colFaculty }}</span>
        <span class="select-wrap">
          <select v-model="departmentFilter" class="field-input" @change="load(1)">
            <option value="">{{ m.grant.allFaculties }}</option>
            <option v-for="f in gsStore.faculties" :key="f.id" :value="f.id">
              {{ facultyLabel(f) }}
            </option>
          </select>
          <svg class="select-arrow" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
        </span>
      </label>

      <label class="field gs-filter-field">
        <span class="field-label">{{ m.grant.colStatus }}</span>
        <span class="select-wrap">
          <select v-model="statusFilter" class="field-input" @change="load(1)">
            <option value="">{{ m.grant.allStatuses }}</option>
            <option value="active">{{ m.grant.statuses.active }}</option>
            <option value="pending">{{ m.grant.statuses.pending }}</option>
            <option value="inactive">{{ m.grant.statuses.inactive }}</option>
          </select>
          <svg class="select-arrow" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
        </span>
      </label>

      <label class="field gs-filter-field">
        <span class="field-label">{{ m.grant.orderingLabel }}</span>
        <span class="select-wrap">
          <select v-model="orderingFilter" class="field-input" @change="load(1)">
            <option value="">{{ m.grant.orderingDefault }}</option>
            <option value="-total_score">{{ m.grant.orderingScoreDesc }}</option>
            <option value="total_score">{{ m.grant.orderingScoreAsc }}</option>
            <option value="-gpa">{{ m.grant.orderingGpaDesc }}</option>
            <option value="gpa">{{ m.grant.orderingGpaAsc }}</option>
            <option value="-updated_at">{{ m.grant.orderingUpdatedDesc }}</option>
            <option value="updated_at">{{ m.grant.orderingUpdatedAsc }}</option>
          </select>
          <svg class="select-arrow" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
        </span>
      </label>

      <label class="field gs-filter-field gs-filter-search">
        <span class="field-label">{{ m.grant.searchLabel }}</span>
        <input
          v-model="searchQuery"
          type="text"
          class="field-input"
          :placeholder="m.grant.searchPlaceholder"
          @input="onSearchInput"
        />
      </label>

      <button type="button" class="appeal-btn" @click="resetFilters">{{ m.grant.resetFilters }}</button>
      <button type="button" class="appeal-btn primary gs-export-btn" :disabled="exporting" @click="exportToExcel">
        <span v-if="exporting" class="spinner-border spinner-border-sm" />
        <svg v-else viewBox="0 0 24 24"><path d="M5 20h14v-2H5v2ZM13 4h-2v9.17L7.5 9.67 6.09 11.08 12 17l5.91-5.92L16.5 9.67 13 13.17V4Z" /></svg>
        {{ exporting ? m.grant.exporting : m.grant.exportExcel }}
      </button>
    </div>
    <p v-if="exportError" class="form-error">{{ exportError }}</p>

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
          <tr v-for="s in gsStore.students" :key="s.id">
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
            <td>{{ s.phone || '—' }}</td>
            <td>
              <span v-if="editingId !== s.id">{{ s.socialScore }}</span>
              <input v-else v-model="editForm.social_score" type="text" class="gs-edit-input" />
            </td>
            <td :title="editingId === s.id ? m.grant.gpaReadOnlyHint : undefined">{{ formatGpa(s.gpa) }}</td>
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
          <tr v-if="!gsStore.students.length">
            <td colspan="14" class="contact-empty">{{ m.grant.noStudents }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="authStore.isStaff && !gsStore.loading" class="audit-pagination">
      <span class="audit-total">{{ m.auditLog.totalRecords }}: {{ gsStore.count }}</span>
      <div class="audit-pagination-controls">
        <button type="button" class="appeal-btn" :disabled="!gsStore.hasPrevious" @click="goPrev">
          {{ m.auditLog.prevPage }}
        </button>
        <span class="audit-page-label">{{ m.auditLog.pageLabel }} {{ gsStore.page }}</span>
        <button type="button" class="appeal-btn" :disabled="!gsStore.hasNext" @click="goNext">
          {{ m.auditLog.nextPage }}
        </button>
      </div>
    </div>
  </DashboardLayout>
</template>
