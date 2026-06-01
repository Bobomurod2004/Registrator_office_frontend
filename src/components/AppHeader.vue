<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

type ThemeMode = 'light' | 'dark' | 'system'
type Language = 'UZ' | 'EN' | 'RU'

const THEME_KEY = 'r-office-theme-mode'
const LANG_KEY = 'r-office-language'

const themeMode = ref<ThemeMode>((localStorage.getItem(THEME_KEY) as ThemeMode) || 'system')
const language = ref<Language>((localStorage.getItem(LANG_KEY) as Language) || 'UZ')
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const showSearch = computed(() => route.name !== 'login')

function handleLogout() {
  authStore.logout()
  void router.replace({ name: 'login' })
}
const isThemeOpen = ref(false)
const isLanguageOpen = ref(false)

const themeOptions: Array<{ key: ThemeMode; label: string; icon: string }> = [
  { key: 'light', label: 'Light', icon: 'light' },
  { key: 'dark', label: 'Dark', icon: 'dark' },
  { key: 'system', label: 'System', icon: 'system' },
]

const languageOptions: Array<{ key: Language; label: string; icon: string }> = [
  { key: 'UZ', label: 'UZ', icon: 'uz' },
  { key: 'EN', label: 'EN', icon: 'en' },
  { key: 'RU', label: 'RU', icon: 'ru' },
]

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

function selectLanguage(value: Language) {
  language.value = value
  isLanguageOpen.value = false
}

watch(themeMode, (value) => {
  localStorage.setItem(THEME_KEY, value)
  applyTheme()
})

watch(language, (value) => {
  localStorage.setItem(LANG_KEY, value)
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
          <div class="brand-logo" aria-hidden="true">
            <svg viewBox="0 0 64 64" role="presentation">
              <path
                d="M32 8 56 20 32 32 8 20 32 8Zm-16 19v11c0 5 8 10 16 10s16-5 16-10V27l-16 8-16-8Z"
              />
            </svg>
          </div>
          <strong class="brand-title">
            <span>O'zbekiston davlat</span>
            <span>jahon tillari universiteti</span>
          </strong>
        </div>

        <div v-if="showSearch" class="app-search-wrap">
          <input class="form-control app-search" type="search" placeholder="Qidirish..." />
        </div>

        <div class="app-controls d-flex align-items-center gap-2 ms-auto">
          <div class="header-dropdown" @click.stop>
            <button class="btn header-trigger" @click="toggleThemeDropdown">
              <span class="mode-icon" :class="`mode-${themeMode}`" />
              <span class="trigger-label text-capitalize">{{ themeMode }}</span>
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
              <span class="lang-dot" :class="`dot-${language.toLowerCase()}`" />
              <span class="trigger-label">{{ language }}</span>
              <span class="trigger-arrow">▼</span>
            </button>
            <ul v-if="isLanguageOpen" class="header-menu list-unstyled mb-0">
              <li v-for="option in languageOptions" :key="option.key">
                <button
                  class="header-menu-item language-menu-item"
                  :class="{ active: language === option.key }"
                  @click="selectLanguage(option.key)"
                >
                  <span class="lang-dot" :class="`dot-${option.icon}`" />
                  <span>{{ option.label }}</span>
                </button>
              </li>
            </ul>
          </div>

          <div v-if="authStore.isAuthenticated" class="header-user d-flex align-items-center gap-2">
            <span class="user-chip">
              <span class="user-avatar">{{ (authStore.session?.name || 'U').charAt(0) }}</span>
              <span class="user-meta">
                <strong>{{ authStore.session?.name }}</strong>
                <small>{{ authStore.session?.role }}</small>
              </span>
            </span>
            <button class="btn header-trigger logout-btn" @click="handleLogout">
              <svg viewBox="0 0 24 24" role="presentation">
                <path
                  d="M16 13v-2H7V8l-5 4 5 4v-3h9ZM20 3h-9a2 2 0 0 0-2 2v3h2V5h9v14h-9v-3H9v3a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z"
                />
              </svg>
              Chiqish
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
