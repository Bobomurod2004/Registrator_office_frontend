<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import { useLocaleStore } from '@/stores/locale'
import { useAuditStore, type AuditAction } from '@/stores/audit'

const localeStore = useLocaleStore()
const m = computed(() => localeStore.m)
const auditStore = useAuditStore()

const ACTIONS: AuditAction[] = [
  'login',
  'logout',
  'login_failed',
  'request_create',
  'request_status_change',
  'request_assign',
  'document_download',
  'document_upload',
  'user_create',
  'user_update',
  'user_delete',
  'settings_change',
  'grant_update',
]

const actionFilter = ref('')
const searchQuery = ref('')

function actionLabel(action: AuditAction) {
  return (m.value.auditLog.actions as Record<string, string>)[action] ?? action
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(localeStore.locale === 'RU' ? 'ru-RU' : 'en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function load(page = 1) {
  auditStore.fetchLogs({ action: actionFilter.value, search: searchQuery.value, page })
}

function resetFilters() {
  actionFilter.value = ''
  searchQuery.value = ''
  load(1)
}

function goPrev() {
  if (auditStore.hasPrevious) load(auditStore.page - 1)
}

function goNext() {
  if (auditStore.hasNext) load(auditStore.page + 1)
}

onMounted(() => load(1))
</script>

<template>
  <DashboardLayout>
    <h1>{{ m.auditLog.title }}</h1>
    <p class="services-subtitle">{{ m.auditLog.subtitle }}</p>

    <div class="gs-filters">
      <label class="field gs-filter-field">
        <span class="field-label">{{ m.auditLog.actionLabel }}</span>
        <span class="select-wrap">
          <select v-model="actionFilter" class="field-input" @change="load(1)">
            <option value="">{{ m.auditLog.allActions }}</option>
            <option v-for="a in ACTIONS" :key="a" :value="a">{{ actionLabel(a) }}</option>
          </select>
          <svg class="select-arrow" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
        </span>
      </label>

      <label class="field gs-filter-field gs-filter-search">
        <span class="field-label">{{ m.auditLog.searchLabel }}</span>
        <input
          v-model="searchQuery"
          type="text"
          class="field-input"
          :placeholder="m.auditLog.searchPlaceholder"
          @keyup.enter="load(1)"
        />
      </label>

      <button type="button" class="submit-btn" @click="load(1)">{{ m.auditLog.searchLabel }}</button>
      <button type="button" class="appeal-btn" @click="resetFilters">{{ m.auditLog.resetFilters }}</button>
    </div>

    <p v-if="auditStore.error" class="form-error">{{ auditStore.error }}</p>

    <div class="staff-table-wrap">
      <table class="staff-table">
        <thead>
          <tr>
            <th>{{ m.auditLog.colTime }}</th>
            <th>{{ m.auditLog.colUser }}</th>
            <th>{{ m.auditLog.colAction }}</th>
            <th>{{ m.auditLog.colEntity }}</th>
            <th>{{ m.auditLog.colEntityId }}</th>
            <th>{{ m.auditLog.colIp }}</th>
            <th>{{ m.auditLog.colDevice }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in auditStore.entries" :key="entry.id">
            <td>{{ formatTime(entry.created_at) }}</td>
            <td>{{ entry.user_name || '—' }}</td>
            <td>{{ entry.action_display || actionLabel(entry.action) }}</td>
            <td>{{ entry.entity || '—' }}</td>
            <td>{{ entry.entity_id ?? '—' }}</td>
            <td>{{ entry.ip_address || '—' }}</td>
            <td>{{ entry.user_agent || '—' }}</td>
          </tr>
          <tr v-if="!auditStore.loading && !auditStore.entries.length && !auditStore.error">
            <td colspan="7" class="contact-empty">{{ m.auditLog.empty }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="audit-pagination">
      <span class="audit-total">{{ m.auditLog.totalRecords }}: {{ auditStore.count }}</span>
      <div class="audit-pagination-controls">
        <button type="button" class="appeal-btn" :disabled="!auditStore.hasPrevious" @click="goPrev">
          {{ m.auditLog.prevPage }}
        </button>
        <span class="audit-page-label">{{ m.auditLog.pageLabel }} {{ auditStore.page }}</span>
        <button type="button" class="appeal-btn" :disabled="!auditStore.hasNext" @click="goNext">
          {{ m.auditLog.nextPage }}
        </button>
      </div>
    </div>
  </DashboardLayout>
</template>
