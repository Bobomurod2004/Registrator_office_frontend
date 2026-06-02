<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLocaleStore } from '@/stores/locale'
import type { Locale } from '@/i18n/messages'
import FlagIcon from '@/components/FlagIcon.vue'
import AppLogo from '@/components/AppLogo.vue'

type ThemeMode = 'light' | 'dark' | 'system'

const THEME_KEY = 'r-office-theme-mode'

const themeMode = ref<ThemeMode>((localStorage.getItem(THEME_KEY) as ThemeMode) || 'system')
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const localeStore = useLocaleStore()
const m = computed(() => localeStore.m)
const showSearch = computed(() => route.name !== 'login')

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

const themeOptions = computed<Array<{ key: ThemeMode; label: string; icon: string }>>(() => [
  { key: 'light', label: m.value.header.theme.light, icon: 'light' },
  { key: 'dark', label: m.value.header.theme.dark, icon: 'dark' },
  { key: 'system', label: m.value.header.theme.system, icon: 'system' },
])

const themeLabel = computed(() => m.value.header.theme[themeMode.value])

const languageOptions: Array<{ key: Locale; icon: 'uz' | 'ru' | 'en' }> = [
  { key: 'UZ', icon: 'uz' },
  { key: 'EN', icon: 'en' },
  { key: 'RU', icon: 'ru' },
]

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
}

function toggleThemeDropdown() {
  isThemeOpen.value = !isThemeOpen.value
  isLanguageOpen.value = false
}

function toggleLanguageDropdown() {
  isLanguageOpen.value = !isLanguageOpen.value
  isThemeOpen.value = false
}

function selectTheme(value: ThemeMode) {
  themeMode.value = value
  isThemeOpen.value = false
}

watch(themeMode, (value) => {
  localStorage.setItem(THEME_KEY, value)
  applyTheme()
})

onMounted(() => {
  applyTheme()
  mediaQuery.addEventListener('change', handleSystemThemeChange)
  window.addEventListener('click', closeDropdowns)
})

onBeforeUnmount(() => {
  mediaQuery.removeEventListener('change', handleSystemThemeChange)
  window.removeEventListener('click', closeDropdowns)
})
</script>

<template>
  <header class="app-header-wrap">
    <div class="container-fluid shell px-3 px-lg-4 py-3">
      <div class="app-topbar d-flex align-items-center gap-3">
        <div class="app-brand d-flex align-items-center gap-3">
          <AppLogo size="sm" />
          <strong class="brand-title">
            <span>{{ m.brand.uniLine1 }}</span>
            <span>{{ m.brand.uniLine2 }}</span>
          </strong>
        </div>

        <div v-if="showSearch" class="app-search-wrap">
          <input class="form-control app-search" type="search" :placeholder="m.header.search" />
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
              <FlagIcon :code="localeStore.locale.toLowerCase() as 'uz' | 'ru' | 'en'" />
              <span class="trigger-label">{{ localeStore.locale }}</span>
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
                  <span>{{ option.key }}</span>
                </button>
              </li>
            </ul>
          </div>

          <div v-if="authStore.isAuthenticated" class="header-user d-flex align-items-center gap-2">
            <span class="user-chip">
              <span class="user-avatar">{{ (authStore.session?.name || 'U').charAt(0) }}</span>
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
