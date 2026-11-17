<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/DashboardLayout.vue'
import LeadershipAppealDetail from '@/components/leadership/LeadershipAppealDetail.vue'
import LeadershipRecipientsPanel from '@/components/leadership/LeadershipRecipientsPanel.vue'
import LeadershipStatsPanel from '@/components/leadership/LeadershipStatsPanel.vue'
import PersonSearchDrawer from '@/components/PersonSearchDrawer.vue'
import { useAuthStore } from '@/stores/auth'
import { useLocaleStore } from '@/stores/locale'
import {
  APPEAL_STATUSES,
  APPLICANT_TYPES,
  useLeadershipAppealsStore,
  type AppealFilters,
  type AppealListItem,
} from '@/stores/leadershipAppeals'
import { extractApiError } from '@/services/http'
import { formatDateTime } from '@/utils/formatDate'
import '@/styles/leadership-split.css'

/**
 * Rahbariyatga murojaatlar sahifasi. Chapda ro'yxat, o'ngda tanlangan murojaat.
 * Kimga ko'rinishi backend'da hisoblanadi: mas'ul xodim o'z rahbarlarining
 * murojaatlarini, SuperAdmin hammasini ko'radi. Route ruxsat bilan himoyalangan.
 */
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const localeStore = useLocaleStore()
const store = useLeadershipAppealsStore()
const m = computed(() => localeStore.m.leadership)

type Tab = 'appeals' | 'stats' | 'recipients'
const canManage = computed(() => authStore.can('manage_appeal_recipients'))
const tabs = computed<{ key: Tab; label: string }[]>(() => {
  const list: { key: Tab; label: string }[] = [
    { key: 'appeals', label: m.value.tabAppeals },
    { key: 'stats', label: m.value.tabStats },
  ]
  if (canManage.value) list.push({ key: 'recipients', label: m.value.tabRecipients })
  return list
})
const tab = ref<Tab>('appeals')
const showPersonSearch = ref(false)

const filters = reactive<AppealFilters>({
  status: '',
  applicantType: '',
  recipient: null,
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
    await store.fetchAppeals({ ...filters }, target)
    page.value = target
  } catch (err) {
    listError.value = extractApiError(err, m.value.loadError)
  } finally {
    listLoading.value = false
  }
}

// Tanlangan murojaat `?appeal=<id>` bilan sinxronlanadi (bildirishnoma va havola uchun).
// Tafsilot faqat foydalanuvchi aniq tanlaganda yuklanadi (har yuklash audit yozadi).
const openId = ref<number | null>(Number(route.query.appeal) || null)

function setOpen(id: number | null) {
  openId.value = id
  const query = { ...route.query }
  if (id) query.appeal = String(id)
  else delete query.appeal
  void router.replace({ query })
}

function select(item: AppealListItem) {
  if (openId.value !== item.id) setOpen(item.id)
}

watch(
  () => route.query.appeal,
  (value) => {
    const id = Number(value) || null
    if (!id) return
    tab.value = 'appeals'
    if (id !== openId.value) openId.value = id
  },
)

watch(
  () => [filters.status, filters.applicantType, filters.recipient, filters.assignedToMe],
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

function statusLabel(status: string, fallback: string): string {
  return (m.value.statuses as Record<string, string>)[status] ?? fallback
}

function applicantLabel(item: AppealListItem): string {
  if (item.applicantDisplay) return item.applicantDisplay
  if (item.isAnonymous) return m.value.anonymous
  return (m.value.applicantTypes as Record<string, string>)[item.applicantType] ?? item.applicantType
}

function formatDate(iso: string): string {
  return iso ? formatDateTime(iso, localeStore.locale) : '—'
}

onMounted(async () => {
  // Mas'ul/SuperAdmin uchun rahbarlar ro'yxati filtr va biriktirish uchun kerak.
  // 403 bo'lsa (oddiy mas'ul) jim o'tiladi — biriktirish tugmasi yashiriladi.
  await Promise.allSettled([
    loadList(1),
    store.fetchStats(),
    store.fetchRecipients(),
  ])
})
</script>

<template>
  <DashboardLayout>
    <div class="info-header-row">
      <div>
        <h1 class="info-page-title">{{ m.title }}</h1>
        <p class="services-subtitle">{{ m.subtitle }}</p>
      </div>
      <button type="button" class="appeal-btn person-search-open" @click="showPersonSearch = true">
        {{ localeStore.m.person.openBtn }}
      </button>
    </div>

    <PersonSearchDrawer :open="showPersonSearch" @close="showPersonSearch = false" />

    <div class="services-tabs">
      <button
        v-for="t in tabs"
        :key="t.key"
        class="btn service-tab-btn"
        :class="{ active: tab === t.key }"
        @click="tab = t.key"
      >
        {{ t.label }}
      </button>
    </div>

    <template v-if="tab === 'appeals'">
      <div class="appeal-form lap-filters">
        <label class="field">
          <span class="field-label">{{ m.filterStatus }}</span>
          <select v-model="filters.status" class="field-input">
            <option value="">{{ m.allStatuses }}</option>
            <option v-for="s in APPEAL_STATUSES" :key="s" :value="s">{{ m.statuses[s] }}</option>
          </select>
        </label>
        <label class="field">
          <span class="field-label">{{ m.filterApplicant }}</span>
          <select v-model="filters.applicantType" class="field-input">
            <option value="">{{ m.allApplicants }}</option>
            <option v-for="t in APPLICANT_TYPES" :key="t" :value="t">{{ m.applicantTypes[t] }}</option>
          </select>
        </label>
        <label v-if="store.stats && store.stats.byRecipient.length > 1" class="field">
          <span class="field-label">{{ m.filterRecipient }}</span>
          <select v-model="filters.recipient" class="field-input">
            <option :value="null">{{ m.allRecipients }}</option>
            <option v-for="r in store.stats.byRecipient" :key="r.recipient" :value="r.recipient">{{ r.label }}</option>
          </select>
        </label>
        <label class="field lap-search">
          <span class="field-label">{{ m.searchPlaceholder }}</span>
          <input v-model="filters.search" type="search" class="field-input" :placeholder="m.searchPlaceholder" />
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
                <span class="lap-status" :class="`is-${item.status}`">{{ statusLabel(item.status, item.statusDisplay) }}</span>
              </span>
              <span class="lap-list-title">{{ item.subject || '—' }}</span>
              <span class="lap-list-meta">
                {{ applicantLabel(item) }} · {{ formatDate(item.createdAt) }}
                <span v-if="item.attachmentsCount" class="lap-list-files" :title="m.attachments">
                  📎 {{ item.attachmentsCount }}
                </span>
              </span>
              <span class="lap-list-meta">
                {{ item.recipientName }}<template v-if="item.recipientPosition"> · {{ item.recipientPosition }}</template>
              </span>
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
        </section>

        <section class="lap-pane lap-pane-detail">
          <p v-if="openId === null" class="lap-empty-pane">{{ m.selectPrompt }}</p>
          <LeadershipAppealDetail
            v-else
            :key="openId"
            :appeal-id="openId"
            :recipients="store.recipients"
            @search-person="showPersonSearch = true"
          />
        </section>
      </div>
    </template>

    <LeadershipStatsPanel v-else-if="tab === 'stats'" />

    <LeadershipRecipientsPanel v-else-if="tab === 'recipients' && canManage" />
  </DashboardLayout>
</template>
