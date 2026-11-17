<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/DashboardLayout.vue'
import CorruptionReportDetail from '@/components/corruption/CorruptionReportDetail.vue'
import CorruptionStatsPanel from '@/components/corruption/CorruptionStatsPanel.vue'
import { useLocaleStore } from '@/stores/locale'
import {
  ANONYMITY_MODES,
  CLOSED_STATUSES,
  REPORT_CATEGORIES,
  REPORT_STATUSES,
  useCorruptionReportsStore,
  type ReportFilters,
  type ReportListItem,
  type ReportStatus,
} from '@/stores/corruptionReports'
import { extractApiError } from '@/services/http'
import { formatDateTime } from '@/utils/formatDate'
import '@/styles/leadership-split.css'
import '@/styles/corruption.css'

/**
 * Korrupsiya haqidagi xabarlar. Chapda ro'yxat (mazmunsiz), o'ngda tanlangan xabar.
 * Route `handle_corruption_reports` ruxsati bilan himoyalangan.
 */
const route = useRoute()
const router = useRouter()
const localeStore = useLocaleStore()
const store = useCorruptionReportsStore()
const m = computed(() => localeStore.m.corruption)

type Tab = 'reports' | 'stats'
const tab = ref<Tab>('reports')

const filters = reactive<ReportFilters>({
  status: '',
  category: '',
  anonymityMode: '',
  assignedToMe: false,
  search: '',
})

const page = ref(1)
const listLoading = ref(false)
const listError = ref('')

async function loadList(target = 1) {
  listLoading.value = true
  listError.value = ''
  try {
    await store.fetchReports({ ...filters }, target)
    page.value = target
  } catch (err) {
    listError.value = extractApiError(err, m.value.loadError)
  } finally {
    listLoading.value = false
  }
}

// Tanlangan xabar `?report=<id>` bilan sinxronlanadi (bildirishnoma va havola uchun).
const openId = ref<number | null>(Number(route.query.report) || null)

function setOpen(id: number | null) {
  openId.value = id
  const query = { ...route.query }
  if (id) query.report = String(id)
  else delete query.report
  void router.replace({ query })
}

function select(item: ReportListItem) {
  if (openId.value !== item.id) setOpen(item.id)
}

watch(
  () => route.query.report,
  (value) => {
    const id = Number(value) || null
    if (!id) return
    tab.value = 'reports'
    if (id !== openId.value) openId.value = id
  },
)

watch(
  () => [filters.status, filters.category, filters.anonymityMode, filters.assignedToMe],
  () => void loadList(1),
)

let searchTimer: number | undefined
watch(
  () => filters.search,
  () => {
    window.clearTimeout(searchTimer)
    searchTimer = window.setTimeout(() => void loadList(1), 400)
  },
)

function statusLabel(value: string, fallback: string): string {
  return (m.value.statuses as Record<string, string>)[value] ?? fallback
}

function categoryLabel(value: string, fallback: string): string {
  return (m.value.categories as Record<string, string>)[value] ?? fallback
}

function anonymityLabel(value: string, fallback: string): string {
  return (m.value.anonymity as Record<string, string>)[value] ?? fallback
}

function formatDate(iso: string): string {
  return iso ? formatDateTime(iso, localeStore.locale) : '—'
}

/** Yuqoridagi 4 ta hisob — butun bo'lim bo'yicha (`/stats/`), joriy sahifa bo'yicha emas. */
const summary = computed(() => {
  const by = new Map((store.stats?.byStatus ?? []).map((s) => [s.status, s.count]))
  const get = (s: ReportStatus) => by.get(s) ?? 0
  return [
    { key: 'new', label: m.value.summaryNew, count: get('new') },
    { key: 'under_review', label: m.value.summaryReview, count: get('under_review') },
    { key: 'investigating', label: m.value.summaryInvestigating, count: get('investigating') },
    { key: 'closed', label: m.value.summaryClosed, count: CLOSED_STATUSES.reduce((sum, s) => sum + get(s), 0) },
  ]
})

onMounted(async () => {
  await Promise.allSettled([loadList(1), store.fetchStats()])
})
</script>

<template>
  <DashboardLayout>
    <div class="info-header-row">
      <div>
        <h1 class="info-page-title">{{ m.title }}</h1>
        <p class="services-subtitle">{{ m.subtitle }}</p>
      </div>
    </div>

    <div class="services-tabs">
      <button class="btn service-tab-btn" :class="{ active: tab === 'reports' }" @click="tab = 'reports'">
        {{ m.tabReports }}
      </button>
      <button class="btn service-tab-btn" :class="{ active: tab === 'stats' }" @click="tab = 'stats'">
        {{ m.tabStats }}
      </button>
    </div>

    <template v-if="tab === 'reports'">
      <div v-if="store.stats" class="cr-summary">
        <div v-for="s in summary" :key="s.key" class="cr-summary-card" :class="`is-${s.key}`">
          <span class="cr-summary-dot" aria-hidden="true" />
          <span class="cr-summary-text">
            <span>{{ s.label }}</span>
            <strong>{{ s.count }}</strong>
          </span>
        </div>
      </div>

      <div class="appeal-form lap-filters">
        <label class="field lap-search">
          <span class="field-label">{{ m.searchLabel }}</span>
          <input v-model="filters.search" type="search" class="field-input" :placeholder="m.searchPlaceholder" />
        </label>
        <label class="field">
          <span class="field-label">{{ m.filterStatus }}</span>
          <select v-model="filters.status" class="field-input">
            <option value="">{{ m.allStatuses }}</option>
            <option v-for="s in REPORT_STATUSES" :key="s" :value="s">{{ m.statuses[s] }}</option>
          </select>
        </label>
        <label class="field">
          <span class="field-label">{{ m.filterCategory }}</span>
          <select v-model="filters.category" class="field-input">
            <option value="">{{ m.allCategories }}</option>
            <option v-for="c in REPORT_CATEGORIES" :key="c" :value="c">{{ m.categories[c] }}</option>
          </select>
        </label>
        <label class="field">
          <span class="field-label">{{ m.filterAnonymity }}</span>
          <select v-model="filters.anonymityMode" class="field-input">
            <option value="">{{ m.allAnonymity }}</option>
            <option v-for="a in ANONYMITY_MODES" :key="a" :value="a">{{ m.anonymity[a] }}</option>
          </select>
        </label>
        <label class="lap-check">
          <input v-model="filters.assignedToMe" type="checkbox" />
          {{ m.assignedToMe }}
        </label>
      </div>

      <div class="lap-split">
        <section class="lap-pane lap-pane-list">
          <p v-if="listLoading" class="appeal-empty">{{ m.loading }}</p>
          <p v-else-if="listError" class="form-error">{{ listError }}</p>
          <p v-else-if="!store.items.length" class="appeal-empty">{{ m.empty }}</p>

          <div v-else class="lap-list">
            <button
              v-for="item in store.items"
              :key="item.id"
              type="button"
              class="lap-list-item"
              :class="{ 'is-selected': openId === item.id }"
              :aria-current="openId === item.id ? 'true' : undefined"
              @click="select(item)"
            >
              <span class="lap-list-top">
                <span class="lap-code">{{ item.trackingCode }}</span>
                <span class="cr-status" :class="`is-${item.status}`">{{ statusLabel(item.status, item.statusDisplay) }}</span>
              </span>
              <span class="lap-list-title">{{ categoryLabel(item.category, item.categoryDisplay) }}</span>
              <span class="lap-list-meta">
                <span class="cr-anon-tag" :class="`is-${item.anonymityMode}`">
                  {{ anonymityLabel(item.anonymityMode, item.anonymityModeDisplay) }}
                </span>
                · {{ formatDate(item.createdAt) }}
                <span v-if="item.attachmentsCount" class="lap-list-files" :title="localeStore.m.leadership.attachments">
                  📎 {{ item.attachmentsCount }}
                </span>
              </span>
              <span v-if="item.assignedToName" class="lap-list-meta">{{ m.assignedTo }}: {{ item.assignedToName }}</span>
            </button>
          </div>

          <div v-if="store.items.length || page > 1" class="audit-pagination">
            <span class="audit-total">{{ m.pageLabel }} {{ page }}</span>
            <div class="audit-pagination-controls">
              <button type="button" class="appeal-btn" :disabled="page <= 1 || listLoading" @click="loadList(page - 1)">
                {{ m.prevPage }}
              </button>
              <button type="button" class="appeal-btn" :disabled="!store.hasNext || listLoading" @click="loadList(page + 1)">
                {{ m.nextPage }}
              </button>
            </div>
          </div>
          <p class="cr-list-note">{{ m.listPrivacyNote }}</p>
        </section>

        <section class="lap-pane lap-pane-detail">
          <p v-if="openId === null" class="lap-empty-pane">{{ m.selectPrompt }}</p>
          <CorruptionReportDetail v-else :key="openId" :report-id="openId" />
        </section>
      </div>
    </template>

    <CorruptionStatsPanel v-else />
  </DashboardLayout>
</template>
