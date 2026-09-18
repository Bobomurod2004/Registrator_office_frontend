<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import { useLocaleStore } from '@/stores/locale'
import { useAuthStore } from '@/stores/auth'
import { useContactsStore, type ContentLang } from '@/stores/contacts'

const localeStore = useLocaleStore()
const authStore = useAuthStore()
const contactsStore = useContactsStore()
const m = computed(() => localeStore.m)

const LANG_TABS: ContentLang[] = ['uz', 'uz_cyrl', 'ru', 'en']

onMounted(() => {
  void contactsStore.fetchAll()
})

watch(
  () => localeStore.locale,
  () => void contactsStore.fetchAll(),
)

function langLabel(lang: ContentLang) {
  return m.value.profile.languageValues[lang]
}

const showForm = ref(false)
const editingId = ref<number | null>(null)
const activeLangTab = ref<ContentLang>('uz')
const formNames = ref<Record<ContentLang, string>>({ uz: '', uz_cyrl: '', ru: '', en: '' })
const formPhone = ref('')
const formShort = ref('')
const savedMessage = ref(false)
const submitting = ref(false)
const formError = ref(false)
const deleteError = ref(false)

function openAddForm() {
  editingId.value = null
  activeLangTab.value = 'uz'
  formNames.value = { uz: '', uz_cyrl: '', ru: '', en: '' }
  formPhone.value = ''
  formShort.value = ''
  formError.value = false
  showForm.value = true
}

function openEditForm(id: number) {
  const entry = contactsStore.entries.find((e) => e.id === id)
  if (!entry) return
  editingId.value = id
  activeLangTab.value = 'uz'
  formNames.value = {
    uz: entry.name_uz,
    uz_cyrl: entry.name_uz_cyrl,
    ru: entry.name_ru,
    en: entry.name_en,
  }
  formPhone.value = entry.phone
  formShort.value = entry.shortNumber
  formError.value = false
  showForm.value = true
}

function cancelForm() {
  showForm.value = false
  editingId.value = null
  formError.value = false
}

async function submitForm() {
  if (!formNames.value.uz.trim() || !formPhone.value.trim()) return

  submitting.value = true
  formError.value = false
  try {
    const translations = {
      name_uz: formNames.value.uz.trim(),
      name_uz_cyrl: formNames.value.uz_cyrl.trim() || undefined,
      name_ru: formNames.value.ru.trim() || undefined,
      name_en: formNames.value.en.trim() || undefined,
    }
    if (editingId.value) {
      await contactsStore.updateEntry(editingId.value, translations, formPhone.value.trim(), formShort.value.trim())
    } else {
      await contactsStore.addEntry(translations, formPhone.value.trim(), formShort.value.trim())
    }
    savedMessage.value = true
    window.setTimeout(() => (savedMessage.value = false), 2500)
    cancelForm()
  } catch {
    formError.value = true
  } finally {
    submitting.value = false
  }
}

async function removeEntry(id: number) {
  deleteError.value = false
  try {
    await contactsStore.removeEntry(id)
    if (editingId.value === id) cancelForm()
  } catch {
    deleteError.value = true
  }
}
</script>

<template>
  <DashboardLayout>
    <div class="info-header-row">
      <div>
        <h1 class="info-page-title">{{ m.menu.contacts }}</h1>
        <p class="services-subtitle">{{ m.contacts.subtitle }}</p>
      </div>
      <button v-if="authStore.isAdmin && !showForm" type="button" class="submit-btn info-add-btn" @click="openAddForm">
        + {{ m.contacts.add }}
      </button>
    </div>

    <form v-if="showForm" class="appeal-form info-add-form" @submit.prevent="submitForm">
      <h3>{{ editingId ? m.contacts.editTitle : m.contacts.addTitle }}</h3>

      <div class="lang-tabs">
        <button
          v-for="lang in LANG_TABS"
          :key="lang"
          type="button"
          class="lang-tab"
          :class="{ active: activeLangTab === lang }"
          @click="activeLangTab = lang"
        >
          {{ langLabel(lang) }}
        </button>
      </div>
      <p class="field-hint">{{ m.contacts.langHint }}</p>

      <label class="field">
        <span class="field-label">{{ m.contacts.nameLabel }}</span>
        <input
          v-model="formNames[activeLangTab]"
          type="text"
          class="field-input"
          :placeholder="m.contacts.namePlaceholder"
        />
      </label>

      <label class="field">
        <span class="field-label">{{ m.contacts.phoneLabel }}</span>
        <input v-model="formPhone" type="text" class="field-input" placeholder="+998 71 123 45 67" />
      </label>

      <label class="field">
        <span class="field-label">{{ m.contacts.shortLabel }}</span>
        <input v-model="formShort" type="text" class="field-input" :placeholder="m.contacts.shortPlaceholder" />
      </label>

      <div class="info-form-actions">
        <button type="submit" class="submit-btn" :disabled="submitting">
          {{ editingId ? m.contacts.save : m.contacts.add }}
        </button>
        <button type="button" class="appeal-btn" @click="cancelForm">{{ m.contacts.cancel }}</button>
      </div>
      <p v-if="savedMessage" class="form-success">{{ m.contacts.added }}</p>
      <p v-if="formError" class="form-error">{{ m.contacts.saveError }}</p>
    </form>

    <p v-if="deleteError" class="form-error">{{ m.contacts.deleteError }}</p>
    <p v-if="contactsStore.error" class="form-error">{{ m.contacts.loadError }}</p>
    <p v-if="contactsStore.loading" class="form-success">{{ m.contacts.loading }}</p>

    <div class="staff-table-wrap">
      <table class="staff-table">
        <thead>
          <tr>
            <th>{{ m.contacts.colName }}</th>
            <th>{{ m.contacts.colPhone }}</th>
            <th>{{ m.contacts.colShort }}</th>
            <th v-if="authStore.isAdmin" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in contactsStore.entries" :key="entry.id">
            <td>{{ entry.title }}</td>
            <td>{{ entry.phone }}</td>
            <td>{{ entry.shortNumber || '—' }}</td>
            <td v-if="authStore.isAdmin">
              <div class="contact-row-actions">
                <button class="info-topic-edit" title="Tahrirlash" @click="openEditForm(entry.id)">✎</button>
                <button class="staff-remove" title="O'chirish" @click="removeEntry(entry.id)">
                  <svg viewBox="0 0 24 24">
                    <path
                      d="M9 3h6a1 1 0 0 1 1 1v1h5v2H3V5h5V4a1 1 0 0 1 1-1Zm-3 6h12l-1 12H7L6 9Zm3 2v8h1v-8H9Zm4 0v8h1v-8h-1Z"
                    />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!contactsStore.loading && !contactsStore.error && !contactsStore.entries.length">
            <td colspan="4" class="contact-empty">{{ m.contacts.empty }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </DashboardLayout>
</template>
