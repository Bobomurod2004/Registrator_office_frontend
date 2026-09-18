<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import RichTextEditor from '@/components/RichTextEditor.vue'
import { useLocaleStore } from '@/stores/locale'
import { useAuthStore } from '@/stores/auth'
import { useInfoStore, type ContentLang } from '@/stores/info'

const localeStore = useLocaleStore()
const authStore = useAuthStore()
const infoStore = useInfoStore()
const m = computed(() => localeStore.m)

const LANG_TABS: ContentLang[] = ['uz', 'uz_cyrl', 'ru', 'en']

onMounted(() => {
  void infoStore.fetchAll()
})

watch(
  () => localeStore.locale,
  () => void infoStore.fetchAll(),
)

const selectedId = ref<number | null>(null)
const selectedEntry = computed(
  () => infoStore.entries.find((e) => e.id === selectedId.value) ?? null,
)

function selectCard(id: number) {
  selectedId.value = selectedId.value === id ? null : id
}

const showForm = ref(false)
const editingId = ref<number | null>(null)
const activeLangTab = ref<ContentLang>('uz')
const formNames = ref<Record<ContentLang, string>>({ uz: '', uz_cyrl: '', ru: '', en: '' })
const formBodies = ref<Record<ContentLang, string>>({ uz: '', uz_cyrl: '', ru: '', en: '' })
const savedMessage = ref(false)
const submitting = ref(false)
const formError = ref(false)

function langLabel(lang: ContentLang) {
  return m.value.profile.languageValues[lang]
}

function openAddForm() {
  editingId.value = null
  activeLangTab.value = 'uz'
  formNames.value = { uz: '', uz_cyrl: '', ru: '', en: '' }
  formBodies.value = { uz: '', uz_cyrl: '', ru: '', en: '' }
  formError.value = false
  showForm.value = true
}

function openEditForm(id: number) {
  const entry = infoStore.entries.find((e) => e.id === id)
  if (!entry) return
  editingId.value = id
  activeLangTab.value = 'uz'
  formNames.value = {
    uz: entry.name_uz,
    uz_cyrl: entry.name_uz_cyrl,
    ru: entry.name_ru,
    en: entry.name_en,
  }
  formBodies.value = {
    uz: entry.description_uz,
    uz_cyrl: entry.description_uz_cyrl,
    ru: entry.description_ru,
    en: entry.description_en,
  }
  formError.value = false
  showForm.value = true
}

function cancelForm() {
  showForm.value = false
  editingId.value = null
  formError.value = false
}

async function submitForm() {
  if (!formNames.value.uz.trim() || !formBodies.value.uz.trim()) return

  submitting.value = true
  formError.value = false
  try {
    const payload = {
      name_uz: formNames.value.uz.trim(),
      name_uz_cyrl: formNames.value.uz_cyrl.trim() || undefined,
      name_ru: formNames.value.ru.trim() || undefined,
      name_en: formNames.value.en.trim() || undefined,
      description_uz: formBodies.value.uz,
      description_uz_cyrl: formBodies.value.uz_cyrl || undefined,
      description_ru: formBodies.value.ru || undefined,
      description_en: formBodies.value.en || undefined,
    }
    if (editingId.value) {
      await infoStore.updateEntry(editingId.value, payload)
    } else {
      await infoStore.addEntry(payload)
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

const deleteError = ref(false)

async function removeCard(id: number) {
  deleteError.value = false
  try {
    await infoStore.removeEntry(id)
    if (selectedId.value === id) selectedId.value = null
    if (editingId.value === id) cancelForm()
  } catch {
    deleteError.value = true
  }
}
</script>

<template>
  <DashboardLayout>
    <div class="info-content">
      <div class="info-header-row">
        <div class="info-title-group">
          <span class="info-kicker"><i aria-hidden="true" /> {{ m.menu.info }}</span>
          <h1 class="info-page-title">{{ m.menu.info }}</h1>
        </div>
        <button v-if="authStore.isAdmin && !showForm" type="button" class="submit-btn info-add-btn" @click="openAddForm">
          <span aria-hidden="true">+</span> {{ m.info.add }}
        </button>
      </div>

      <form v-if="showForm" class="appeal-form info-add-form" @submit.prevent="submitForm">
        <h3>{{ editingId ? m.info.editTitle : m.info.addTitle }}</h3>

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
        <p class="field-hint">{{ m.info.langHint }}</p>

        <label class="field">
          <span class="field-label">{{ m.info.titleLabel }}</span>
          <input
            v-model="formNames[activeLangTab]"
            type="text"
            class="field-input"
            :placeholder="m.info.titlePlaceholder"
          />
        </label>

        <div class="field">
          <span class="field-label">{{ m.info.contentLabel }}</span>
          <RichTextEditor v-model="formBodies[activeLangTab]" />
        </div>

        <div class="info-form-actions">
          <button type="submit" class="submit-btn" :disabled="submitting">
            {{ editingId ? m.info.save : m.info.add }}
          </button>
          <button type="button" class="appeal-btn" @click="cancelForm">{{ m.info.cancel }}</button>
        </div>
        <p v-if="savedMessage" class="form-success">{{ m.info.added }}</p>
        <p v-if="formError" class="form-error">{{ m.info.saveError }}</p>
      </form>

      <p v-if="deleteError" class="form-error">{{ m.info.deleteError }}</p>
      <p v-if="infoStore.error" class="form-error">{{ m.info.loadError }}</p>
      <p v-if="infoStore.loading" class="form-success">{{ m.info.loading }}</p>
      <p v-if="!infoStore.loading && !infoStore.error && !infoStore.entries.length" class="form-success">
        {{ m.info.empty }}
      </p>

      <div class="info-cards">
        <div v-for="entry in infoStore.entries" :key="entry.id" class="info-topic-card-wrap">
          <button
            class="btn info-topic-card text-start"
            :class="{ active: selectedId === entry.id }"
            @click="selectCard(entry.id)"
          >
            <h3>{{ entry.title }}</h3>
          </button>
          <div v-if="authStore.isAdmin" class="info-topic-actions">
            <button class="info-topic-edit" title="Tahrirlash" @click="openEditForm(entry.id)">✎</button>
            <button class="info-topic-remove" title="O'chirish" @click="removeCard(entry.id)">×</button>
          </div>
        </div>
      </div>

      <article v-if="selectedEntry" class="info-details">
        <div class="info-details-head">
          <h2>{{ selectedEntry.title }}</h2>
          <button type="button" class="info-details-close" title="Yopish" @click="selectedId = null">×</button>
        </div>
        <div class="info-rich-body ck-content" v-html="selectedEntry.bodyHtml" />
      </article>
    </div>
  </DashboardLayout>
</template>
