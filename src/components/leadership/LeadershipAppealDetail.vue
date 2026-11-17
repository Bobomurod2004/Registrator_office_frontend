<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { extractApiError } from '@/services/http'
import { useLocaleStore } from '@/stores/locale'
import {
  previewKind,
  RESPONSE_FILE_EXTENSIONS,
  RESPONSE_FILE_MAX_BYTES,
  RESPONSE_FILES_MAX,
  useLeadershipAppealsStore,
  type AppealAttachment,
  type AppealDetail,
  type AppealStatus,
  type LeadershipRecipient,
} from '@/stores/leadershipAppeals'
import { formatDateTime } from '@/utils/formatDate'

/**
 * Bitta murojaat tafsiloti (o'ng panel). Komponent faqat foydalanuvchi murojaatni
 * tanlaganda mount qilinadi — `GET /appeals/{id}/` har chaqiruvda audit yozadi.
 * Rad etish yo'q: rahbariyat murojaatiga har doim javob beriladi.
 */
const props = defineProps<{
  appealId: number
  recipients: LeadershipRecipient[]
}>()

const emit = defineEmits<{ 'search-person': [] }>()

const localeStore = useLocaleStore()
const store = useLeadershipAppealsStore()
const m = computed(() => localeStore.m.leadership)

const detail = ref<AppealDetail | null>(null)
const loading = ref(false)
const loadError = ref('')
const actionError = ref('')
const actionOk = ref('')
const busy = ref(false)

const assignedId = ref<number | ''>('')
const responseText = ref('')
const responseConfirm = ref(false)
const noteText = ref('')
const downloadingId = ref<number | null>(null)
const downloadError = ref('')

// --- Fayl ko'rish oynasi ---
const preview = ref<{ attachment: AppealAttachment; url: string; kind: 'image' | 'pdf' } | null>(null)
const previewLoadingId = ref<number | null>(null)

// --- Javobga biriktiriladigan fayllar (yuborilmaguncha faqat brauzerda) ---
const pendingFiles = ref<File[]>([])
const fileError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const submissionFiles = computed(() => detail.value?.attachments.filter((a) => a.direction !== 'response') ?? [])
const responseFiles = computed(() => detail.value?.attachments.filter((a) => a.direction === 'response') ?? [])
const remainingSlots = computed(() => Math.max(0, RESPONSE_FILES_MAX - responseFiles.value.length))
const canSendResponse = computed(() => Boolean(responseText.value.trim()) || pendingFiles.value.length > 0)
const fileAccept = RESPONSE_FILE_EXTENSIONS.map((e) => `.${e}`).join(',')

const recipient = computed(() => {
  const d = detail.value
  if (!d || d.recipientId == null) return null
  return props.recipients.find((r) => r.id === d.recipientId) ?? null
})
const handlerOptions = computed(() => recipient.value?.handlers ?? [])
const isFinal = computed(() => detail.value?.status === 'closed' || detail.value?.status === 'rejected')

/** Jarayon bosqichi: 0 — yuborildi, 1 — ko'rib chiqilmoqda, 2 — javob berildi. */
const currentStep = computed(() => {
  const status: AppealStatus | string = detail.value?.status ?? 'new'
  if (status === 'answered' || status === 'closed' || status === 'rejected') return 2
  if (status === 'in_review') return 1
  return 0
})
const trackSteps = computed(() => [m.value.trackSubmitted, m.value.trackReview, m.value.trackAnswered])

function stepClass(index: number): string {
  if (currentStep.value === 2) return 'is-done'
  if (index < currentStep.value) return 'is-done'
  if (index === currentStep.value) return 'is-current'
  return ''
}

function statusLabel(status: string): string {
  return (m.value.statuses as Record<string, string>)[status] ?? status
}

function applicantTypeLabel(type: string): string {
  return (m.value.applicantTypes as Record<string, string>)[type] ?? type
}

function formatDate(iso: string | null | undefined): string {
  return iso ? formatDateTime(iso, localeStore.locale) : '—'
}

function noteTitle(kind: string, oldValue: string | null, newValue: string | null): string {
  if (kind !== 'status_change') return kind
  return m.value.statusChange
    .replace('{old}', statusLabel(oldValue ?? ''))
    .replace('{new}', statusLabel(newValue ?? ''))
}

function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function load() {
  closePreview()
  pendingFiles.value = []
  fileError.value = ''
  loading.value = true
  loadError.value = ''
  actionError.value = ''
  actionOk.value = ''
  responseConfirm.value = false
  try {
    detail.value = await store.fetchAppeal(props.appealId)
    assignedId.value = detail.value.assignedTo ?? ''
  } catch (err) {
    loadError.value = extractApiError(err, m.value.detailError)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void load()
  window.addEventListener('keydown', onKeydown)
})
watch(() => props.appealId, load)
onBeforeUnmount(() => {
  closePreview()
  window.removeEventListener('keydown', onKeydown)
})

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && preview.value) closePreview()
}

/** Amal bajariladi; muvaffaqiyatda tafsilot yangilanadi, xatoda ochiq holat saqlanadi. */
async function run(task: () => Promise<AppealDetail>): Promise<boolean> {
  busy.value = true
  actionError.value = ''
  actionOk.value = ''
  try {
    detail.value = await task()
    actionOk.value = m.value.saved
    return true
  } catch (err) {
    actionError.value = extractApiError(err, m.value.actionError)
    return false
  } finally {
    busy.value = false
  }
}

function changeStatus(status: AppealStatus) {
  void run(() => store.patchAppeal(props.appealId, { status }))
}

function assign() {
  if (assignedId.value === '') return
  const handlerId = Number(assignedId.value)
  void run(() => store.patchAppeal(props.appealId, { assigned_to: handlerId }))
}

/**
 * Javob matni (bo'lsa) va biriktirilgan fayllar navbat bilan yuboriladi: avval matn,
 * so'ng fayllar — murojaatchi botda ularni shu tartibda oladi. Biror fayl xato bersa,
 * yuborilmaganlari ro'yxatda qoladi va qayta urinish mumkin.
 */
async function sendResponse() {
  const text = responseText.value.trim()
  responseConfirm.value = false
  if (!text && !pendingFiles.value.length) return
  busy.value = true
  actionError.value = ''
  actionOk.value = ''
  try {
    if (text) {
      detail.value = await store.patchAppeal(props.appealId, { response: text })
      responseText.value = ''
    }
    while (pendingFiles.value.length) {
      await store.uploadResponseFile(props.appealId, pendingFiles.value[0]!)
      pendingFiles.value = pendingFiles.value.slice(1)
    }
    actionOk.value = m.value.saved
  } catch (err) {
    actionError.value = extractApiError(err, m.value.actionError)
  } finally {
    // Yuklangan fayllar `attachments` ro'yxatida ko'rinishi uchun tafsilot yangilanadi.
    try {
      detail.value = await store.fetchAppeal(props.appealId)
    } catch {
      /* ro'yxat eski holatda qoladi — xato yuqorida ko'rsatilgan */
    }
    busy.value = false
  }
}

function openFilePicker() {
  fileInput.value?.click()
}

/** Tur, hajm va soni brauzerda tekshiriladi (backend ham tekshiradi). */
function onFilesPicked(event: Event) {
  const input = event.target as HTMLInputElement
  const picked = Array.from(input.files ?? [])
  input.value = ''
  fileError.value = ''
  for (const file of picked) {
    const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : ''
    if (!RESPONSE_FILE_EXTENSIONS.includes(ext)) {
      fileError.value = m.value.fileTypeError.replace('{name}', file.name)
      continue
    }
    if (file.size > RESPONSE_FILE_MAX_BYTES) {
      fileError.value = m.value.fileSizeError.replace('{name}', file.name)
      continue
    }
    if (pendingFiles.value.length >= remainingSlots.value) {
      fileError.value = m.value.fileLimitError.replace('{max}', String(RESPONSE_FILES_MAX))
      break
    }
    pendingFiles.value = [...pendingFiles.value, file]
  }
}

function removePending(index: number) {
  pendingFiles.value = pendingFiles.value.filter((_, i) => i !== index)
}

/** Faylni ochib ko'rish (rasm/PDF). Har bir ochish backend audit jurnaliga yoziladi. */
async function openPreview(attachment: AppealAttachment) {
  const kind = previewKind(attachment.extension)
  if (!kind) return download(attachment)
  previewLoadingId.value = attachment.id
  downloadError.value = ''
  try {
    const url = await store.fetchAttachmentUrl(props.appealId, attachment)
    closePreview()
    preview.value = { attachment, url, kind }
  } catch (err) {
    downloadError.value = extractApiError(err, m.value.downloadError)
  } finally {
    previewLoadingId.value = null
  }
}

function closePreview() {
  if (preview.value) URL.revokeObjectURL(preview.value.url)
  preview.value = null
}

function downloadFromPreview() {
  if (!preview.value) return
  void store.downloadAttachment(props.appealId, preview.value.attachment, preview.value.url)
}

function canPreview(attachment: AppealAttachment): boolean {
  return previewKind(attachment.extension) !== null
}

function iconKind(attachment: AppealAttachment): string {
  return previewKind(attachment.extension) ?? 'file'
}

async function addNote() {
  const text = noteText.value.trim()
  if (!text) return
  const ok = await run(() => store.addNote(props.appealId, text))
  if (ok) noteText.value = ''
}

async function download(attachment: AppealAttachment) {
  downloadingId.value = attachment.id
  downloadError.value = ''
  try {
    await store.downloadAttachment(props.appealId, attachment)
  } catch (err) {
    downloadError.value = extractApiError(err, m.value.downloadError)
  } finally {
    downloadingId.value = null
  }
}
</script>

<template>
  <div class="lap-detail-body">
    <p v-if="loading" class="appeal-empty">{{ m.detailLoading }}</p>
    <p v-else-if="loadError" class="form-error">{{ loadError }}</p>

    <template v-else-if="detail">
      <header class="lap-d-head">
        <div>
          <span class="lap-code">{{ detail.trackingCode }}</span>
          <h3 class="lap-d-title">{{ detail.subject || '—' }}</h3>
          <span class="lap-meta">
            {{ detail.recipientName }}<template v-if="detail.recipientPosition"> · {{ detail.recipientPosition }}</template>
          </span>
        </div>
        <span class="lap-status" :class="`is-${detail.status}`">{{ statusLabel(detail.status) }}</span>
      </header>

      <ol class="lap-track">
        <li
          v-for="(step, index) in trackSteps"
          :key="index"
          class="lap-track-step"
          :class="stepClass(index)"
        >
          <span class="lap-track-dot">
            <template v-if="stepClass(index) === 'is-done'">✓</template>
            <template v-else>{{ index + 1 }}</template>
          </span>
          <span class="lap-track-label">{{ step }}</span>
        </li>
      </ol>

      <div class="lap-detail-grid">
        <div class="lap-detail-item">
          <span>{{ m.recipient }}</span>
          <strong>{{ detail.recipientName || '—' }}</strong>
        </div>
        <div class="lap-detail-item">
          <span>{{ m.submitted }}</span>
          <strong>{{ formatDate(detail.createdAt) }}</strong>
        </div>
        <div class="lap-detail-item">
          <span>{{ m.assignedTo }}</span>
          <strong>{{ detail.assignedToName || m.notAssigned }}</strong>
        </div>
        <div class="lap-detail-item">
          <span>{{ m.applicantTitle }}</span>
          <strong>{{ applicantTypeLabel(detail.applicantType) }}</strong>
        </div>
      </div>

      <section class="lap-block">
        <div class="lap-block-head">
          <h4>{{ m.applicantTitle }}</h4>
          <button type="button" class="appeal-btn" @click="emit('search-person')">{{ m.searchPerson }}</button>
        </div>
        <p v-if="detail.isAnonymous || !detail.applicant" class="lap-notice">
          {{ detail.applicantDisplay || m.anonymous }}. {{ m.anonymousNotice }}
        </p>
        <dl v-else class="lap-kv">
          <template v-if="detail.applicant.fullName">
            <dt>{{ m.applicantTitle }}</dt>
            <dd>{{ detail.applicant.fullName }} <span class="appeal-tag">{{ applicantTypeLabel(detail.applicantType) }}</span></dd>
          </template>
          <template v-if="detail.applicant.phone">
            <dt>{{ m.phone }}</dt>
            <dd>
              {{ detail.applicant.phone }}
              <span v-if="detail.applicant.phoneVerified" class="lap-verified">{{ m.phoneVerified }}</span>
            </dd>
          </template>
          <template v-if="detail.applicant.hemisId">
            <dt>{{ m.hemisId }}</dt>
            <dd>{{ detail.applicant.hemisId }}</dd>
          </template>
          <template v-if="detail.applicant.childInfo">
            <dt>{{ m.childInfo }}</dt>
            <dd>{{ detail.applicant.childInfo }}</dd>
          </template>
          <template v-for="(value, key) in detail.applicant.details ?? {}" :key="key">
            <dt>{{ (m.detailFields as Record<string, string>)[key] ?? key }}</dt>
            <dd>{{ value }}</dd>
          </template>
        </dl>
      </section>

      <section class="lap-block">
        <h4>{{ m.textTitle }}</h4>
        <p class="lap-text">{{ detail.text || '—' }}</p>
      </section>

      <section class="lap-block">
        <h4>{{ m.attachments }}</h4>
        <p v-if="!submissionFiles.length" class="lap-meta">{{ m.noAttachments }}</p>
        <ul v-else class="lap-attachments">
            <li v-for="att in submissionFiles" :key="att.id" class="lap-att-row">
              <span class="lap-att-icon" :class="`is-${iconKind(att)}`">{{ att.extension.toUpperCase() }}</span>
              <span class="lap-att-info">
                <span class="lap-att-name">{{ att.displayName }}</span>
                <span class="lap-meta">{{ fileSize(att.size) }}</span>
              </span>
              <button
                v-if="canPreview(att)"
                type="button"
                class="appeal-btn primary"
                :disabled="previewLoadingId === att.id"
                @click="openPreview(att)"
              >
                {{ previewLoadingId === att.id ? m.opening : m.view }}
              </button>
              <button type="button" class="appeal-btn" :disabled="downloadingId === att.id" @click="download(att)">
                {{ m.download }}
              </button>
            </li>
        </ul>
        <p v-if="downloadError" class="form-error">{{ downloadError }}</p>
      </section>

      <section class="lap-block">
        <h4>{{ m.actionsTitle }}</h4>
        <div class="lap-actions">
          <button
            v-if="detail.status === 'new'"
            type="button"
            class="appeal-btn"
            :disabled="busy"
            @click="changeStatus('in_review')"
          >
            {{ m.markInReview }}
          </button>
          <button
            v-if="detail.status !== 'closed'"
            type="button"
            class="appeal-btn"
            :disabled="busy"
            @click="changeStatus('closed')"
          >
            {{ m.markClosed }}
          </button>
        </div>

        <div v-if="handlerOptions.length" class="lap-assign">
          <label class="field">
            <span class="field-label">{{ m.assignTitle }}</span>
            <select v-model="assignedId" class="field-input">
              <option value="">{{ m.assignPlaceholder }}</option>
              <option v-for="h in handlerOptions" :key="h.id" :value="h.id">
                {{ h.fullName || `#${h.id}` }}
              </option>
            </select>
          </label>
          <button type="button" class="appeal-btn primary" :disabled="busy || assignedId === ''" @click="assign">
            {{ m.assignButton }}
          </button>
        </div>
        <p v-else-if="recipient && !recipient.handlers.length" class="lap-notice">{{ m.noHandlers }}</p>
      </section>

      <section class="lap-block">
        <h4>{{ m.responseTitle }}</h4>
        <p class="lap-rule">{{ m.responseRule }}</p>
        <div v-if="detail.response" class="lap-response">
          <p class="lap-text">{{ detail.response }}</p>
          <span class="lap-meta">{{ m.respondedAt }}: {{ formatDate(detail.respondedAt) }}</span>
        </div>

        <div v-if="responseFiles.length" class="lap-sent-files">
          <span class="lap-meta">{{ m.sentFiles }}</span>
          <ul class="lap-attachments">
            <li v-for="att in responseFiles" :key="att.id" class="lap-att-row">
              <span class="lap-att-icon" :class="`is-${iconKind(att)}`">{{ att.extension.toUpperCase() }}</span>
              <span class="lap-att-info">
                <span class="lap-att-name">{{ att.displayName }}</span>
                <span class="lap-meta">{{ fileSize(att.size) }} · {{ formatDate(att.createdAt) }}</span>
              </span>
              <button
                v-if="canPreview(att)"
                type="button"
                class="appeal-btn primary"
                :disabled="previewLoadingId === att.id"
                @click="openPreview(att)"
              >
                {{ previewLoadingId === att.id ? m.opening : m.view }}
              </button>
              <button type="button" class="appeal-btn" :disabled="downloadingId === att.id" @click="download(att)">
                {{ m.download }}
              </button>
            </li>
          </ul>
        </div>

        <form v-if="!isFinal" class="lap-response-form" @submit.prevent="responseConfirm = true">
          <textarea
            v-model="responseText"
            class="field-input lap-textarea"
            rows="4"
            :placeholder="m.responsePlaceholder"
          />

          <input
            ref="fileInput"
            type="file"
            class="lap-file-input"
            multiple
            :accept="fileAccept"
            @change="onFilesPicked"
          />
          <ul v-if="pendingFiles.length" class="lap-pending-files">
            <li v-for="(file, index) in pendingFiles" :key="`${file.name}-${index}`">
              <span class="lap-att-name">{{ file.name }}</span>
              <span class="lap-meta">{{ fileSize(file.size) }}</span>
              <button
                type="button"
                class="lap-pending-remove"
                :disabled="busy"
                :aria-label="m.removeFile"
                @click="removePending(index)"
              >
                ×
              </button>
            </li>
          </ul>
          <p class="lap-meta">{{ m.fileHint.replace('{left}', String(remainingSlots - pendingFiles.length)) }}</p>
          <p v-if="fileError" class="form-error">{{ fileError }}</p>

          <div v-if="!responseConfirm" class="lap-actions">
            <button
              type="button"
              class="appeal-btn"
              :disabled="busy || pendingFiles.length >= remainingSlots"
              @click="openFilePicker"
            >
              📎 {{ m.attachFile }}
            </button>
            <button type="submit" class="appeal-btn primary" :disabled="busy || !canSendResponse">
              {{ busy ? m.sending : m.sendResponse }}
            </button>
          </div>
          <div v-else class="lap-confirm" role="alertdialog" aria-live="assertive">
            <strong>{{ m.confirmTitle }}</strong>
            <p>{{ m.confirmHint }}</p>
            <p v-if="pendingFiles.length">{{ m.confirmFiles.replace('{count}', String(pendingFiles.length)) }}</p>
            <div class="lap-actions">
              <button type="button" class="appeal-btn primary" :disabled="busy" @click="sendResponse">
                {{ m.confirmSend }}
              </button>
              <button type="button" class="appeal-btn" @click="responseConfirm = false">{{ m.cancel }}</button>
            </div>
          </div>
        </form>
      </section>

      <section class="lap-block">
        <h4>{{ m.notesTitle }}</h4>
        <p class="lap-meta">{{ m.notesHint }}</p>
        <ul v-if="detail.notes.length" class="lap-notes">
          <li v-for="(note, index) in detail.notes" :key="index">
            <strong>{{ note.authorName || '—' }}</strong>
            <span class="lap-meta">{{ formatDate(note.createdAt) }}</span>
            <p v-if="note.kind === 'status_change'" class="lap-meta">
              {{ noteTitle(note.kind, note.oldValue, note.newValue) }}
            </p>
            <p v-else-if="note.text" class="lap-text">{{ note.text }}</p>
            <p v-else class="lap-meta">{{ noteTitle(note.kind, note.oldValue, note.newValue) }}</p>
          </li>
        </ul>
        <p v-else class="lap-meta">{{ m.noNotes }}</p>
        <form class="lap-response-form" @submit.prevent="addNote">
          <textarea v-model="noteText" class="field-input lap-textarea" rows="2" :placeholder="m.notePlaceholder" />
          <div class="lap-actions">
            <button type="submit" class="appeal-btn" :disabled="busy || !noteText.trim()">{{ m.addNote }}</button>
          </div>
        </form>
      </section>

      <p v-if="actionError" class="form-error">{{ actionError }}</p>
      <p v-else-if="actionOk" class="lap-ok">{{ actionOk }}</p>
    </template>

    <Teleport to="body">
      <div v-if="preview" class="lap-preview-backdrop" @click.self="closePreview">
        <div class="lap-preview" role="dialog" aria-modal="true" :aria-label="preview.attachment.displayName">
          <header class="lap-preview-head">
            <span class="lap-preview-title">
              <strong>{{ preview.attachment.displayName }}</strong>
              <span class="lap-meta">{{ fileSize(preview.attachment.size) }}</span>
            </span>
            <button type="button" class="appeal-btn" @click="downloadFromPreview">{{ m.download }}</button>
            <button type="button" class="lap-preview-close" :aria-label="m.close" @click="closePreview">×</button>
          </header>
          <div class="lap-preview-body">
            <img v-if="preview.kind === 'image'" :src="preview.url" :alt="preview.attachment.displayName" />
            <iframe v-else :src="preview.url" :title="preview.attachment.displayName" />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
