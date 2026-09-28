<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import DashboardLayout from '@/components/DashboardLayout.vue'
import RequestStatusTracker from '@/components/RequestStatusTracker.vue'
import MyKpiPanel from '@/components/MyKpiPanel.vue'
import { extractApiError, isForbidden } from '@/services/http'
import { useAuthStore } from '@/stores/auth'
import { useRequestsStore, type RequestDetail, type RequestListItem, type RequestStatus } from '@/stores/requests'
import { useStaffStore } from '@/stores/staff'
import { useRolesStore } from '@/stores/roles'
import { useLocaleStore } from '@/stores/locale'
import { formatDateTime } from '@/utils/formatDate'

const route = useRoute()
const authStore = useAuthStore()
const requestsStore = useRequestsStore()
const staffStore = useStaffStore()
const rolesStore = useRolesStore()
const localeStore = useLocaleStore()
const m = computed(() => localeStore.m)

type Filter = 'all' | RequestStatus
const filter = ref<Filter>('all')
const assignedToMe = ref(false)
/** `?unassigned=true` — "rol navbati": hali hech kim ishga olmagan murojaatlar. */
const unassignedOnly = ref(false)

const visibleRequests = computed(() => {
  if (filter.value === 'all') return requestsStore.requests
  return requestsStore.requests.filter((r) => r.status === filter.value)
})

function toggleAssignedToMe() {
  assignedToMe.value = !assignedToMe.value
  // Ikkalasi bir vaqtda ma'noga ega emas: "menga tayinlangan" va "hech kimga
  // tayinlanmagan" bir-birini istisno qiladi.
  if (assignedToMe.value) unassignedOnly.value = false
  void requestsStore.fetchRequests({
    assignedToMe: assignedToMe.value,
    unassigned: unassignedOnly.value,
  })
}

function toggleUnassigned() {
  unassignedOnly.value = !unassignedOnly.value
  if (unassignedOnly.value) assignedToMe.value = false
  void requestsStore.fetchRequests({
    assignedToMe: assignedToMe.value,
    unassigned: unassignedOnly.value,
  })
}

/** Bildirishnomalar panelidan bosilganda (`AppHeader.vue`) `?request=<id>` query
 *  parametri bilan shu sahifaga o'tkaziladi — murojaatlar ro'yxati yuklangach,
 *  aynan o'sha murojaat kartasi avtomatik ochiladi va ko'rinadigan qismga
 *  aylantiriladi (staff ko'rinishida filtr "Barchasi"ga qaytariladi, aks holda
 *  murojaat joriy filtr tabida ko'rinmasligi mumkin edi). */
async function openFromNotification() {
  const requestIdParam = route.query.request
  if (!requestIdParam) return

  const id = Number(requestIdParam)
  if (Number.isNaN(id)) return

  filter.value = 'all'
  // Har qanday server-taraf filtr ochilishi kerak bo'lgan murojaatni ro'yxatdan
  // chiqarib yuborishi mumkin — shu sabab hammasi tozalanadi.
  if (assignedToMe.value || unassignedOnly.value) {
    assignedToMe.value = false
    unassignedOnly.value = false
    await requestsStore.fetchRequests({ assignedToMe: false, unassigned: false })
  }
  expandedId.value = id
  await loadDetail(id)
  await nextTick()
  document.getElementById(`request-card-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

onMounted(async () => {
  await requestsStore.fetchRequests()
  if (authStore.isStaff) {
    staffStore.fetchDepartments()
    // Rolga yo'naltirish tanlovi uchun — faqat shu ruxsat bo'lsa.
    if (authStore.canDispatchRequests && !rolesStore.roles.length) void rolesStore.fetchRoles()
  }
  await openFromNotification()
})

/** Foydalanuvchi allaqachon shu sahifada turib yana bir bildirishnomaga bossa,
 *  Vue Router komponent nusxasini qayta ishlatadi (`onMounted` qayta chaqirilmaydi)
 *  — shu sabab `request` query o'zgarishini alohida kuzatib turish kerak. */
watch(() => route.query.request, (value) => {
  if (value) void openFromNotification()
})

/** Murojaat hali ochiq bo'lsa, backend kechikishni "hozir"ga qarab hisoblaydi — bu
 * to'g'ri. Lekin murojaat allaqachon yopilgan (bajarilgan/rad etilgan/bekor qilingan)
 * bo'lsa ham, backend buni hamon "hozir"ga qarab hisoblab, muddatidan OLDIN bajarilgan
 * murojaatni ham "kechikkan" deb ko'rsatib qo'yayotgan edi — ya'ni bajarilgandan keyin
 * ham vaqt hisoblanishda davom etardi. Yopilgan murojaat uchun kechikishni endi yopilgan
 * payt (`resolved_at`) bilan muddat (`sla_deadline`)ni solishtirib, o'zimiz aniqlaymiz. */
function isRequestOverdue(item: RequestListItem): boolean {
  if (item.resolved_at && item.sla_deadline) {
    return new Date(item.resolved_at).getTime() > new Date(item.sla_deadline).getTime()
  }
  return item.is_overdue
}

/** Faqat haqiqatan MUVAFFAQIYATLI bajarilgan (`completed`) murojaat "yakunlandi"
 * (yashil) deb hisoblanadi — rad etilgan yoki bekor qilingan murojaat, garchi
 * "kechikmagan" bo'lsa ham, muvaffaqiyatli bajarilgan hisoblanmaydi (buning uchun
 * pastda alohida "rad etilgan" ko'rinishi bor). */
function isRequestCompletedOnTime(item: RequestListItem): boolean {
  return item.status === 'completed' && !isRequestOverdue(item)
}

/* ---------- Talaba: kengaytirilgan tafsilot (hujjat yuklab olish, baholash) ---------- */

const expandedId = ref<number | null>(null)
const detailCache = ref<Record<number, RequestDetail>>({})
const detailLoading = ref(false)
const expandedDetail = computed(() =>
  expandedId.value !== null ? detailCache.value[expandedId.value] : undefined,
)

const detailErrorMsg = ref<Record<number, string>>({})

async function loadDetail(id: number) {
  detailLoading.value = true
  detailErrorMsg.value = { ...detailErrorMsg.value, [id]: '' }
  try {
    detailCache.value[id] = await requestsStore.fetchRequestDetail(id)
  } catch (err) {
    detailErrorMsg.value = {
      ...detailErrorMsg.value,
      [id]: extractApiError(err, m.value.appeals.detailLoadError),
    }
  } finally {
    detailLoading.value = false
  }
}

async function toggleExpand(id: number) {
  if (expandedId.value === id) {
    expandedId.value = null
    return
  }
  expandedId.value = id
  if (!detailCache.value[id]) {
    await loadDetail(id)
  }
}

async function refreshDetailIfExpanded(id: number) {
  if (expandedId.value === id) {
    await loadDetail(id)
  } else {
    delete detailCache.value[id]
  }
}

const downloadErrorMsg = ref<Record<number, string>>({})

async function download(requestId: number, docId: number, fileName: string) {
  downloadErrorMsg.value = { ...downloadErrorMsg.value, [requestId]: '' }
  try {
    await requestsStore.downloadDocument(requestId, docId, fileName)
  } catch (err) {
    downloadErrorMsg.value = {
      ...downloadErrorMsg.value,
      [requestId]: extractApiError(err, m.value.appeals.documentDownloadError),
    }
  }
}

const ratingStars = ref(5)
const ratingComment = ref('')
const ratingSubmitting = ref(false)
const ratingErrorMsg = ref('')

async function submitRating(requestId: number) {
  ratingSubmitting.value = true
  ratingErrorMsg.value = ''
  try {
    await requestsStore.rateRequest(requestId, ratingStars.value, ratingComment.value.trim())
    ratingComment.value = ''
    await loadDetail(requestId)
  } catch (err) {
    ratingErrorMsg.value = extractApiError(err, m.value.appeals.ratingError)
  } finally {
    ratingSubmitting.value = false
  }
}

/* ---------- Talaba: o'z murojaatini bekor qilish (faqat 'Yangi' holatda) ---------- */

const cancellingId = ref<number | null>(null)
const cancelReason = ref('')
const cancelSubmitting = ref(false)
const cancelErrorMsg = ref('')

function openCancel(id: number) {
  cancellingId.value = cancellingId.value === id ? null : id
  cancelReason.value = ''
  cancelErrorMsg.value = ''
}

async function confirmCancel(id: number) {
  cancelSubmitting.value = true
  cancelErrorMsg.value = ''
  try {
    await requestsStore.cancelRequest(id, cancelReason.value.trim())
    cancellingId.value = null
  } catch (err) {
    cancelErrorMsg.value = extractApiError(err, m.value.appeals.actionError)
  } finally {
    cancelSubmitting.value = false
  }
}

/* ---------- Xodim: holat o'zgartirish / yo'naltirish ---------- */

const redirectingId = ref<number | null>(null)
const redirectDept = ref<number | ''>('')
const actionBusyId = ref<number | null>(null)
const actionErrorMsg = ref<Record<number, string>>({})

function clearActionError(id: number) {
  actionErrorMsg.value = { ...actionErrorMsg.value, [id]: '' }
}

async function takeInProgress(id: number) {
  actionBusyId.value = id
  clearActionError(id)
  try {
    await requestsStore.updateStatus(id, 'in_progress')
    await refreshDetailIfExpanded(id)
  } catch (err) {
    actionErrorMsg.value = { ...actionErrorMsg.value, [id]: extractApiError(err, m.value.appeals.actionError) }
  } finally {
    actionBusyId.value = null
  }
}

const completingId = ref<number | null>(null)
const completeComment = ref('')

function openComplete(id: number) {
  completingId.value = completingId.value === id ? null : id
  completeComment.value = ''
  rejectingId.value = null
  redirectingId.value = null
  clearActionError(id)
}

async function confirmComplete(id: number) {
  actionBusyId.value = id
  clearActionError(id)
  try {
    await requestsStore.updateStatus(id, 'completed', { comment: completeComment.value.trim() || undefined })
    completingId.value = null
    await refreshDetailIfExpanded(id)
  } catch (err) {
    actionErrorMsg.value = { ...actionErrorMsg.value, [id]: extractApiError(err, m.value.appeals.actionError) }
  } finally {
    actionBusyId.value = null
  }
}

const rejectingId = ref<number | null>(null)
const rejectReason = ref('')

function openReject(id: number) {
  rejectingId.value = rejectingId.value === id ? null : id
  rejectReason.value = ''
  completingId.value = null
  redirectingId.value = null
  clearActionError(id)
}

async function confirmReject(id: number) {
  if (!rejectReason.value.trim()) return
  actionBusyId.value = id
  clearActionError(id)
  try {
    await requestsStore.updateStatus(id, 'rejected', { rejection_reason: rejectReason.value.trim() })
    rejectingId.value = null
    await refreshDetailIfExpanded(id)
  } catch (err) {
    actionErrorMsg.value = { ...actionErrorMsg.value, [id]: extractApiError(err, m.value.appeals.actionError) }
  } finally {
    actionBusyId.value = null
  }
}

function openRedirect(id: number) {
  redirectingId.value = redirectingId.value === id ? null : id
  redirectDept.value = ''
  completingId.value = null
  rejectingId.value = null
  clearActionError(id)
}

const uploadingDocId = ref<number | null>(null)
const uploadSuccessId = ref<number | null>(null)
const uploadErrorMsg = ref<Record<number, string>>({})

async function onDocumentFileChange(event: Event, requestId: number) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploadingDocId.value = requestId
  uploadErrorMsg.value = { ...uploadErrorMsg.value, [requestId]: '' }
  try {
    await requestsStore.uploadDocument(requestId, file)
    uploadSuccessId.value = requestId
    await refreshDetailIfExpanded(requestId)
    window.setTimeout(() => {
      if (uploadSuccessId.value === requestId) uploadSuccessId.value = null
    }, 2500)
  } catch (err) {
    uploadErrorMsg.value = {
      ...uploadErrorMsg.value,
      [requestId]: extractApiError(err, m.value.appeals.documentUploadError),
    }
  } finally {
    uploadingDocId.value = null
    input.value = ''
  }
}

/**
 * "Rolga yo'naltirish" — `POST /requests/<id>/route/`. Bo'limga yo'naltiruvchi
 * `redirect/` dan farqli: murojaat boshqa ROL navbatiga o'tkaziladi.
 * Rol tanlanmasa backend xizmatning marshrut qoidalari bo'yicha o'zi tanlaydi.
 * Faqat `dispatch_requests` ruxsati bor xodimga ko'rinadi.
 */
const routingId = ref<number | null>(null)
const routeRole = ref<number | ''>('')

/**
 * Yo'naltirish (`/route/`, `/redirect/`) amallarida 403 — bu ruxsat yo'qligi
 * emas, murojaat xodimning vakolat doirasidan (`request_scope`) tashqarida
 * ekani. Backend `detail` yuborsa aynan u ko'rsatiladi, aks holda umumiy
 * "amal bajarilmadi" o'rniga aniq tushuntirish beriladi.
 */
function dispatchErrorText(err: unknown): string {
  return extractApiError(
    err,
    isForbidden(err) ? m.value.appeals.forbiddenScope : m.value.appeals.actionError,
  )
}

function startRoute(id: number) {
  routingId.value = id
  routeRole.value = ''
  clearActionError(id)
}

async function confirmRoute(id: number) {
  actionBusyId.value = id
  clearActionError(id)
  try {
    await requestsStore.routeRequest(id, { role: routeRole.value === '' ? null : Number(routeRole.value) })
    routingId.value = null
    await refreshDetailIfExpanded(id)
  } catch (err) {
    actionErrorMsg.value = { ...actionErrorMsg.value, [id]: dispatchErrorText(err) }
  } finally {
    actionBusyId.value = null
  }
}

async function confirmRedirect(id: number) {
  if (!redirectDept.value) return
  actionBusyId.value = id
  clearActionError(id)
  try {
    await requestsStore.redirectRequest(id, Number(redirectDept.value))
    redirectingId.value = null
    await refreshDetailIfExpanded(id)
  } catch (err) {
    actionErrorMsg.value = { ...actionErrorMsg.value, [id]: dispatchErrorText(err) }
  } finally {
    actionBusyId.value = null
  }
}

function formatDate(iso: string) {
  return formatDateTime(iso, localeStore.locale)
}

function documentLanguageLabel(lang: string) {
  return (m.value.profile.languageValues as Record<string, string>)[lang] ?? lang
}
</script>

<template>
  <DashboardLayout>
    <!-- ===== Xodim ko'rinishi ===== -->
    <template v-if="authStore.isStaff">
      <h1>{{ m.appeals.staffTitle }}</h1>
      <p class="services-subtitle">{{ m.appeals.staffSubtitle }}</p>

      <!-- SuperAdmin odatda murojaatlarga shaxsan javob beradigan (operator)
           xodim emas, shu sabab uning shaxsiy `my-kpi` paneli har doim bo'sh
           (hammasi 0) chiqardi va "KPI ishlamayapti" degan taassurot qoldirardi.
           Statistika sahifasida bu panel SuperAdmin uchun allaqachon
           yashirilgan — bu yerda ham xuddi shunday. SuperAdmin barcha
           xodimlarning ko'rsatkichlarini Statistika → "Xodimlar reytingi"
           bo'limida to'liq ko'radi. -->
      <MyKpiPanel v-if="!authStore.isSuperAdmin" standalone class="appeals-kpi-panel" />

      <div class="services-tabs">
        <button class="btn service-tab-btn" :class="{ active: filter === 'all' }" @click="filter = 'all'">
          {{ m.appeals.filterAll }}
        </button>
        <button class="btn service-tab-btn" :class="{ active: filter === 'new' }" @click="filter = 'new'">
          {{ m.appeals.statuses.new }}
        </button>
        <button class="btn service-tab-btn" :class="{ active: filter === 'in_progress' }" @click="filter = 'in_progress'">
          {{ m.appeals.statuses.in_progress }}
        </button>
        <button class="btn service-tab-btn" :class="{ active: filter === 'redirected' }" @click="filter = 'redirected'">
          {{ m.appeals.statuses.redirected }}
        </button>
        <button class="btn service-tab-btn" :class="{ active: filter === 'completed' }" @click="filter = 'completed'">
          {{ m.appeals.statuses.completed }}
        </button>
        <button class="btn service-tab-btn" :class="{ active: filter === 'rejected' }" @click="filter = 'rejected'">
          {{ m.appeals.statuses.rejected }}
        </button>
        <button class="btn service-tab-btn" :class="{ active: filter === 'expired' }" @click="filter = 'expired'">
          {{ m.appeals.statuses.expired }}
        </button>
        <button class="btn service-tab-btn" :class="{ active: filter === 'cancelled' }" @click="filter = 'cancelled'">
          {{ m.appeals.statuses.cancelled }}
        </button>
        <button
          class="btn service-tab-btn"
          :class="{ active: assignedToMe }"
          type="button"
          @click="toggleAssignedToMe"
        >
          {{ m.appeals.assignedToMe }}
        </button>
        <!-- "Rol navbati": hali hech kim ishga olmagan murojaatlar
             (backend: ?unassigned=true). -->
        <button
          class="btn service-tab-btn"
          :class="{ active: unassignedOnly }"
          type="button"
          @click="toggleUnassigned"
        >
          {{ m.appeals.unassignedQueue }}
        </button>
      </div>

      <p v-if="requestsStore.error" class="form-error">{{ requestsStore.error }}</p>
      <p v-else-if="!requestsStore.loading && !visibleRequests.length" class="appeal-empty">{{ m.appeals.empty }}</p>

      <TransitionGroup tag="div" name="req-card" class="appeal-list">
        <article
          v-for="(item, index) in visibleRequests"
          :id="`request-card-${item.id}`"
          :key="item.id"
          class="appeal-card"
          :style="{ '--i': index }"
        >
          <button class="req-card-toggle" type="button" @click="toggleExpand(item.id)">
            <div class="appeal-card-head">
              <div>
                <h3>{{ item.service_name }}</h3>
                <p class="appeal-meta">
                  <span class="req-meta-pill">
                    <svg viewBox="0 0 24 24"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4 0-8 2-8 5v2h16v-2c0-3-4-5-8-5Z" /></svg>
                    {{ item.student_name }}
                  </span>
                  <span class="req-meta-pill">{{ item.request_number }}</span>
                  <span class="req-meta-pill">
                    <svg viewBox="0 0 24 24"><path d="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7ZM5 9h14v11H5V9Z" /></svg>
                    {{ formatDate(item.created_at) }}
                  </span>
                  <!-- `operator_name`/`assigned_role_name` endi ro'yxat javobida
                       ham keladi — kartani ochmasdan ko'rinadi. Mas'ul yo'q bo'lsa
                       qaysi rol navbatida turgani ko'rsatiladi. -->
                  <span v-if="item.operator_name" class="req-meta-pill">
                    <svg viewBox="0 0 24 24"><path d="M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /><path d="M4 21v-1c0-3.3 3.6-6 8-6s8 2.7 8 6v1H4Z" /></svg>
                    {{ item.operator_name }}
                  </span>
                  <span v-else-if="item.assigned_role_name" class="req-meta-pill is-queue">
                    {{ m.appeals.roleQueue }}: {{ item.assigned_role_name }}
                  </span>
                </p>
              </div>
              <span class="req-status-badge" :style="{ background: item.status_color }">
                {{ item.status_display }}
              </span>
            </div>
          </button>

          <RequestStatusTracker
            :status="item.status"
            :sla-percent="item.sla_percent"
            :is-overdue="isRequestOverdue(item)"
            :is-completed-on-time="isRequestCompletedOnTime(item)"
            :sla-deadline="item.sla_deadline"
          />

          <div v-if="expandedId === item.id" class="req-detail-panel">
            <p v-if="detailLoading && !expandedDetail" class="req-detail-loading">{{ m.appeals.loadingDetail }}</p>
            <p v-if="detailErrorMsg[item.id]" class="form-error">{{ detailErrorMsg[item.id] }}</p>

            <template v-else-if="expandedDetail">
              <div class="req-detail-grid">
                <div class="req-detail-item">
                  <span class="field-label">{{ m.appeals.responsibleStaff }}</span>
                  <strong>{{ expandedDetail.operator_name || m.appeals.notAssigned }}</strong>
                </div>
                <!-- "Ish kimga tushdi" — bu "kim ko'radi" degani EMAS.
                     Ko'rinish rolning `request_scope`i bilan belgilanadi. -->
                <div v-if="expandedDetail.assigned_role_name" class="req-detail-item">
                  <span class="field-label">{{ m.appeals.assignedRole }}</span>
                  <strong>{{ expandedDetail.assigned_role_name }}</strong>
                </div>
                <div v-if="expandedDetail.service_route" class="req-detail-item">
                  <span class="field-label">{{ m.appeals.serviceRoute }}</span>
                  <strong>
                    {{ expandedDetail.service_route.role_name }}
                    <template v-if="expandedDetail.service_route.department_name">
                      · {{ expandedDetail.service_route.department_name }}
                    </template>
                  </strong>
                </div>
                <div class="req-detail-item">
                  <span class="field-label">{{ m.appeals.studentHemisId }}</span>
                  <strong>{{ expandedDetail.student_hemis_id }}</strong>
                </div>
                <div class="req-detail-item">
                  <span class="field-label">{{ m.appeals.documentLanguage }}</span>
                  <strong>{{ documentLanguageLabel(expandedDetail.document_language) }}</strong>
                </div>
                <div class="req-detail-item">
                  <span class="field-label">{{ m.appeals.fileFormat }}</span>
                  <strong>{{ expandedDetail.file_format === 'pdf' ? 'PDF' : 'Excel' }}</strong>
                </div>
              </div>

              <p v-if="expandedDetail.notes" class="appeal-message">{{ expandedDetail.notes }}</p>
              <p v-if="expandedDetail.status === 'rejected' && expandedDetail.rejection_reason" class="form-error">
                {{ m.appeals.rejectionReasonLabel }}: {{ expandedDetail.rejection_reason }}
              </p>

              <div v-if="expandedDetail.documents.length" class="req-documents">
                <button
                  v-for="doc in expandedDetail.documents"
                  :key="doc.id"
                  type="button"
                  class="appeal-btn primary req-doc-btn"
                  @click="download(item.id, doc.id, doc.file_name)"
                >
                  <svg viewBox="0 0 24 24"><path d="M5 20h14v-2H5v2ZM13 4h-2v9.17L7.5 9.67 6.09 11.08 12 17l5.91-5.92L16.5 9.67 13 13.17V4Z" /></svg>
                  {{ doc.file_name }}
                </button>
              </div>
              <p v-if="downloadErrorMsg[item.id]" class="form-error">{{ downloadErrorMsg[item.id] }}</p>

              <div v-if="expandedDetail.history.length" class="req-history">
                <h4>{{ m.appeals.historyTitle }}</h4>
                <div v-for="entry in expandedDetail.history" :key="entry.id" class="req-history-entry">
                  <span class="req-history-status">{{ entry.old_status_display }} → {{ entry.new_status_display }}</span>
                  <span class="req-history-meta">{{ entry.changed_by_name }} · {{ formatDate(entry.changed_at) }}</span>
                  <p v-if="entry.comment" class="req-history-comment">{{ entry.comment }}</p>
                </div>
              </div>
            </template>
          </div>

          <div class="appeal-card-foot">
            <span class="appeal-tag">{{ item.department_name }}</span>
            <div class="appeal-actions">
              <button
                v-if="item.status === 'new' || item.status === 'redirected'"
                class="btn appeal-btn"
                :disabled="actionBusyId === item.id"
                @click="takeInProgress(item.id)"
              >
                {{ m.appeals.take }}
              </button>
              <button
                v-if="item.status === 'new' || item.status === 'in_progress' || item.status === 'redirected'"
                class="btn appeal-btn"
                :disabled="actionBusyId === item.id"
                @click="openRedirect(item.id)"
              >
                {{ m.appeals.redirect }}
              </button>
              <!-- Rolga yo'naltirish — faqat `dispatch_requests` ruxsati bilan.
                   Ekran roli NOMIGA emas, RUXSATGA qarab boshqariladi. -->
              <button
                v-if="authStore.canDispatchRequests && item.status !== 'completed' && item.status !== 'cancelled'"
                class="btn appeal-btn"
                :disabled="actionBusyId === item.id"
                @click="startRoute(item.id)"
              >
                {{ m.appeals.routeToRole }}
              </button>
              <button
                v-if="item.status === 'in_progress'"
                class="btn appeal-btn"
                :disabled="actionBusyId === item.id"
                @click="openReject(item.id)"
              >
                {{ m.appeals.reject }}
              </button>
              <label v-if="item.status === 'in_progress'" class="btn appeal-btn req-attach-btn">
                {{ uploadingDocId === item.id ? m.appeals.loadingDetail : m.appeals.attachDocument }}
                <input
                  type="file"
                  class="visually-hidden"
                  :disabled="uploadingDocId === item.id"
                  @change="onDocumentFileChange($event, item.id)"
                />
              </label>
              <button
                v-if="item.status === 'in_progress'"
                class="btn appeal-btn primary"
                :disabled="actionBusyId === item.id"
                @click="openComplete(item.id)"
              >
                {{ m.appeals.markResolved }}
              </button>
            </div>
          </div>

          <p v-if="uploadSuccessId === item.id" class="form-success">{{ m.appeals.documentUploaded }}</p>
          <p v-if="uploadErrorMsg[item.id]" class="form-error">{{ uploadErrorMsg[item.id] }}</p>
          <p v-if="actionErrorMsg[item.id]" class="form-error">{{ actionErrorMsg[item.id] }}</p>

          <div v-if="rejectingId === item.id" class="req-redirect-box">
            <input
              v-model="rejectReason"
              type="text"
              class="field-input"
              :placeholder="m.appeals.rejectReasonPlaceholder"
            />
            <button
              class="submit-btn req-redirect-confirm"
              :disabled="!rejectReason.trim() || actionBusyId === item.id"
              @click="confirmReject(item.id)"
            >
              {{ m.appeals.confirm }}
            </button>
          </div>

          <div v-if="completingId === item.id" class="req-redirect-box">
            <input
              v-model="completeComment"
              type="text"
              class="field-input"
              :placeholder="m.appeals.completeCommentPlaceholder"
            />
            <button
              class="submit-btn req-redirect-confirm"
              :disabled="actionBusyId === item.id"
              @click="confirmComplete(item.id)"
            >
              {{ m.appeals.confirm }}
            </button>
          </div>

          <div v-if="redirectingId === item.id" class="req-redirect-box">
            <span class="select-wrap">
              <select v-model="redirectDept" class="field-input">
                <option value="">{{ m.appeals.selectDepartment }}</option>
                <optgroup
                  v-for="group in staffStore.departmentGroups"
                  :key="group.label || 'other'"
                  :label="group.label || m.staff.departmentOtherGroup"
                >
                  <option v-for="d in group.items" :key="d.id" :value="d.id">{{ d.name_uz }}</option>
                </optgroup>
              </select>
              <svg class="select-arrow" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
            </span>
            <button class="submit-btn req-redirect-confirm" :disabled="!redirectDept" @click="confirmRedirect(item.id)">
              {{ m.appeals.confirm }}
            </button>
          </div>

          <!-- Rolga yo'naltirish: rol tanlanmasa backend marshrut qoidalari
               bo'yicha o'zi tanlaydi, shu sabab tugma har doim faol. -->
          <div v-if="routingId === item.id" class="req-redirect-box">
            <span class="select-wrap">
              <select v-model="routeRole" class="field-input">
                <option value="">{{ m.appeals.routeAutoOption }}</option>
                <option v-for="role in rolesStore.roles" :key="role.id" :value="role.id">{{ role.name }}</option>
              </select>
              <svg class="select-arrow" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
            </span>
            <button class="submit-btn req-redirect-confirm" :disabled="actionBusyId === item.id" @click="confirmRoute(item.id)">
              {{ m.appeals.confirm }}
            </button>
          </div>
        </article>
      </TransitionGroup>
    </template>

    <!-- ===== Talaba ko'rinishi ===== -->
    <template v-else>
      <h1>{{ m.appeals.studentTitle }}</h1>
      <p class="services-subtitle">{{ m.appeals.studentSubtitle }}</p>

      <router-link to="/services" class="appeal-btn primary req-new-btn">{{ m.appeals.goToServices }}</router-link>

      <p v-if="requestsStore.error" class="form-error">{{ requestsStore.error }}</p>
      <p v-if="!requestsStore.loading && !requestsStore.requests.length" class="appeal-empty">{{ m.appeals.empty }}</p>

      <TransitionGroup tag="div" name="req-card" class="appeal-list req-student-list">
        <article
          v-for="(item, index) in requestsStore.requests"
          :id="`request-card-${item.id}`"
          :key="item.id"
          class="appeal-card"
          :style="{ '--i': index }"
        >
          <button class="req-card-toggle" type="button" @click="toggleExpand(item.id)">
            <div class="appeal-card-head">
              <div>
                <h3>{{ item.service_name }}</h3>
                <p class="appeal-meta">
                  <span class="req-meta-pill">{{ item.request_number }}</span>
                  <span class="req-meta-pill">
                    <svg viewBox="0 0 24 24"><path d="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7ZM5 9h14v11H5V9Z" /></svg>
                    {{ formatDate(item.created_at) }}
                  </span>
                </p>
              </div>
              <span class="req-status-badge" :style="{ background: item.status_color }">
                {{ item.student_status_label }}
              </span>
            </div>
          </button>

          <RequestStatusTracker
            :status="item.status"
            :sla-percent="item.sla_percent"
            :is-overdue="isRequestOverdue(item)"
            :is-completed-on-time="isRequestCompletedOnTime(item)"
            :sla-deadline="item.sla_deadline"
          />

          <div v-if="expandedId === item.id" class="req-detail-panel">
            <p v-if="detailLoading && !expandedDetail" class="req-detail-loading">{{ m.appeals.loadingDetail }}</p>
            <p v-if="detailErrorMsg[item.id]" class="form-error">{{ detailErrorMsg[item.id] }}</p>

            <template v-else-if="expandedDetail">
              <p v-if="expandedDetail.notes" class="appeal-message">{{ expandedDetail.notes }}</p>
              <p v-if="expandedDetail.status === 'rejected' && expandedDetail.rejection_reason" class="form-error">
                {{ m.appeals.rejectionReasonLabel }}: {{ expandedDetail.rejection_reason }}
              </p>

              <div v-if="expandedDetail.documents.length" class="req-documents">
                <button
                  v-for="doc in expandedDetail.documents"
                  :key="doc.id"
                  type="button"
                  class="appeal-btn primary req-doc-btn"
                  @click="download(item.id, doc.id, doc.file_name)"
                >
                  <svg viewBox="0 0 24 24"><path d="M5 20h14v-2H5v2ZM13 4h-2v9.17L7.5 9.67 6.09 11.08 12 17l5.91-5.92L16.5 9.67 13 13.17V4Z" /></svg>
                  {{ doc.file_name }}
                </button>
              </div>
              <p v-if="downloadErrorMsg[item.id]" class="form-error">{{ downloadErrorMsg[item.id] }}</p>

              <div v-if="expandedDetail.status === 'completed' && !expandedDetail.rating" class="req-rating-box">
                <span class="field-label">{{ m.appeals.rateService }}</span>
                <div class="req-stars">
                  <button
                    v-for="star in 5"
                    :key="star"
                    type="button"
                    class="req-star-btn"
                    :class="{ filled: star <= ratingStars }"
                    @click="ratingStars = star"
                  >★</button>
                </div>
                <input v-model="ratingComment" type="text" class="field-input" :placeholder="m.appeals.ratingCommentPlaceholder" />
                <button class="submit-btn" :disabled="ratingSubmitting" @click="submitRating(item.id)">
                  {{ m.appeals.submitRating }}
                </button>
                <p v-if="ratingErrorMsg" class="form-error">{{ ratingErrorMsg }}</p>
              </div>

              <p v-else-if="expandedDetail.rating" class="req-rating-done">
                {{ m.appeals.yourRating }}: {{ '★'.repeat(expandedDetail.rating!.stars) }}
              </p>
            </template>
          </div>

          <div v-if="item.status === 'new'" class="appeal-card-foot">
            <button type="button" class="btn appeal-btn req-cancel-btn" @click="openCancel(item.id)">
              {{ m.appeals.cancelRequest }}
            </button>
          </div>
          <p v-if="cancelErrorMsg && cancellingId === item.id" class="form-error">{{ cancelErrorMsg }}</p>
          <div v-if="cancellingId === item.id" class="req-redirect-box">
            <input
              v-model="cancelReason"
              type="text"
              class="field-input"
              :placeholder="m.appeals.cancelReasonPlaceholder"
            />
            <button
              class="submit-btn req-redirect-confirm"
              :disabled="cancelSubmitting"
              @click="confirmCancel(item.id)"
            >
              {{ m.appeals.confirm }}
            </button>
          </div>
        </article>
      </TransitionGroup>
    </template>
  </DashboardLayout>
</template>
