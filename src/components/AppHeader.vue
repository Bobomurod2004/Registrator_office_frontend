<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

type ThemeMode = 'light' | 'dark' | 'system'
type Language = 'UZ' | 'EN' | 'RU'

const THEME_KEY = 'r-office-theme-mode'
const LANG_KEY = 'r-office-language'

const themeMode = ref<ThemeMode>((localStorage.getItem(THEME_KEY) as ThemeMode) || 'system')
const language = ref<Language>((localStorage.getItem(LANG_KEY) as Language) || 'UZ')
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
const route = useRoute()
const showSearch = computed(() => route.name !== 'login')
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
        </div>
      </div>
    </div>
  </header>
</template>
