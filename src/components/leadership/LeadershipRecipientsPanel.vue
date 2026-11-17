<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { extractApiError } from '@/services/http'
import { useLocaleStore } from '@/stores/locale'
import {
  useLeadershipAppealsStore,
  type HandlerCandidate,
  type LeadershipHandler,
  type LeadershipRecipient,
  type RecipientPayload,
} from '@/stores/leadershipAppeals'

/** SuperAdmin uchun rahbarlar ro'yxati (CRUD) va ularning mas'ul xodimlari. */
const localeStore = useLocaleStore()
const store = useLeadershipAppealsStore()
const m = computed(() => localeStore.m.leadership.recipients)

const loading = ref(false)
const loadError = ref('')
const okMessage = ref('')

/** `null` — ro'yxat, `'new'` — yangi rahbar, son — tahrirlanayotgan rahbar id'si. */
const editing = ref<number | 'new' | null>(null)
const saving = ref(false)
const formError = ref('')
const form = reactive({
  nameUz: '',
  nameRu: '',
  positionUz: '',
  positionRu: '',
  order: 0,
  isActive: true,
  handlers: [] as LeadershipHandler[],
})

const searchQuery = ref('')
const candidates = ref<HandlerCandidate[]>([])
const searching = ref(false)
const searchError = ref('')
let searchTimer: number | undefined

const deleteId = ref<number | null>(null)
const deleteError = ref('')

const isFormOpen = computed(() => editing.value !== null)

onMounted(load)

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    await store.fetchRecipients()
  } catch (err) {
    loadError.value = extractApiError(err, m.value.loadError)
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, {
    nameUz: '',
    nameRu: '',
    positionUz: '',
    positionRu: '',
    order: 0,
    isActive: true,
    handlers: [],
  })
  searchQuery.value = ''
  candidates.value = []
  searchError.value = ''
  formError.value = ''
}

function startNew() {
  resetForm()
  editing.value = 'new'
  okMessage.value = ''
}

function startEdit(r: LeadershipRecipient) {
  resetForm()
  Object.assign(form, {
    nameUz: r.nameUz,
    nameRu: r.nameRu,
    positionUz: r.positionUz,
    positionRu: r.positionRu,
    order: r.order,
    isActive: r.isActive,
    handlers: r.handlers.map((h) => ({ ...h })),
  })
  editing.value = r.id
  okMessage.value = ''
}

function cancelForm() {
  editing.value = null
  resetForm()
}

/** Qidiruv 400ms kechiktiriladi; server faqat xodimlarni qaytaradi. */
function onSearchInput() {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(runSearch, 400)
}

async function runSearch() {
  const q = searchQuery.value.trim()
  searchError.value = ''
  if (q.length < 2) {
    candidates.value = []
    return
  }
  searching.value = true
  try {
    candidates.value = await store.searchHandlers(q)
  } catch (err) {
    candidates.value = []
    searchError.value = extractApiError(err, m.value.loadError)
  } finally {
    searching.value = false
  }
}

function isSelected(id: number): boolean {
  return form.handlers.some((h) => h.id === id)
}

function addHandler(c: HandlerCandidate) {
  if (isSelected(c.id)) return
  form.handlers.push({ id: c.id, fullName: c.fullName })
}

function removeHandler(id: number) {
  form.handlers = form.handlers.filter((h) => h.id !== id)
}

function handlersText(r: LeadershipRecipient): string {
  if (!r.handlers.length) return m.value.noHandlersBadge
  return r.handlers.map((h) => h.fullName || `#${h.id}`).join(', ')
}

async function save() {
  formError.value = ''
  okMessage.value = ''
  if (!form.nameUz.trim()) {
    formError.value = m.value.nameRequired
    return
  }
  const payload: RecipientPayload = {
    name_uz: form.nameUz.trim(),
    name_ru: form.nameRu.trim(),
    position_uz: form.positionUz.trim(),
    position_ru: form.positionRu.trim(),
    order: Number(form.order) || 0,
    is_active: form.isActive,
    handlers: form.handlers.map((h) => h.id),
  }
  saving.value = true
  try {
    if (editing.value === 'new') await store.createRecipient(payload)
    else if (typeof editing.value === 'number') await store.updateRecipient(editing.value, payload)
    okMessage.value = m.value.saved
    cancelForm()
  } catch (err) {
    formError.value = extractApiError(err, m.value.loadError)
  } finally {
    saving.value = false
  }
}

async function confirmRemove(id: number) {
  deleteError.value = ''
  try {
    await store.removeRecipient(id)
    deleteId.value = null
  } catch (err) {
    // Murojaati bor rahbar o'chirilmaydi — backend sababni qaytaradi; faolsizlantirish tavsiya qilinadi.
    deleteError.value = extractApiError(err, m.value.removeHint)
  }
}
</script>

<template>
  <section class="lap-recipients">
    <p class="services-subtitle">{{ m.subtitle }}</p>

    <div class="lap-recipients-head">
      <button v-if="!isFormOpen" type="button" class="appeal-btn primary" @click="startNew">{{ m.add }}</button>
      <p v-if="okMessage" class="lap-ok">{{ okMessage }}</p>
    </div>

    <form v-if="isFormOpen" class="appeal-form lap-recipient-form" @submit.prevent="save">
      <h3>{{ editing === 'new' ? m.formTitleNew : m.formTitleEdit }}</h3>

      <div class="lap-form-grid">
        <label class="field">
          <span class="field-label">{{ m.nameUz }}</span>
          <input v-model="form.nameUz" type="text" class="field-input" required />
        </label>
        <label class="field">
          <span class="field-label">{{ m.nameRu }}</span>
          <input v-model="form.nameRu" type="text" class="field-input" />
        </label>
        <label class="field">
          <span class="field-label">{{ m.positionUz }}</span>
          <input v-model="form.positionUz" type="text" class="field-input" />
        </label>
        <label class="field">
          <span class="field-label">{{ m.positionRu }}</span>
          <input v-model="form.positionRu" type="text" class="field-input" />
        </label>
        <label class="field">
          <span class="field-label">{{ m.order }}</span>
          <input v-model.number="form.order" type="number" min="0" class="field-input" />
        </label>
        <label class="lap-check">
          <input v-model="form.isActive" type="checkbox" />
          {{ m.active }}
        </label>
      </div>
      <p class="field-hint">{{ m.ruFallbackHint }}</p>

      <div class="field">
        <span class="field-label">{{ m.handlers }}</span>
        <p class="field-hint">{{ m.handlersHint }}</p>
        <div v-if="form.handlers.length" class="lap-chips">
          <span v-for="h in form.handlers" :key="h.id" class="lap-chip">
            {{ h.fullName || `#${h.id}` }}
            <button type="button" class="lap-chip-remove" :aria-label="m.handlerRemove" @click="removeHandler(h.id)">×</button>
          </span>
        </div>
        <input
          v-model="searchQuery"
          type="search"
          class="field-input"
          :placeholder="m.handlersSearch"
          @input="onSearchInput"
        />
        <p v-if="searching" class="lap-meta">{{ m.handlersSearching }}</p>
        <p v-if="searchError" class="form-error">{{ searchError }}</p>
        <ul v-if="candidates.length" class="lap-candidates">
          <li v-for="c in candidates" :key="c.id">
            <span>
              <strong>{{ c.fullName }}</strong>
              <span class="lap-meta">{{ c.hemisId }} · {{ c.roleDisplay }}{{ c.departmentName ? ` · ${c.departmentName}` : '' }}</span>
            </span>
            <button
              type="button"
              class="appeal-btn"
              :disabled="isSelected(c.id)"
              @click="addHandler(c)"
            >
              {{ isSelected(c.id) ? '✓' : m.handlerAdd }}
            </button>
          </li>
        </ul>
        <p v-else-if="searchQuery.trim().length >= 2 && !searching" class="lap-meta">{{ m.handlersNone }}</p>
      </div>

      <p v-if="formError" class="form-error">{{ formError }}</p>
      <div class="lap-actions">
        <button type="submit" class="appeal-btn primary" :disabled="saving">{{ m.save }}</button>
        <button type="button" class="appeal-btn" :disabled="saving" @click="cancelForm">{{ m.cancel }}</button>
      </div>
    </form>

    <p v-if="loading" class="appeal-empty">{{ m.loading }}</p>
    <p v-else-if="loadError" class="form-error">{{ loadError }}</p>
    <div v-else class="staff-table-wrap">
      <table class="staff-table">
        <thead>
          <tr>
            <th>{{ m.colName }}</th>
            <th>{{ m.colPosition }}</th>
            <th>{{ m.colHandlers }}</th>
            <th>{{ m.colStatus }}</th>
            <th>{{ m.colActions }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in store.recipients" :key="r.id">
            <td>
              <strong>{{ r.nameUz }}</strong>
              <div v-if="r.nameRu" class="lap-meta">{{ r.nameRu }}</div>
            </td>
            <td>
              {{ r.positionUz || '—' }}
              <div v-if="r.positionRu" class="lap-meta">{{ r.positionRu }}</div>
            </td>
            <td>{{ handlersText(r) }}</td>
            <td>
              <span class="lap-status" :class="r.isActive ? 'is-answered' : 'is-rejected'">
                {{ r.isActive ? m.activeBadge : m.inactiveBadge }}
              </span>
            </td>
            <td>
              <div class="lap-actions">
                <button type="button" class="appeal-btn" :disabled="isFormOpen" @click="startEdit(r)">{{ m.edit }}</button>
                <template v-if="deleteId === r.id">
                  <button type="button" class="appeal-btn req-cancel-btn" @click="confirmRemove(r.id)">{{ m.confirmRemove }}</button>
                  <button type="button" class="appeal-btn" @click="deleteId = null; deleteError = ''">{{ m.cancel }}</button>
                </template>
                <button
                  v-else
                  type="button"
                  class="appeal-btn req-cancel-btn"
                  :disabled="isFormOpen"
                  @click="deleteId = r.id; deleteError = ''"
                >
                  {{ m.remove }}
                </button>
              </div>
              <p v-if="deleteId === r.id && deleteError" class="form-error">{{ deleteError }}</p>
              <p v-if="deleteId === r.id && !deleteError" class="lap-meta">{{ m.removeHint }}</p>
            </td>
          </tr>
          <tr v-if="!store.recipients.length">
            <td colspan="5" class="lap-meta">{{ m.empty }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
