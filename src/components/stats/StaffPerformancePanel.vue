<script setup lang="ts">
import { computed, ref } from 'vue'
import { extractApiError } from '@/services/http'
import { useLocaleStore } from '@/stores/locale'
import { useStatisticsStore, type EmployeeResponse, type EmployeeStat } from '@/stores/statistics'
import { formatDateTime } from '@/utils/formatDate'

const statsStore = useStatisticsStore()
const localeStore = useLocaleStore()
const m = computed(() => localeStore.m)
const t = computed(() => m.value.statistics.staffPerf)

const RESPONSE_STATUSES = ['completed', 'rejected', 'in_progress', 'redirected', 'expired'] as const

const selected = ref<EmployeeStat | null>(null)
const responses = ref<EmployeeResponse[]>([])
const responsesCount = ref(0)
const page = ref(1)
const hasNext = ref(false)
const hasPrevious = ref(false)
const statusFilter = ref('')
const responsesLoading = ref(false)
const responsesError = ref('')

async function loadResponses(targetPage = 1) {
  if (!selected.value) return
  responsesLoading.value = true
  responsesError.value = ''
  try {
    const res = await statsStore.fetchEmployeeResponses(selected.value.id, {
      status: statusFilter.value,
      page: targetPage,
    })
    responses.value = res.results
    responsesCount.value = res.count
    hasNext.value = res.hasNext
    hasPrevious.value = res.hasPrevious
    page.value = targetPage
  } catch (err) {
    responses.value = []
    responsesError.value = extractApiError(err, t.value.responsesError)
  } finally {
    responsesLoading.value = false
  }
}

function toggleEmployee(employee: EmployeeStat) {
  if (selected.value?.id === employee.id) {
    selected.value = null
    return
  }
  selected.value = employee
  statusFilter.value = ''
  void loadResponses(1)
}

function fmtHours(h: number | null) {
  return h === null ? '—' : String(Math.round(h * 10) / 10)
}

function fmtPercent(p: number | null) {
  return p === null ? '—' : `${Math.round(p * 10) / 10}%`
}

function fmtRating(avg: number | null, count: number) {
  return avg === null || !count ? '—' : `${avg.toFixed(1)} ★ (${count})`
}

function statusLabel(status: string) {
  return (m.value.appeals.statuses as Record<string, string>)[status] ?? status
}
</script>

<template>
  <article class="panel-v2">
    <h3>
      <svg class="panel-v2-icon" viewBox="0 0 24 24">
        <path d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-8 1a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm0 2c-2.3 0-5 1.2-5 3.5V20h6v-2.5c0-1 .4-1.9 1-2.7A8 8 0 0 0 8 14Zm8 0c-2.7 0-6 1.4-6 4v2h12v-2c0-2.6-3.3-4-6-4Z" />
      </svg>
      {{ t.title }}
    </h3>
    <p class="services-subtitle">{{ t.subtitle }}</p>

    <p v-if="statsStore.employeesError" class="form-error">{{ statsStore.employeesError }}</p>
    <p v-else-if="statsStore.employeesLoading" class="appeal-empty">{{ t.loading }}</p>

    <div v-else class="staff-table-wrap staff-perf-wrap">
      <table class="staff-table staff-perf-table">
        <thead>
          <tr>
            <th>#</th>
            <th>{{ t.colEmployee }}</th>
            <th>{{ t.colAssigned }}</th>
            <th>{{ t.colOpenNow }}</th>
            <th>{{ t.colResponded }}</th>
            <th>{{ t.colCompleted }}</th>
            <th>{{ t.colRejected }}</th>
            <th>{{ t.colOnTimeLate }}</th>
            <th>{{ t.colExpired }}</th>
            <th>{{ t.colSla }}</th>
            <th>{{ t.colAvgResponse }}</th>
            <th>{{ t.colRating }}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <template v-for="(e, idx) in statsStore.employees" :key="e.id">
            <tr :class="{ 'is-selected': selected?.id === e.id }">
              <td>{{ idx + 1 }}</td>
              <td class="staff-perf-name">
                <strong>{{ e.fullName }}</strong>
                <small>{{ [e.roleDisplay, e.departmentName].filter(Boolean).join(' · ') }}</small>
              </td>
              <td>{{ e.assigned }}</td>
              <td>{{ e.openNow }}</td>
              <td><strong>{{ e.responded }}</strong></td>
              <td>{{ e.completed }}</td>
              <td>{{ e.rejected }}</td>
              <td>
                <span class="staff-perf-ok">{{ e.onTime }}</span> / <span class="staff-perf-bad">{{ e.late }}</span>
              </td>
              <td>{{ e.expired }}</td>
              <td>{{ fmtPercent(e.slaPercent) }}</td>
              <td>{{ fmtHours(e.avgResponseHours) }}</td>
              <td>{{ fmtRating(e.avgRating, e.ratingCount) }}</td>
              <td>
                <button type="button" class="btn appeal-btn" @click="toggleEmployee(e)">
                  {{ selected?.id === e.id ? t.hide : t.details }}
                </button>
              </td>
            </tr>

            <tr v-if="selected?.id === e.id" class="staff-perf-detail-row">
              <td colspan="13">
                <div class="staff-perf-detail">
                  <div class="staff-perf-detail-head">
                    <strong>{{ t.responsesTitle }}: {{ e.fullName }} ({{ responsesCount }})</strong>
                    <span class="select-wrap staff-perf-status">
                      <select v-model="statusFilter" class="field-input" @change="loadResponses(1)">
                        <option value="">{{ t.allStatuses }}</option>
                        <option v-for="s in RESPONSE_STATUSES" :key="s" :value="s">{{ statusLabel(s) }}</option>
                      </select>
                      <svg class="select-arrow" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
                    </span>
                  </div>

                  <p v-if="responsesError" class="form-error">{{ responsesError }}</p>
                  <p v-else-if="responsesLoading" class="appeal-empty">{{ t.loading }}</p>
                  <p v-else-if="!responses.length" class="appeal-empty">{{ t.responsesEmpty }}</p>
                  <table v-else class="staff-table staff-perf-responses">
                    <thead>
                      <tr>
                        <th>{{ t.colRequest }}</th>
                        <th>{{ t.colService }}</th>
                        <th>{{ t.colStudent }}</th>
                        <th>{{ t.colStatus }}</th>
                        <th>{{ t.colResponseTime }}</th>
                        <th>{{ t.colDeadline }}</th>
                        <th>{{ t.colRating }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="r in responses" :key="r.requestNumber">
                        <td>{{ r.requestNumber }}</td>
                        <td>{{ r.service }}</td>
                        <td>
                          {{ r.studentName }}
                          <small v-if="r.studentHemisId" class="staff-perf-muted">{{ r.studentHemisId }}</small>
                        </td>
                        <td>{{ statusLabel(r.status) }}</td>
                        <td>{{ fmtHours(r.responseHours) }}</td>
                        <td>
                          <span v-if="r.onTime === true" class="staff-perf-ok">{{ t.onTime }}</span>
                          <span v-else-if="r.onTime === false" class="staff-perf-bad">{{ t.late }}</span>
                          <span v-else>—</span>
                        </td>
                        <td>
                          <template v-if="r.rating">
                            <span :title="r.rating.createdAt ? formatDateTime(r.rating.createdAt, localeStore.locale) : ''">
                              {{ '★'.repeat(r.rating.stars) }}
                            </span>
                            <small v-if="r.rating.comment" class="staff-perf-muted">{{ r.rating.comment }}</small>
                          </template>
                          <span v-else>—</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div v-if="hasNext || hasPrevious" class="audit-pagination">
                    <span class="audit-total">{{ m.auditLog.totalRecords }}: {{ responsesCount }}</span>
                    <div class="audit-pagination-controls">
                      <button type="button" class="appeal-btn" :disabled="!hasPrevious || responsesLoading" @click="loadResponses(page - 1)">
                        {{ m.auditLog.prevPage }}
                      </button>
                      <span class="audit-page-label">{{ m.auditLog.pageLabel }} {{ page }}</span>
                      <button type="button" class="appeal-btn" :disabled="!hasNext || responsesLoading" @click="loadResponses(page + 1)">
                        {{ m.auditLog.nextPage }}
                      </button>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
          <tr v-if="!statsStore.employees.length">
            <td colspan="13" class="contact-empty">{{ t.empty }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </article>
</template>
