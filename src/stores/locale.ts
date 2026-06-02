import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Locale } from '@/i18n/messages'
import { messages } from '@/i18n/messages'

const LANG_KEY = 'r-office-language'

function loadLocale(): Locale {
  const saved = localStorage.getItem(LANG_KEY) as Locale | null
  return saved === 'UZ' || saved === 'RU' || saved === 'EN' ? saved : 'UZ'
}

export const useLocaleStore = defineStore('locale', () => {
  const locale = ref<Locale>(loadLocale())

  const m = computed(() => messages[locale.value])

  function setLocale(value: Locale) {
    locale.value = value
    localStorage.setItem(LANG_KEY, value)
  }

  return { locale, m, setLocale }
})
