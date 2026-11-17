<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { extractApiError } from '@/services/http'
import { useAuthStore } from '@/stores/auth'
import { useLocaleStore } from '@/stores/locale'
import {
  previewKind,
  RESPONSE_FILE_EXTENSIONS,
  RESPONSE_FILE_MAX_BYTES,
  RESPONSE_FILES_MAX,
} from '@/stores/leadershipAppeals'
import {
  CLOSED_STATUSES,
  useCorruptionReportsStore,
  type OfficerCandidate,
  type ReportAttachment,
  type ReportDetail,
  type ReportNote,
  type ReportStatus,
} from '@/stores/corruptionReports'
import { formatDateTime } from '@/utils/formatDate'

/**
 * Bitta korrupsiya xabari (o'ng panel). Faqat tanlanganda mount qilinadi —
 * `GET /reports/{id}/` har chaqiruvda audit yozadi. Xabar beruvchining shaxsi
 * anonimlik rejimiga qarab ko'rsatiladi; javob va holat o'zgarishi botga boradi.
 */
const props = defineProps<{ reportId: number }>()

const authStore = useAuthStore()
const localeStore = useLocaleStore()
const store = useCorruptionReportsStore()
const m = computed(() => localeStore.m.corruption)
const lm = computed(() => localeStore.m.leadership)

const detail = ref<ReportDetail | null>(null)
const loading = ref(false)
const loadError = ref('')
const actionError = ref('')
const actionOk = ref('')
const busy = ref(false)

const pendingOutcome = ref<ReportStatus | null>(null)
const responseText = ref('')
const responseConfirm = ref(false)
const noteText = ref('')
const downloadingId = ref<number | null>(null)
const downloadError = ref('')

const officerQuery = ref('')
const officerResults = ref<OfficerCandidate[]>([])
const officerSearching = ref(false)
const officerError = ref('')

const preview = ref<{ attachment: ReportAttachment; url: string; kind: 'image' | 'pdf' } | null>(null)
const previewLoadingId = ref<number | null>(null)

const pendingFiles = ref<File[]>([])
const fileError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const submissionFiles = computed(() => detail.value?.attachments.filter((a) => a.direction !== 'response') ?? [])
const responseFiles = computed(() => detail.value?.attachments.filter((a) => a.direction === 'response') ?? [])
const remainingSlots = computed(() => Math.max(0, RESPONSE_FILES_MAX - responseFiles.value.length))
const canSendResponse = computed(() => Boolean(responseText.value.trim()) || pendingFiles.value.length > 0)
const fileAccept = RESPONSE_FILE_EXTENSIONS.map((e) => `.${e}`).join(',')

const status = computed(() => (detail.value?.status ?? 'new') as ReportStatus)
const isClosed = computed(() => CLOSED_STATUSES.includes(status.value))
const selfId = computed(() => Number(authStore.session?.id) || null)

/** 0 — yangi, 1 — ko'rib chiqilmoqda, 2 — tekshiruv, 3 — yakuniy xulosa. */
const currentStep = computed(() => {
  if (isClosed.value) return 3
  return { new: 0, under_review: 1, investigating: 2 }[status.value as 'new'] ?? 0
})
const trackSteps = computed(() => [
  m.value.trackNew,
  m.value.trackReview,
  m.value.trackInvestigating,
  isClosed.value ? statusLabel(status.value) : m.value.trackOutcome,
])

function stepClass(index: number): string {
  if (index < currentStep.value || (isClosed.value && index === 3)) return 'is-done'
  if (index === currentStep.value) return 'is-current'
  return ''
}

function statusLabel(value: string): string {
  return (m.value.statuses as Record<string, string>)[value] ?? value
}

function categoryLabel(value: string): string {
  return (m.value.categories as Record<string, string>)[value] ?? value
}

function anonymityLabel(value: string): string {
  return (m.value.anonymity as Record<string, string>)[value] ?? value
}

function privacyText(value: string): string {
  return (m.value.privacy as Record<string, string>)[value] ?? ''
}

function formatDate(iso: string | null | undefined): string {
  return iso ? formatDateTime(iso, localeStore.locale) : '—'
}

function formatDay(value: string | null): string {
  if (!value) return '—'
  const [y, mo, d] = value.split('-')
  return y && mo && d ? `${d}.${mo}.${y}` : value
}

function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function noteLine(note: ReportNote): string {
  if (note.kind === 'status_change') {
    return m.value.noteStatus
      .replace('{old}', statusLabel(note.oldValue ?? ''))
      .replace('{new}', statusLabel(note.newValue ?? ''))
  }
  if (note.kind === 'assignment') return note.newValue ? m.value.noteAssigned : m.value.noteUnassigned
  return note.text || note.kindDisplay || note.kind
}

/** Xabar beruvchi haqidagi qatorlar. To'liq anonimda backend hech narsa saqlamaydi. */
const reporterRows = computed(() => {
  const d = detail.value
  if (!d || d.anonymityMode === 'anonymous') return []
  const rows: { label: string; value: string }[] = []
  const name = d.reporterName || d.reporter?.fullName
  if (name) rows.push({ label: m.value.reporterName, value: name })
  if (d.contact) rows.push({ label: m.value.contact, value: d.contact })
  if (d.reporter?.hemisId) rows.push({ label: lm.value.hemisId, value: d.reporter.hemisId })
  if (d.reporter?.phone && d.reporter.phone !== d.contact) rows.push({ label: lm.value.phone, value: d.reporter.phone })
  return rows
})

async function load() {
  closePreview()
  pendingFiles.value = []
  fileError.value = ''
  pendingOutcome.value = null
  responseConfirm.value = false
  officerResults.value = []
  officerQuery.value = ''
  loading.value = true
  loadError.value = ''
  actionError.value = ''
  actionOk.value = ''
  try {
    detail.value = await store.fetchReport(props.reportId)
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
watch(() => props.reportId, load)
onBeforeUnmount(() => {
  closePreview()
  window.removeEventListener('keydown', onKeydown)
  window.clearTimeout(officerTimer)
})

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && preview.value) closePreview()
}

async function run(task: () => Promise<ReportDetail>): Promise<boolean> {
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

function changeStatus(next: ReportStatus) {
  void run(() => store.patchReport(props.reportId, { status: next }))
}

/** Yakuniy xulosa xabar beruvchiga botda darhol boradi — avval tasdiqlanadi. */
async function confirmOutcome() {
  const next = pendingOutcome.value
  if (!next) return
  const ok = await run(() => store.patchReport(props.reportId, { status: next }))
  if (ok) pendingOutcome.value = null
}

function assignTo(id: number | null) {
  officerResults.value = []
  officerQuery.value = ''
  void run(() => store.patchReport(props.reportId, { assigned_to: id }))
}

let officerTimer: number | undefined
watch(officerQuery, (value) => {
  window.clearTimeout(officerTimer)
  officerError.value = ''
  const q = value.trim()
  if (q.length < 2) {
    officerResults.value = []
    return
  }
  officerTimer = window.setTimeout(async () => {
    officerSearching.value = true
    try {
      officerResults.value = await store.searchOfficers(q)
    } catch (err) {
      officerError.value = extractApiError(err, m.value.officerSearchError)
    } finally {
      officerSearching.value = false
    }
  }, 400)
})

async function sendResponse() {
  const text = responseText.value.trim()
  responseConfirm.value = false
  if (!text && !pendingFiles.value.length) return
  busy.value = true
  actionError.value = ''
  actionOk.value = ''
  try {
    if (text) {
      detail.value = await store.patchReport(props.reportId, { response_to_reporter: text })
      responseText.value = ''
    }
    while (pendingFiles.value.length) {
      await store.uploadResponseFile(props.reportId, pendingFiles.value[0]!)
      pendingFiles.value = pendingFiles.value.slice(1)
    }
    actionOk.value = m.value.saved
  } catch (err) {
    actionError.value = extractApiError(err, m.value.actionError)
  } finally {
    try {
      detail.value = await store.fetchReport(props.reportId)
    } catch {
      /* eski holat qoladi — xato yuqorida ko'rsatilgan */
    }
    busy.value = false
  }
}

function openFilePicker() {
  fileInput.value?.click()
}

function onFilesPicked(event: Event) {
  const input = event.target as HTMLInputElement
  const picked = Array.from(input.files ?? [])
  input.value = ''
  fileError.value = ''
  for (const file of picked) {
    const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : ''
    if (!RESPONSE_FILE_EXTENSIONS.includes(ext)) {
      fileError.value = lm.value.fileTypeError.replace('{name}', file.name)
      continue
    }
    if (file.size > RESPONSE_FILE_MAX_BYTES) {
      fileError.value = lm.value.fileSizeError.replace('{name}', file.name)
      continue
    }
    if (pendingFiles.value.length >= remainingSlots.value) {
      fileError.value = lm.value.fileLimitError.replace('{max}', String(RESPONSE_FILES_MAX))
      break
    }
    pendingFiles.value = [...pendingFiles.value, file]
  }
}

function removePending(index: number) {
  pendingFiles.value = pendingFiles.value.filter((_, i) => i !== index)
}

async function openPreview(attachment: ReportAttachment) {
  const kind = previewKind(attachment.extension)
  if (!kind) return download(attachment)
  previewLoadingId.value = attachment.id
  downloadError.value = ''
  try {
    const url = await store.fetchAttachmentUrl(props.reportId, attachment)
    closePreview()
    preview.value = { attachment, url, kind }
  } catch (err) {
    downloadError.value = extractApiError(err, lm.value.downloadError)
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
  void store.downloadAttachment(props.reportId, preview.value.attachment, preview.value.url)
}

function canPreview(attachment: ReportAttachment): boolean {
  return previewKind(attachment.extension) !== null
}

function iconKind(attachment: ReportAttachment): string {
  return previewKind(attachment.extension) ?? 'file'
}

async function download(attachment: ReportAttachment) {
  downloadingId.value = attachment.id
  downloadError.value = ''
  try {
    await store.downloadAttachment(props.reportId, attachment)
  } catch (err) {
    downloadError.value = extractApiError(err, lm.value.downloadError)
  } finally {
    downloadingId.value = null
  }
}

async function addNote() {
  const text = noteText.value.trim()
  if (!text) return
  const ok = await run(() => store.addNote(props.reportId, text))
  if (ok) noteText.value = ''
}

const outcomes = computed(() =>
  (['confirmed', 'not_confirmed', 'rejected'] as ReportStatus[]).map((value) => ({
    value,
    label: statusLabel(value),
    hint: (m.value.outcomeHints as Record<string, string>)[value] ?? '',
  })),
)
</script>

<template>
  <div class="lap-detail-body">
    <p v-if="loading" class="appeal-empty">{{ m.detailLoading }}</p>
    <p v-else-if="loadError" class="form-error">{{ loadError }}</p>

    <template v-else-if="detail">
      <header class="lap-d-head">
        <div>
          <span class="lap-code">{{ detail.trackingCode }}</span>
          <h3 class="lap-d-title">{{ categoryLabel(detail.category) }}</h3>
          <span class="lap-meta">{{ m.received }}: {{ formatDate(detail.createdAt) }}</span>
        </div>
        <span class="cr-status" :class="`is-${detail.status}`">{{ statusLabel(detail.status) }}</span>
      </header>

      <ol class="lap-track cr-track" :class="isClosed ? `is-final-${detail.status}` : ''">
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

      <div class="cr-privacy" :class="`is-${detail.anonymityMode}`">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
        <div>
          <strong>{{ anonymityLabel(detail.anonymityMode) }}</strong>
          <span>{{ privacyText(detail.anonymityMode) }}</span>
        </div>
      </div>

      <div class="lap-detail-grid">
        <div class="lap-detail-item">
          <span>{{ m.incidentDate }}</span>
          <strong>{{ formatDay(detail.incidentDate) }}</strong>
        </div>
        <div class="lap-detail-item">
          <span>{{ m.incidentPlace }}</span>
          <strong>{{ detail.incidentPlace || '—' }}</strong>
        </div>
        <div class="lap-detail-item">
          <span>{{ m.department }}</span>
          <strong>{{ detail.departmentName || '—' }}</strong>
        </div>
        <div class="lap-detail-item">
          <span>{{ m.assignedTo }}</span>
          <strong>{{ detail.assignedToName || m.notAssigned }}</strong>
        </div>
        <div v-for="row in reporterRows" :key="row.label" class="lap-detail-item">
          <span>{{ row.label }}</span>
          <strong>{{ row.value }}</strong>
        </div>
      </div>

      <section class="lap-block">
        <h4>{{ m.accused }}</h4>
        <p class="lap-text cr-box">{{ detail.accusedPersons || '—' }}</p>
      </section>

      <section class="lap-block">
        <h4>{{ m.description }}</h4>
        <p class="lap-text">{{ detail.description || '—' }}</p>
      </section>

      <section class="lap-block">
        <h4>{{ lm.attachments }}</h4>
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
              {{ previewLoadingId === att.id ? lm.opening : lm.view }}
            </button>
            <button type="button" class="appeal-btn" :disabled="downloadingId === att.id" @click="download(att)">
              {{ lm.download }}
            </button>
          </li>
        </ul>
        <p v-if="downloadError" class="form-error">{{ downloadError }}</p>
      </section>

      <section class="lap-block cr-review">
        <h4>{{ m.reviewTitle }}</h4>
        <div class="lap-actions">
          <button
            v-if="detail.status === 'new'"
            type="button"
            class="appeal-btn primary"
            :disabled="busy"
            @click="changeStatus('under_review')"
          >
            {{ m.takeReview }}
          </button>
          <button
            v-if="detail.status === 'new' || detail.status === 'under_review'"
            type="button"
            class="appeal-btn"
            :class="{ primary: detail.status === 'under_review' }"
            :disabled="busy"
            @click="changeStatus('investigating')"
          >
            {{ m.startInvestigation }}
          </button>
          <button
            v-if="isClosed"
            type="button"
            class="appeal-btn"
            :disabled="busy"
            @click="changeStatus('under_review')"
          >
            {{ m.reopen }}
          </button>
        </div>

        <div class="cr-outcome-head">
          <span class="field-label">{{ m.outcomeTitle }}</span>
          <span class="lap-meta">{{ m.outcomeHint }}</span>
        </div>
        <div class="cr-outcomes">
          <button
            v-for="o in outcomes"
            :key="o.value"
            type="button"
            class="cr-outcome"
            :class="[`is-${o.value}`, { 'is-active': detail.status === o.value || pendingOutcome === o.value }]"
            :aria-pressed="detail.status === o.value"
            :disabled="busy || detail.status === o.value"
            @click="pendingOutcome = o.value"
          >
            <strong>{{ o.label }}</strong>
            <span>{{ o.hint }}</span>
          </button>
        </div>
        <div v-if="pendingOutcome" class="lap-confirm" role="alertdialog" aria-live="assertive">
          <strong>{{ m.outcomeConfirmTitle.replace('{status}', statusLabel(pendingOutcome)) }}</strong>
          <p>{{ m.outcomeConfirmHint }}</p>
          <div class="lap-actions">
            <button type="button" class="appeal-btn primary" :disabled="busy" @click="confirmOutcome">
              {{ m.outcomeConfirm }}
            </button>
            <button type="button" class="appeal-btn" @click="pendingOutcome = null">{{ lm.cancel }}</button>
          </div>
        </div>

        <div class="cr-assign">
          <span class="field-label">{{ m.assignTitle }}</span>
          <div class="lap-actions">
            <button
              v-if="selfId && detail.assignedTo !== selfId"
              type="button"
              class="appeal-btn"
              :disabled="busy"
              @click="assignTo(selfId)"
            >
              {{ m.assignSelf }}
            </button>
            <button
              v-if="detail.assignedTo"
              type="button"
              class="appeal-btn"
              :disabled="busy"
              @click="assignTo(null)"
            >
              {{ m.unassign }}
            </button>
          </div>
          <label class="field">
            <span class="field-label">{{ m.assignSearch }}</span>
            <input v-model="officerQuery" type="search" class="field-input" :placeholder="m.assignSearchPlaceholder" />
          </label>
          <p v-if="officerSearching" class="lap-meta">{{ m.searching }}</p>
          <p v-else-if="officerError" class="form-error">{{ officerError }}</p>
          <ul v-else-if="officerResults.length" class="cr-officers">
            <li v-for="o in officerResults" :key="o.id">
              <span class="cr-officer-info">
                <strong>{{ o.fullName }}</strong>
                <span class="lap-meta">{{ [o.roleDisplay, o.departmentName].filter(Boolean).join(' · ') }}</span>
              </span>
              <button type="button" class="appeal-btn primary" :disabled="busy" @click="assignTo(o.id)">
                {{ m.assignButton }}
              </button>
            </li>
          </ul>
          <p class="lap-meta">{{ m.assignHint }}</p>
        </div>
      </section>

      <section class="lap-block">
        <h4>{{ m.responseTitle }}</h4>
        <p class="lap-rule">{{ m.responseRule }}</p>
        <div v-if="detail.responseToReporter" class="lap-response">
          <p class="lap-text">{{ detail.responseToReporter }}</p>
          <span class="lap-meta">{{ lm.respondedAt }}: {{ formatDate(detail.respondedAt) }}</span>
        </div>

        <div v-if="responseFiles.length" class="lap-sent-files">
          <span class="lap-meta">{{ lm.sentFiles }}</span>
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
                {{ previewLoadingId === att.id ? lm.opening : lm.view }}
              </button>
              <button type="button" class="appeal-btn" :disabled="downloadingId === att.id" @click="download(att)">
                {{ lm.download }}
              </button>
            </li>
          </ul>
        </div>

        <form class="lap-response-form" @submit.prevent="responseConfirm = true">
          <textarea
            v-model="responseText"
            class="field-input lap-textarea"
            rows="4"
            :aria-label="m.responseTitle"
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
                :aria-label="lm.removeFile"
                @click="removePending(index)"
              >
                ×
              </button>
            </li>
          </ul>
          <p class="lap-meta">{{ lm.fileHint.replace('{left}', String(remainingSlots - pendingFiles.length)) }} {{ m.filesBotOnly }}</p>
          <p v-if="fileError" class="form-error">{{ fileError }}</p>

          <div v-if="!responseConfirm" class="lap-actions">
            <button
              type="button"
              class="appeal-btn"
              :disabled="busy || pendingFiles.length >= remainingSlots"
              @click="openFilePicker"
            >
              📎 {{ lm.attachFile }}
            </button>
            <button type="submit" class="appeal-btn primary" :disabled="busy || !canSendResponse">
              {{ busy ? lm.sending : m.sendResponse }}
            </button>
          </div>
          <div v-else class="lap-confirm" role="alertdialog" aria-live="assertive">
            <strong>{{ m.responseConfirmTitle }}</strong>
            <p>{{ m.responseConfirmHint }}</p>
            <p v-if="pendingFiles.length">{{ lm.confirmFiles.replace('{count}', String(pendingFiles.length)) }}</p>
            <div class="lap-actions">
              <button type="button" class="appeal-btn primary" :disabled="busy" @click="sendResponse">
                {{ lm.confirmSend }}
              </button>
              <button type="button" class="appeal-btn" @click="responseConfirm = false">{{ lm.cancel }}</button>
            </div>
          </div>
        </form>
      </section>

      <section class="lap-block">
        <div class="lap-block-head">
          <h4>{{ m.notesTitle }}</h4>
          <span class="lap-meta">{{ m.notesHint }}</span>
        </div>
        <ul v-if="detail.notes.length" class="lap-notes">
          <li v-for="(note, index) in detail.notes" :key="index" :class="`cr-note is-${note.kind}`">
            <strong>{{ note.authorName || '—' }}</strong>
            <span class="lap-meta">{{ formatDate(note.createdAt) }}</span>
            <p :class="note.kind === 'note' || note.kind === 'response' ? 'lap-text' : 'lap-meta'">
              <template v-if="note.kind === 'response'">{{ m.noteResponse }}: </template>{{ noteLine(note) }}
            </p>
          </li>
        </ul>
        <p v-else class="lap-meta">{{ m.noNotes }}</p>
        <form class="lap-response-form" @submit.prevent="addNote">
          <textarea
            v-model="noteText"
            class="field-input lap-textarea"
            rows="2"
            :aria-label="m.notesTitle"
            :placeholder="m.notePlaceholder"
          />
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
            <button type="button" class="appeal-btn" @click="downloadFromPreview">{{ lm.download }}</button>
            <button type="button" class="lap-preview-close" :aria-label="lm.close" @click="closePreview">×</button>
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
