<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLocaleStore } from '@/stores/locale'
import { useNotificationsStore, type AppNotification } from '@/stores/notifications'
import type { Locale } from '@/i18n/messages'
import FlagIcon from '@/components/FlagIcon.vue'
import AppLogo from '@/components/AppLogo.vue'
import { toggleMobileMenu } from '@/composables/mobileNav'
import { lookupStudentByHemisId, type HemisStudentInfo } from '@/services/hemisLookup'
import { formatDateTime } from '@/utils/formatDate'

type ThemeMode = 'light' | 'dark' | 'system'

const THEME_KEY = 'r-office-theme-mode'

const themeMode = ref<ThemeMode>((localStorage.getItem(THEME_KEY) as ThemeMode) || 'system')
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const localeStore = useLocaleStore()
const notificationsStore = useNotificationsStore()
const m = computed(() => localeStore.m)
const showSearch = computed(() => route.name !== 'login' && authStore.isStaff)

/* Xodim istalgan talabani HEMIS ID bo'yicha qidirishi mumkin (GET /api/v1/hemis/student/{hemis_id}/). */
const searchQuery = ref('')
const searchLoading = ref(false)
const searchError = ref('')
const searchResult = ref<HemisStudentInfo | null>(null)
const isSearchOpen = ref(false)

async function runStudentSearch() {
  const hemisId = searchQuery.value.trim()
  if (!hemisId) return

  searchLoading.value = true
  searchError.value = ''
  searchResult.value = null
  isSearchOpen.value = true

  try {
    searchResult.value = await lookupStudentByHemisId(hemisId)
  } catch {
    searchError.value = m.value.header.searchNotFound
  } finally {
    searchLoading.value = false
  }
}

const roleLabel = computed(() => {
  if (!authStore.session) return ''
  return authStore.isStaff ? m.value.roles.staff : m.value.roles.student
})

function handleLogout() {
  authStore.logout()
  void router.replace({ name: 'login' })
}
const isThemeOpen = ref(false)
const isLanguageOpen = ref(false)
const isNotifOpen = ref(false)

function formatNotifDate(iso: string) {
  return formatDateTime(iso, localeStore.locale)
}

function toggleNotifDropdown() {
  isNotifOpen.value = !isNotifOpen.value
  isThemeOpen.value = false
  isLanguageOpen.value = false
  if (isNotifOpen.value) notificationsStore.fetchNotifications()
}

async function openNotification(item: AppNotification) {
  isNotifOpen.value = false
  if (!item.is_read) await notificationsStore.markRead(item.id)
  if (item.request) void router.push({ name: 'appeals', query: { request: String(item.request) } })
}

function markAllNotificationsRead() {
  void notificationsStore.markAllRead()
}

const themeOptions = computed<Array<{ key: ThemeMode; label: string; icon: string }>>(() => [
  { key: 'light', label: m.value.header.theme.light, icon: 'light' },
  { key: 'dark', label: m.value.header.theme.dark, icon: 'dark' },
  { key: 'system', label: m.value.header.theme.system, icon: 'system' },
])

const themeLabel = computed(() => m.value.header.theme[themeMode.value])

const languageOptions: Array<{ key: Locale; icon: 'uz' | 'ru' | 'en' }> = [
  { key: 'UZ', icon: 'uz' },
  { key: 'UZ_CYRL', icon: 'uz' },
  { key: 'EN', icon: 'en' },
  { key: 'RU', icon: 'ru' },
]

const LOCALE_SHORT_LABEL: Record<Locale, string> = {
  UZ: 'UZ',
  UZ_CYRL: 'ЎЗ',
  RU: 'RU',
  EN: 'EN',
}

const currentFlagCode = computed<'uz' | 'ru' | 'en'>(() => {
  if (localeStore.locale === 'RU') return 'ru'
  if (localeStore.locale === 'EN') return 'en'
  return 'uz'
})

function selectLanguage(value: Locale) {
  localeStore.setLocale(value)
  isLanguageOpen.value = false
}

function applyTheme() {
  const resolvedTheme =
    themeMode.value === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : themeMode.value
  document.documentElement.setAttribute('data-theme', resolvedTheme)
}

function handleSystemThemeChange() {
  if (themeMode.value === 'system') applyTheme()
}

function closeDropdowns() {
  isThemeOpen.value = false
  isLanguageOpen.value = false
  isSearchOpen.value = false
  isNotifOpen.value = false
}

function toggleThemeDropdown() {
  isThemeOpen.value = !isThemeOpen.value
  isLanguageOpen.value = false
  isNotifOpen.value = false
}

function toggleLanguageDropdown() {
  isLanguageOpen.value = !isLanguageOpen.value
  isThemeOpen.value = false
  isNotifOpen.value = false
}

function selectTheme(value: ThemeMode) {
  themeMode.value = value
  isThemeOpen.value = false
}

watch(themeMode, (value) => {
  localStorage.setItem(THEME_KEY, value)
  applyTheme()
})

/** Sessiya ochilganda (login/HEMIS OAuth'dan keyin yoki sahifa yuklanganda,
 *  agar allaqachon kirilgan bo'lsa) o'qilmagan bildirishnomalar sonini darhol
 *  yuklaydi. Har 60 soniyada qayta so'raladi — foydalanuvchi bildirishnoma
 *  paneli ochiq/yopiqligidan qat'i nazar, badge yangilanib turadi. */
let notifTimer: number | undefined

watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) notificationsStore.fetchUnreadCount()
  },
  { immediate: true },
)

onMounted(() => {
  applyTheme()
  mediaQuery.addEventListener('change', handleSystemThemeChange)
  window.addEventListener('click', closeDropdowns)
  notifTimer = window.setInterval(() => {
    if (authStore.isAuthenticated) notificationsStore.fetchUnreadCount()
  }, 60000)
})

onBeforeUnmount(() => {
  mediaQuery.removeEventListener('change', handleSystemThemeChange)
  window.removeEventListener('click', closeDropdowns)
  if (notifTimer) window.clearInterval(notifTimer)
})
</script>

<template>
  <div class="test-mode-banner">
    <svg viewBox="0 0 24 24" role="presentation"><path d="M12 2 1 21h22L12 2Zm0 5.5 6.9 12H5.1L12 7.5ZM11 10v5h2v-5h-2Zm0 6.5v2h2v-2h-2Z" /></svg>
    {{ m.header.testModeNotice }}
  </div>

  <header class="app-header-wrap">
    <div class="container-fluid shell px-3 px-lg-4 py-3">
      <div class="app-topbar d-flex align-items-center gap-3">
        <button
          v-if="authStore.isAuthenticated"
          class="mobile-menu-btn"
          type="button"
          aria-label="Menyu"
          @click.stop="toggleMobileMenu"
        >
          <svg viewBox="0 0 24 24" role="presentation"><path d="M3 6h18v2H3V6Zm0 5h18v2H3v-2Zm0 5h18v2H3v-2Z" /></svg>
        </button>

        <div class="app-brand d-flex align-items-center gap-3">
          <AppLogo size="sm" />
          <strong class="brand-title">
            <span>{{ m.brand.uniLine1 }}</span>
            <span>{{ m.brand.uniLine2 }}</span>
          </strong>
        </div>

        <div v-if="showSearch" class="app-search-wrap header-dropdown" @click.stop>
          <input
            v-model="searchQuery"
            class="form-control app-search"
            type="search"
            :placeholder="m.header.search"
            @keyup.enter="runStudentSearch"
            @focus="isSearchOpen = !!(searchResult || searchError || searchLoading)"
          />
          <div v-if="isSearchOpen" class="header-menu app-search-result">
            <p v-if="searchLoading" class="app-search-status">{{ m.header.searching }}</p>
            <p v-else-if="searchError" class="app-search-status app-search-error">{{ searchError }}</p>
            <div v-else-if="searchResult" class="app-search-student">
              <img v-if="searchResult.photoUrl" class="app-search-avatar" :src="searchResult.photoUrl" alt="" />
              <span v-else class="app-search-avatar app-search-avatar-fallback">
                {{ (searchResult.fullName || '?').charAt(0).toUpperCase() }}
              </span>
              <div class="app-search-student-info">
                <strong>{{ searchResult.fullName || searchResult.hemisId }}</strong>
                <span>{{ m.settings.hemisId }}: {{ searchResult.hemisId }}</span>
                <span v-if="searchResult.faculty">{{ m.profile.studentFields.faculty }}: {{ searchResult.faculty }}</span>
                <span v-if="searchResult.course || searchResult.group">
                  {{ m.profile.studentFields.course }}: {{ searchResult.course }}
                  <template v-if="searchResult.group"> · {{ m.profile.studentFields.group }}: {{ searchResult.group }}</template>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="app-controls d-flex align-items-center gap-2 ms-auto">
          <div class="header-dropdown" @click.stop>
            <button class="btn header-trigger" @click="toggleThemeDropdown">
              <span class="mode-icon" :class="`mode-${themeMode}`" />
              <span class="trigger-label">{{ themeLabel }}</span>
              <span class="trigger-arrow">▼</span>
            </button>
            <ul v-if="isThemeOpen" class="header-menu list-unstyled mb-0">
              <li v-for="option in themeOptions" :key="option.key">
                <button
                  class="header-menu-item"
                  :class="{ active: themeMode === option.key }"
                  @click="selectTheme(option.key)"
                >
                  <span class="mode-icon" :class="`mode-${option.icon}`" />
                  <span>{{ option.label }}</span>
                </button>
              </li>
            </ul>
          </div>

          <div class="header-dropdown" @click.stop>
            <button class="btn header-trigger language-trigger" @click="toggleLanguageDropdown">
              <FlagIcon :code="currentFlagCode" />
              <span class="trigger-label">{{ LOCALE_SHORT_LABEL[localeStore.locale] }}</span>
              <span class="trigger-arrow">▼</span>
            </button>
            <ul v-if="isLanguageOpen" class="header-menu list-unstyled mb-0">
              <li v-for="option in languageOptions" :key="option.key">
                <button
                  class="header-menu-item language-menu-item"
                  :class="{ active: localeStore.locale === option.key }"
                  @click="selectLanguage(option.key)"
                >
                  <FlagIcon :code="option.icon" />
                  <span>{{ LOCALE_SHORT_LABEL[option.key] }}</span>
                </button>
              </li>
            </ul>
          </div>

          <div v-if="authStore.isAuthenticated" class="header-dropdown" @click.stop>
            <button class="btn header-trigger notif-trigger" type="button" :aria-label="m.notifications.title" @click="toggleNotifDropdown">
              <svg viewBox="0 0 24 24" class="notif-bell">
                <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6.5V11a7 7 0 0 0-5-6.71V4a2 2 0 0 0-4 0v.29A7 7 0 0 0 5 11v4.5L3 17.5V19h18v-1.5L19 15.5Z" />
              </svg>
              <span v-if="notificationsStore.unreadCount > 0" class="notif-badge">
                {{ notificationsStore.unreadCount > 9 ? '9+' : notificationsStore.unreadCount }}
              </span>
            </button>
            <div v-if="isNotifOpen" class="header-menu notif-panel">
              <div class="notif-panel-head">
                <strong>{{ m.notifications.title }}</strong>
                <button
                  v-if="notificationsStore.unreadCount > 0"
                  type="button"
                  class="notif-mark-all"
                  @click="markAllNotificationsRead"
                >
                  {{ m.notifications.markAllRead }}
                </button>
              </div>
              <p v-if="notificationsStore.loading" class="notif-status">{{ m.notifications.loading }}</p>
              <p v-else-if="!notificationsStore.notifications.length" class="notif-status">{{ m.notifications.empty }}</p>
              <div v-else class="notif-list">
                <button
                  v-for="item in notificationsStore.notifications"
                  :key="item.id"
                  type="button"
                  class="notif-item"
                  :class="{ unread: !item.is_read }"
                  @click="openNotification(item)"
                >
                  <span class="notif-dot" />
                  <span class="notif-item-body">
                    <strong>{{ item.title }}</strong>
                    <span class="notif-item-message">{{ item.message }}</span>
                    <span class="notif-item-time">{{ formatNotifDate(item.created_at) }}</span>
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div v-if="authStore.isAuthenticated" class="header-user d-flex align-items-center gap-2">
            <span class="user-chip">
              <img v-if="authStore.session?.imageUrl" class="user-avatar" :src="authStore.session.imageUrl" alt="" />
              <span v-else class="user-avatar">{{ (authStore.session?.name || 'U').charAt(0) }}</span>
              <span class="user-meta">
                <strong>{{ authStore.session?.name }}</strong>
                <small>{{ roleLabel }}</small>
              </span>
            </span>
            <button class="btn header-trigger logout-btn" @click="handleLogout">
              <svg viewBox="0 0 24 24" role="presentation">
                <path
                  d="M16 13v-2H7V8l-5 4 5 4v-3h9ZM20 3h-9a2 2 0 0 0-2 2v3h2V5h9v14h-9v-3H9v3a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z"
                />
              </svg>
              {{ m.header.logout }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
