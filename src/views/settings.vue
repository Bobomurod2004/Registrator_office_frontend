<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import { extractApiError } from '@/services/http'
import { useLocaleStore } from '@/stores/locale'
import { useSystemSettingsStore } from '@/stores/systemSettings'
import { useStaffStore } from '@/stores/staff'
import {
  useRolesStore,
  REQUEST_CATEGORIES,
  REQUEST_SCOPES,
  type RequestScope,
  type Role,
  type RolePayload,
} from '@/stores/roles'
import {
  useServicesStore,
  type DispatchMode,
  type Service,
  type ServiceCategory,
  type ServiceLang,
  type ServicePayload,
  type ServiceRoleRoute,
  type ServiceRoleRoutePayload,
  type FileFormat,
  type SlaUnit,
} from '@/stores/services'

const localeStore = useLocaleStore()
const m = computed(() => localeStore.m)
const settingsStore = useSystemSettingsStore()
const servicesStore = useServicesStore()
const staffStore = useStaffStore()
const rolesStore = useRolesStore()

onMounted(() => {
  settingsStore.fetchAll()
  servicesStore.fetchServices()
  staffStore.fetchDepartments()
  rolesStore.fetchRoles()
  rolesStore.fetchPermissionCatalog()
})

/* ---------- Bo'limlar keshini yangilash ---------- */

/**
 * Bo'limlar ro'yxati sahifa ochilganda bir marta yuklanib keshlanadi. Endi
 * backendda har kuni 00:30 da HEMIS sinxronizatsiyasi ishlaydi: bo'lim nomi
 * o'zgarishi, yangisi qo'shilishi yoki eskisi `is_active=false` bo'lishi
 * mumkin. Admin sahifani yopmasdan ro'yxatni yangilab olishi uchun tugma.
 */
const departmentsRefreshing = ref(false)
const departmentsRefreshed = ref(false)
const departmentsRefreshError = ref('')

async function refreshDepartments() {
  departmentsRefreshing.value = true
  departmentsRefreshed.value = false
  departmentsRefreshError.value = ''
  try {
    await staffStore.fetchDepartments({ force: true })
    departmentsRefreshed.value = true
  } catch (err) {
    departmentsRefreshError.value = extractApiError(err, m.value.settings.refreshDepartmentsError)
  } finally {
    departmentsRefreshing.value = false
  }
}

/* ---------- Tizim sozlamalari ---------- */

const newSettingForm = ref({ key: '', value: '', description: '' })
const newSettingSaving = ref(false)
const newSettingError = ref('')

async function addSetting() {
  if (!newSettingForm.value.key.trim() || !newSettingForm.value.value.trim()) return
  newSettingSaving.value = true
  newSettingError.value = ''
  try {
    await settingsStore.addEntry({
      key: newSettingForm.value.key.trim(),
      value: newSettingForm.value.value.trim(),
      description: newSettingForm.value.description.trim(),
    })
    newSettingForm.value = { key: '', value: '', description: '' }
  } catch (err) {
    newSettingError.value = extractApiError(err, m.value.settings.systemSettingError)
  } finally {
    newSettingSaving.value = false
  }
}

const editingSettingId = ref<number | null>(null)
const editSettingForm = ref({ value: '', description: '' })
const editSettingSaving = ref(false)
const editSettingError = ref('')

function startEditSetting(id: number) {
  const entry = settingsStore.entries.find((e) => e.id === id)
  if (!entry) return
  editingSettingId.value = id
  editSettingForm.value = { value: entry.value, description: entry.description }
  editSettingError.value = ''
}

function cancelEditSetting() {
  editingSettingId.value = null
  editSettingError.value = ''
}

async function saveEditSetting(id: number) {
  editSettingSaving.value = true
  editSettingError.value = ''
  try {
    await settingsStore.updateEntry(id, editSettingForm.value)
    editingSettingId.value = null
  } catch (err) {
    editSettingError.value = extractApiError(err, m.value.settings.systemSettingError)
  } finally {
    editSettingSaving.value = false
  }
}

const deletingSettingId = ref<number | null>(null)
const deleteSettingError = ref('')

async function removeSetting(id: number) {
  deletingSettingId.value = id
  deleteSettingError.value = ''
  try {
    await settingsStore.removeEntry(id)
  } catch (err) {
    deleteSettingError.value = extractApiError(err, m.value.settings.systemSettingError)
  } finally {
    deletingSettingId.value = null
  }
}

/* ---------- Xizmatlar boshqaruvi ---------- */

const SERVICE_LANGS: ServiceLang[] = ['uz', 'uz_cyrl', 'ru', 'en']

function serviceLangLabel(lang: ServiceLang) {
  return m.value.profile.languageValues[lang]
}

const CATEGORY_OPTIONS: ServiceCategory[] = ['reference', 'financial', 'academic', 'science']
const serviceCategoryLabel = (c: ServiceCategory) =>
  ({
    reference: m.value.settings.serviceCategoryReference,
    financial: m.value.settings.serviceCategoryFinancial,
    academic: m.value.settings.serviceCategoryAcademic,
    science: m.value.settings.serviceCategoryScience,
  })[c]

const FORMAT_OPTIONS: FileFormat[] = ['pdf', 'excel', 'pdf_excel']
const serviceFormatLabel = (f: FileFormat) =>
  ({
    pdf: m.value.settings.serviceFormatPdf,
    excel: m.value.settings.serviceFormatExcel,
    pdf_excel: m.value.settings.serviceFormatBoth,
  })[f]

const showServiceForm = ref(false)
const editingServiceId = ref<number | null>(null)
const serviceNames = ref<Record<ServiceLang, string>>({ uz: '', uz_cyrl: '', ru: '', en: '' })
const serviceDescriptions = ref<Record<ServiceLang, string>>({ uz: '', uz_cyrl: '', ru: '', en: '' })
const serviceForm = ref({
  code: '',
  category: 'reference' as ServiceCategory,
  department: '' as number | '',
  sla_value: 1,
  sla_unit: 'days' as SlaUnit,
  output_format: 'pdf' as FileFormat,
  requires_payment: false,
  payment_amount: '',
  is_active: true,
  order: 0,
})
const serviceSaving = ref(false)
const serviceSaveErrorMsg = ref('')
const serviceSavedMsg = ref(false)

function resetServiceForm() {
  serviceNames.value = { uz: '', uz_cyrl: '', ru: '', en: '' }
  serviceDescriptions.value = { uz: '', uz_cyrl: '', ru: '', en: '' }
  serviceForm.value = {
    code: '',
    category: 'reference',
    department: '',
    sla_value: 1,
    sla_unit: 'days',
    output_format: 'pdf',
    requires_payment: false,
    payment_amount: '',
    is_active: true,
    order: 0,
  }
  serviceSaveErrorMsg.value = ''
}

function openAddServiceForm() {
  editingServiceId.value = null
  resetServiceForm()
  showServiceForm.value = true
}

function openEditServiceForm(service: Service) {
  editingServiceId.value = service.id
  serviceNames.value = {
    uz: service.name_uz,
    uz_cyrl: service.name_uz_cyrl,
    ru: service.name_ru,
    en: service.name_en,
  }
  serviceDescriptions.value = {
    uz: service.description_uz,
    uz_cyrl: service.description_uz_cyrl,
    ru: service.description_ru,
    en: service.description_en,
  }
  serviceForm.value = {
    code: service.code,
    category: service.category,
    department: service.department,
    sla_value: service.sla_value,
    sla_unit: service.sla_unit,
    output_format: service.output_format,
    requires_payment: service.requires_payment,
    payment_amount: service.payment_amount ?? '',
    is_active: service.is_active,
    order: service.order,
  }
  serviceSaveErrorMsg.value = ''
  showServiceForm.value = true
}

function cancelServiceForm() {
  showServiceForm.value = false
  editingServiceId.value = null
  serviceSaveErrorMsg.value = ''
}

async function submitServiceForm() {
  // Avval bu tekshiruv jim `return` qilardi — tugma bosilgani bilan hech narsa
  // sodir bo'lmas, sabab ham ko'rsatilmas edi ("edit qilib bo'lmayapti").
  if (!serviceForm.value.code.trim() || !serviceNames.value.uz.trim() || !serviceForm.value.department) {
    serviceSaveErrorMsg.value = m.value.settings.serviceRequiredMissing
    return
  }

  serviceSaving.value = true
  serviceSaveErrorMsg.value = ''
  try {
    const payload: ServicePayload = {
      code: serviceForm.value.code.trim(),
      name_uz: serviceNames.value.uz.trim(),
      name_uz_cyrl: serviceNames.value.uz_cyrl.trim() || undefined,
      name_ru: serviceNames.value.ru.trim() || undefined,
      name_en: serviceNames.value.en.trim() || undefined,
      description_uz: serviceDescriptions.value.uz || undefined,
      description_uz_cyrl: serviceDescriptions.value.uz_cyrl || undefined,
      description_ru: serviceDescriptions.value.ru || undefined,
      description_en: serviceDescriptions.value.en || undefined,
      category: serviceForm.value.category,
      department: Number(serviceForm.value.department),
      sla_value: Number(serviceForm.value.sla_value) || 0,
      sla_unit: serviceForm.value.sla_unit,
      output_format: serviceForm.value.output_format,
      requires_payment: serviceForm.value.requires_payment,
      payment_amount: serviceForm.value.requires_payment ? serviceForm.value.payment_amount || '0' : null,
      is_active: serviceForm.value.is_active,
      order: Number(serviceForm.value.order) || 0,
    }
    if (editingServiceId.value) {
      await servicesStore.updateService(editingServiceId.value, payload)
    } else {
      await servicesStore.addService(payload)
    }
    serviceSavedMsg.value = true
    window.setTimeout(() => (serviceSavedMsg.value = false), 2500)
    cancelServiceForm()
  } catch (err) {
    serviceSaveErrorMsg.value = extractApiError(err, m.value.settings.serviceSaveError)
  } finally {
    serviceSaving.value = false
  }
}

/* ---------- Xizmatning yo'naltirish qoidalari (qaysi rol/bo'limga tushadi) ---------- */

/**
 * Har bir xizmat uchun `/api/v1/services/{id}/routes/` orqali boshqariladigan
 * qoidalar: murojaat QAYSI ROL va QAYSI BO'LIM xodimlariga borib tushishi.
 * `priority` — kichik raqam avval ko'riladi; `dispatch_mode` — avtomatik
 * taqsimlanadimi (`auto_balanced`) yoki qo'lda ko'rib chiqiladimi
 * (`manual_review`). `department: null` — qoida bo'limga bog'lanmagan.
 */
const DISPATCH_OPTIONS: DispatchMode[] = ['auto_balanced', 'manual_review']

const routesServiceId = ref<number | null>(null)
const routesLoading = ref(false)
const routesError = ref('')

/** `priority` ATAYLAB bo'sh (`''`) bo'lishi mumkin — backend bo'sh qoldirilsa
 * keyingi bo'sh raqamni o'zi beradi. Band raqam yoki takroriy rol yuborilsa
 * backend tushunarli 400 qaytaradi, u `extractApiError()` orqali ko'rsatiladi. */
const routeForm = ref({
  role: '' as number | '',
  department: '' as number | '',
  priority: '' as number | '',
  dispatch_mode: 'auto_balanced' as DispatchMode,
  is_active: true,
})
const editingRouteId = ref<number | null>(null)
const routeSaving = ref(false)
const routeFormError = ref('')
const deletingRouteId = ref<number | null>(null)

/**
 * Marshrutning HAQIQIY bo'limi. `route.department` — ixtiyoriy almashtirish,
 * migratsiyadan keyin barcha marshrutlarda `null`, shu sabab eski kod (faqat
 * `department_name`ni o'qigan) hamma qator uchun "Barcha bo'limlar" deb
 * ko'rsatardi — bu noto'g'ri edi: murojaat aslida xizmatning aniq bo'limiga
 * tushadi. Backend `effective_department_name`ni bermasa (eski deployment yoki
 * `/routes/` endpointi qisqartirilgan serializer ishlatsa), xizmatning o'z
 * bo'limiga tushamiz — natija bir xil bo'ladi.
 */
function routeDepartmentName(route: ServiceRoleRoute, service: Service): string {
  return route.effective_department_name || route.department_name || service.department_name || '—'
}

function dispatchModeLabel(mode: DispatchMode) {
  return mode === 'manual_review'
    ? m.value.settings.routeDispatchManual
    : m.value.settings.routeDispatchAuto
}

function resetRouteForm() {
  editingRouteId.value = null
  routeFormError.value = ''
  routeForm.value = {
    role: '',
    department: '',
    priority: '',
    dispatch_mode: 'auto_balanced',
    is_active: true,
  }
}

/** Qatordagi "Yo'naltirish" tugmasi — bir xizmat ochiq bo'lsa, ikkinchisini
 * bosish avvalgisini yopadi; xuddi shu xizmatni qayta bosish esa panelni yopadi. */
async function toggleRoutes(service: Service) {
  if (routesServiceId.value === service.id) {
    routesServiceId.value = null
    return
  }
  routesServiceId.value = service.id
  resetRouteForm()
  routesError.value = ''
  routesLoading.value = true
  try {
    await servicesStore.fetchServiceRoutes(service.id)
  } catch (err) {
    routesError.value = extractApiError(err, m.value.settings.routeLoadError)
  } finally {
    routesLoading.value = false
  }
}

function startEditRoute(route: ServiceRoleRoute) {
  editingRouteId.value = route.id
  routeFormError.value = ''
  routeForm.value = {
    role: route.role,
    department: route.department ?? '',
    priority: route.priority,
    dispatch_mode: route.dispatch_mode,
    is_active: route.is_active,
  }
}

async function submitRouteForm() {
  if (!routesServiceId.value) return
  if (!routeForm.value.role) {
    routeFormError.value = m.value.settings.routeRoleRequired
    return
  }

  routeSaving.value = true
  routeFormError.value = ''
  try {
    const payload: ServiceRoleRoutePayload = {
      role: Number(routeForm.value.role),
      department: routeForm.value.department === '' ? null : Number(routeForm.value.department),
      dispatch_mode: routeForm.value.dispatch_mode,
      is_active: routeForm.value.is_active,
    }
    // Bo'sh qoldirilsa `priority` umuman yuborilmaydi — backend keyingi bo'sh
    // raqamni o'zi tanlaydi.
    if (routeForm.value.priority !== '') payload.priority = Number(routeForm.value.priority)
    if (editingRouteId.value) {
      await servicesStore.updateServiceRoute(routesServiceId.value, editingRouteId.value, payload)
    } else {
      await servicesStore.addServiceRoute(routesServiceId.value, payload)
    }
    // POST/PATCH javobi hisoblanadigan maydonlarni (`effective_department`,
    // `eligible_staff_count`) qaytarmasligi mumkin — ro'yxatni qayta olib,
    // jadvalda haqiqiy holat ko'rinishini kafolatlaymiz.
    await servicesStore.fetchServiceRoutes(routesServiceId.value).catch(() => {})
    resetRouteForm()
  } catch (err) {
    routeFormError.value = extractApiError(err, m.value.settings.routeSaveError)
  } finally {
    routeSaving.value = false
  }
}

async function removeRoute(routeId: number) {
  if (!routesServiceId.value) return
  deletingRouteId.value = routeId
  routeFormError.value = ''
  try {
    await servicesStore.removeServiceRoute(routesServiceId.value, routeId)
    if (editingRouteId.value === routeId) resetRouteForm()
  } catch (err) {
    routeFormError.value = extractApiError(err, m.value.settings.routeDeleteError)
  } finally {
    deletingRouteId.value = null
  }
}

const deletingServiceId = ref<number | null>(null)
const serviceDeleteErrorMsg = ref('')

async function removeServiceEntry(id: number) {
  deletingServiceId.value = id
  serviceDeleteErrorMsg.value = ''
  try {
    await servicesStore.removeService(id)
    if (editingServiceId.value === id) cancelServiceForm()
  } catch (err) {
    serviceDeleteErrorMsg.value = extractApiError(err, m.value.settings.serviceDeleteError)
  } finally {
    deletingServiceId.value = null
  }
}

/* ---------- Rollar boshqaruvi ---------- */

const permissionGroups = computed(() => {
  const groups = new Map<string, { code: string; name: string }[]>()
  for (const p of rolesStore.permissionCatalog) {
    const key = p.category || m.value.settings.rolePermissionsLabel
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push({ code: p.code, name: p.name })
  }
  return Array.from(groups.entries())
})

const showRoleForm = ref(false)
const editingRoleId = ref<number | null>(null)
/** `request_scope` — standart `department`. ATAYLAB `none` emas: backend
 * jamoasi ogohlantirgan, `none` bilan xodim tizimda deyarli hech narsa
 * ko'rmaydi, shu sabab bu maydon formada majburiy tanlov. */
const roleForm = ref({
  name: '',
  code: '',
  description: '',
  request_scope: 'department' as RequestScope,
})
const roleFormPermissions = ref<Set<string>>(new Set())
const roleFormCategories = ref<Set<string>>(new Set())
const roleSaving = ref(false)
const roleSaveErrorMsg = ref('')
const roleSavedMsg = ref(false)

function roleScopeLabel(scope: RequestScope) {
  return m.value.settings.roleScopes[scope]
}

function toggleRoleCategory(category: string) {
  const next = new Set(roleFormCategories.value)
  if (next.has(category)) next.delete(category)
  else next.add(category)
  roleFormCategories.value = next
}

function resetRoleForm() {
  roleForm.value = { name: '', code: '', description: '', request_scope: 'department' }
  roleFormPermissions.value = new Set()
  roleFormCategories.value = new Set()
  roleSaveErrorMsg.value = ''
}

function openAddRoleForm() {
  editingRoleId.value = null
  resetRoleForm()
  showRoleForm.value = true
}

function openEditRoleForm(role: Role) {
  editingRoleId.value = role.id
  roleForm.value = {
    name: role.name,
    code: role.code,
    description: role.description,
    request_scope: role.requestScope,
  }
  roleFormPermissions.value = new Set(role.permissions)
  roleFormCategories.value = new Set(role.requestCategories)
  roleSaveErrorMsg.value = ''
  showRoleForm.value = true
}

function cancelRoleForm() {
  showRoleForm.value = false
  editingRoleId.value = null
  roleSaveErrorMsg.value = ''
}

function togglePermission(code: string) {
  const next = new Set(roleFormPermissions.value)
  if (next.has(code)) next.delete(code)
  else next.add(code)
  roleFormPermissions.value = next
}

async function submitRoleForm() {
  if (!roleForm.value.name.trim()) {
    roleSaveErrorMsg.value = m.value.settings.roleNameRequired
    return
  }
  if (roleForm.value.request_scope === 'category' && !roleFormCategories.value.size) {
    roleSaveErrorMsg.value = m.value.settings.roleCategoriesRequired
    return
  }

  roleSaving.value = true
  roleSaveErrorMsg.value = ''
  try {
    const payload: RolePayload = {
      name: roleForm.value.name.trim(),
      code: roleForm.value.code.trim() || undefined,
      description: roleForm.value.description.trim() || undefined,
      permissions: Array.from(roleFormPermissions.value),
      request_scope: roleForm.value.request_scope,
      // Kategoriyalar faqat `category` doirasida ma'noga ega.
      request_categories:
        roleForm.value.request_scope === 'category' ? Array.from(roleFormCategories.value) : [],
    }
    if (editingRoleId.value) {
      await rolesStore.updateRole(editingRoleId.value, payload)
    } else {
      await rolesStore.addRole(payload)
    }
    roleSavedMsg.value = true
    window.setTimeout(() => (roleSavedMsg.value = false), 2500)
    cancelRoleForm()
  } catch (err) {
    roleSaveErrorMsg.value = extractApiError(err, m.value.settings.roleSaveError)
  } finally {
    roleSaving.value = false
  }
}

const deletingRoleId = ref<number | null>(null)
const roleDeleteErrorMsg = ref('')

async function removeRoleEntry(id: number) {
  deletingRoleId.value = id
  roleDeleteErrorMsg.value = ''
  try {
    await rolesStore.removeRole(id)
    if (editingRoleId.value === id) cancelRoleForm()
  } catch (err) {
    roleDeleteErrorMsg.value = extractApiError(err, m.value.settings.roleDeleteError)
  } finally {
    deletingRoleId.value = null
  }
}
</script>

<template>
  <DashboardLayout>
    <h1>{{ m.settings.title }}</h1>
    <p class="services-subtitle">{{ m.settings.subtitle }}</p>

    <article class="appeal-form system-settings-card">
      <h3>{{ m.settings.systemSettingsTitle }}</h3>
      <p class="services-subtitle">{{ m.settings.systemSettingsSubtitle }}</p>

      <form class="system-setting-add-row" @submit.prevent="addSetting">
        <input v-model="newSettingForm.key" type="text" class="field-input" :placeholder="m.settings.systemSettingKey" />
        <input v-model="newSettingForm.value" type="text" class="field-input" :placeholder="m.settings.systemSettingValue" />
        <input
          v-model="newSettingForm.description"
          type="text"
          class="field-input"
          :placeholder="m.settings.systemSettingDescription"
        />
        <button type="submit" class="btn appeal-btn primary" :disabled="newSettingSaving">
          {{ m.settings.systemSettingAdd }}
        </button>
      </form>
      <p v-if="newSettingError" class="form-error">{{ newSettingError }}</p>

      <p v-if="settingsStore.error" class="form-error">{{ settingsStore.error }}</p>
      <p v-if="settingsStore.loading" class="appeal-empty">{{ m.settings.loadingList }}</p>

      <div v-if="!settingsStore.loading" class="staff-table-wrap">
        <table class="staff-table">
          <thead>
            <tr>
              <th>{{ m.settings.systemSettingKey }}</th>
              <th>{{ m.settings.systemSettingValue }}</th>
              <th>{{ m.settings.systemSettingDescription }}</th>
              <th>{{ m.settings.systemSettingUpdatedBy }}</th>
              <th>{{ m.grant.colActions }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in settingsStore.entries" :key="entry.id">
              <td>{{ entry.key }}</td>
              <td>
                <span v-if="editingSettingId !== entry.id">{{ entry.value }}</span>
                <input v-else v-model="editSettingForm.value" type="text" class="gs-edit-input" />
              </td>
              <td>
                <span v-if="editingSettingId !== entry.id">{{ entry.description || '—' }}</span>
                <input v-else v-model="editSettingForm.description" type="text" class="gs-edit-input" />
              </td>
              <td>{{ entry.updatedByName || '—' }}</td>
              <td>
                <div class="gs-row-actions">
                  <template v-if="editingSettingId === entry.id">
                    <button
                      type="button"
                      class="btn appeal-btn primary"
                      :disabled="editSettingSaving"
                      @click="saveEditSetting(entry.id)"
                    >
                      {{ m.grant.saveScore }}
                    </button>
                    <button type="button" class="btn appeal-btn" :disabled="editSettingSaving" @click="cancelEditSetting">
                      {{ m.grant.cancelEdit }}
                    </button>
                  </template>
                  <template v-else>
                    <button type="button" class="btn appeal-btn" @click="startEditSetting(entry.id)">
                      {{ m.grant.editScore }}
                    </button>
                    <button
                      type="button"
                      class="btn appeal-btn req-cancel-btn"
                      :disabled="deletingSettingId === entry.id"
                      @click="removeSetting(entry.id)"
                    >
                      {{ m.settings.systemSettingDelete }}
                    </button>
                  </template>
                </div>
                <p v-if="editingSettingId === entry.id && editSettingError" class="form-error">{{ editSettingError }}</p>
              </td>
            </tr>
            <tr v-if="!settingsStore.entries.length">
              <td colspan="5" class="contact-empty">{{ m.settings.systemSettingsEmpty }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="deleteSettingError" class="form-error">{{ deleteSettingError }}</p>
    </article>

    <article class="appeal-form system-settings-card">
      <div class="info-header-row">
        <div>
          <h3>{{ m.settings.serviceMgmtTitle }}</h3>
          <p class="services-subtitle">{{ m.settings.serviceMgmtSubtitle }}</p>
        </div>
        <div class="gs-row-actions">
          <button
            type="button"
            class="btn appeal-btn"
            :disabled="departmentsRefreshing"
            @click="refreshDepartments"
          >
            <span v-if="departmentsRefreshing" class="spinner-border spinner-border-sm" />
            <span>{{ m.settings.refreshDepartments }}</span>
          </button>
          <button v-if="!showServiceForm" type="button" class="submit-btn" @click="openAddServiceForm">
            {{ m.settings.serviceAdd }}
          </button>
        </div>
      </div>
      <p v-if="departmentsRefreshed" class="form-success">
        {{ m.settings.departmentsRefreshed }} ({{ staffStore.departments.length }})
      </p>
      <p v-if="departmentsRefreshError" class="form-error">{{ departmentsRefreshError }}</p>
      <p class="field-hint">{{ m.settings.refreshDepartmentsHint }}</p>

      <form v-if="showServiceForm" class="appeal-form service-form" @submit.prevent="submitServiceForm">
        <h3>{{ editingServiceId ? m.settings.serviceEditTitle : m.settings.serviceAddTitle }}</h3>

        <p class="field-hint">{{ m.settings.serviceLangHint }}</p>

        <div v-for="lang in SERVICE_LANGS" :key="lang" class="service-lang-block">
          <h4 class="service-lang-heading">{{ serviceLangLabel(lang) }}</h4>

          <label class="field">
            <span class="field-label">{{ m.settings.serviceNameLabel }}</span>
            <input v-model="serviceNames[lang]" type="text" class="field-input" />
          </label>

          <label class="field">
            <span class="field-label">{{ m.settings.serviceDescriptionLabel }}</span>
            <textarea v-model="serviceDescriptions[lang]" class="field-input service-textarea" rows="2" />
          </label>
        </div>

        <div class="service-form-grid">
          <label class="field">
            <span class="field-label">{{ m.settings.serviceCode }}</span>
            <input
              v-model="serviceForm.code"
              type="text"
              maxlength="10"
              class="field-input"
              :placeholder="m.settings.serviceCodePlaceholder"
            />
          </label>

          <label class="field">
            <span class="field-label">{{ m.settings.serviceCategory }}</span>
            <span class="select-wrap">
              <select v-model="serviceForm.category" class="field-input">
                <option v-for="c in CATEGORY_OPTIONS" :key="c" :value="c">{{ serviceCategoryLabel(c) }}</option>
              </select>
              <svg class="select-arrow" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
            </span>
          </label>

          <label class="field">
            <span class="field-label">{{ m.settings.serviceDepartment }}</span>
            <span class="select-wrap">
              <select v-model="serviceForm.department" class="field-input">
                <option value="">{{ m.settings.serviceDepartmentPlaceholder }}</option>
                <optgroup
                  v-for="group in staffStore.departmentGroups"
                  :key="group.label || 'other'"
                  :label="group.label || m.staff.departmentOtherGroup"
                >
                  <option v-for="dept in group.items" :key="dept.id" :value="dept.id">
                    {{ dept.name_uz }}
                  </option>
                </optgroup>
              </select>
              <svg class="select-arrow" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
            </span>
          </label>

          <label class="field">
            <span class="field-label">{{ m.settings.serviceSlaValue }}</span>
            <input v-model.number="serviceForm.sla_value" type="number" min="0" class="field-input" />
          </label>

          <label class="field">
            <span class="field-label">{{ m.settings.serviceSlaUnit }}</span>
            <span class="select-wrap">
              <select v-model="serviceForm.sla_unit" class="field-input">
                <option value="hours">{{ m.settings.serviceSlaUnitHours }}</option>
                <option value="days">{{ m.settings.serviceSlaUnitDays }}</option>
              </select>
              <svg class="select-arrow" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
            </span>
          </label>

          <label class="field">
            <span class="field-label">{{ m.settings.serviceOutputFormat }}</span>
            <span class="select-wrap">
              <select v-model="serviceForm.output_format" class="field-input">
                <option v-for="f in FORMAT_OPTIONS" :key="f" :value="f">{{ serviceFormatLabel(f) }}</option>
              </select>
              <svg class="select-arrow" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
            </span>
          </label>

          <label class="field">
            <span class="field-label">{{ m.settings.serviceOrder }}</span>
            <input v-model.number="serviceForm.order" type="number" min="0" class="field-input" />
          </label>

          <label v-if="serviceForm.requires_payment" class="field">
            <span class="field-label">{{ m.settings.servicePaymentAmount }}</span>
            <input v-model="serviceForm.payment_amount" type="number" min="0" step="0.01" class="field-input" />
          </label>
        </div>

        <div class="service-checkbox-row">
          <label class="gs-checkbox-field">
            <input v-model="serviceForm.requires_payment" type="checkbox" />
            {{ m.settings.serviceRequiresPayment }}
          </label>
          <label class="gs-checkbox-field">
            <input v-model="serviceForm.is_active" type="checkbox" />
            {{ m.settings.serviceActive }}
          </label>
        </div>

        <div class="info-form-actions">
          <button type="submit" class="submit-btn" :disabled="serviceSaving">
            <span v-if="serviceSaving" class="spinner-border spinner-border-sm" />
            <span>{{ m.settings.serviceSave }}</span>
          </button>
          <button type="button" class="appeal-btn" @click="cancelServiceForm">{{ m.settings.serviceCancel }}</button>
        </div>
        <p v-if="serviceSaveErrorMsg" class="form-error">{{ serviceSaveErrorMsg }}</p>
      </form>

      <p v-if="serviceSavedMsg" class="form-success">{{ m.settings.serviceSaved }}</p>
      <p v-if="servicesStore.error" class="form-error">{{ servicesStore.error }}</p>
      <p v-if="servicesStore.loading" class="appeal-empty">{{ m.settings.loadingList }}</p>

      <div v-if="!servicesStore.loading" class="staff-table-wrap">
        <table class="staff-table">
          <thead>
            <tr>
              <th>{{ m.settings.colCode }}</th>
              <th>{{ m.settings.colName }}</th>
              <th>{{ m.settings.colCategory }}</th>
              <th>{{ m.settings.colDepartment }}</th>
              <th>{{ m.settings.colSla }}</th>
              <th>{{ m.settings.colFormat }}</th>
              <th>{{ m.settings.colPayment }}</th>
              <th>{{ m.settings.colActive }}</th>
              <th>{{ m.grant.colActions }}</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="service in servicesStore.services" :key="service.id">
            <tr>
              <td>{{ service.code }}</td>
              <td>{{ service.name_uz }}</td>
              <td>{{ service.category_display }}</td>
              <td>{{ service.department_name || '—' }}</td>
              <td>{{ service.sla_text }}</td>
              <td>{{ service.output_format_display }}</td>
              <td>{{ service.requires_payment ? (service.payment_amount || '—') : '—' }}</td>
              <td>{{ service.is_active ? m.services.statusAvailable : m.services.statusUnavailable }}</td>
              <td>
                <div class="gs-row-actions">
                  <button type="button" class="btn appeal-btn" @click="openEditServiceForm(service)">
                    {{ m.grant.editScore }}
                  </button>
                  <button
                    type="button"
                    class="btn appeal-btn route-toggle-btn"
                    :class="{ 'is-open': routesServiceId === service.id }"
                    @click="toggleRoutes(service)"
                  >
                    {{ m.settings.routeBtn }}
                    <span v-if="service.routing_rules.length" class="route-count">
                      {{ service.routing_rules.length }}
                    </span>
                  </button>
                  <button
                    type="button"
                    class="btn appeal-btn req-cancel-btn"
                    :disabled="deletingServiceId === service.id"
                    @click="removeServiceEntry(service.id)"
                  >
                    {{ m.settings.systemSettingDelete }}
                  </button>
                </div>
              </td>
            </tr>

            <!-- Yo'naltirish qoidalari paneli — faqat ochilgan xizmat uchun -->
            <tr v-if="routesServiceId === service.id" class="route-panel-row">
              <td colspan="9">
                <div class="route-panel">
                  <div class="route-panel-head">
                    <h4>{{ m.settings.routeTitle }}</h4>
                    <p class="services-subtitle">{{ m.settings.routeSubtitle }}</p>
                  </div>

                  <p v-if="routesLoading" class="appeal-empty">{{ m.settings.loadingList }}</p>
                  <p v-else-if="routesError" class="form-error">{{ routesError }}</p>

                  <template v-else>
                    <div v-if="service.routing_rules.length" class="staff-table-wrap">
                      <table class="staff-table">
                        <thead>
                          <tr>
                            <th>{{ m.settings.routeColPriority }}</th>
                            <th>{{ m.settings.routeColRole }}</th>
                            <th>{{ m.settings.routeColDepartment }}</th>
                            <th>{{ m.settings.routeColDispatch }}</th>
                            <th>{{ m.settings.routeColStaff }}</th>
                            <th>{{ m.settings.colActive }}</th>
                            <th>{{ m.grant.colActions }}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <template v-for="route in service.routing_rules" :key="route.id">
                          <tr>
                            <td>{{ route.priority }}</td>
                            <td>{{ route.role_name || route.role_code || route.role }}</td>
                            <td>
                              {{ routeDepartmentName(route, service) }}
                              <span v-if="route.department == null" class="route-from-service">
                                {{ m.settings.routeFromService }}
                              </span>
                            </td>
                            <td>{{ dispatchModeLabel(route.dispatch_mode) }}</td>
                            <td>
                              <span
                                class="route-staff-badge"
                                :class="{ 'is-empty': route.eligible_staff_count === 0 }"
                              >
                                {{ route.eligible_staff_count ?? '—' }}
                              </span>
                            </td>
                            <td>
                              {{ route.is_active ? m.services.statusAvailable : m.services.statusUnavailable }}
                            </td>
                            <td>
                              <div class="gs-row-actions">
                                <button type="button" class="btn appeal-btn" @click="startEditRoute(route)">
                                  {{ m.grant.editScore }}
                                </button>
                                <button
                                  type="button"
                                  class="btn appeal-btn req-cancel-btn"
                                  :disabled="deletingRouteId === route.id"
                                  @click="removeRoute(route.id)"
                                >
                                  {{ m.settings.systemSettingDelete }}
                                </button>
                              </div>
                            </td>
                          </tr>
                          <!-- Xodim yo'q bo'lsa marshrut amalda ishlamaydi — admin buni
                               hech qayerdan bilmasdi, shu sabab qator ostida aniq ogohlantirish. -->
                          <tr v-if="route.eligible_staff_count === 0" class="route-warn-row">
                            <td colspan="7" class="route-warn">{{ m.settings.routeNoStaffWarning }}</td>
                          </tr>
                          </template>
                        </tbody>
                      </table>
                    </div>
                    <p v-else class="contact-empty">{{ m.settings.routeEmpty }}</p>

                    <form class="route-form" @submit.prevent="submitRouteForm">
                      <h5>{{ editingRouteId ? m.settings.routeEditTitle : m.settings.routeAddTitle }}</h5>
                      <div class="route-form-grid">
                        <label class="field">
                          <span class="field-label">{{ m.settings.routeColRole }} *</span>
                          <span class="select-wrap">
                            <select v-model="routeForm.role" class="field-input">
                              <option value="">{{ m.settings.routeRolePlaceholder }}</option>
                              <option v-for="role in rolesStore.roles" :key="role.id" :value="role.id">
                                {{ role.name }}
                              </option>
                            </select>
                            <svg class="select-arrow" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
                          </span>
                        </label>

                        <label class="field">
                          <span class="field-label">{{ m.settings.routeColDepartment }}</span>
                          <span class="select-wrap">
                            <select v-model="routeForm.department" class="field-input">
                              <option value="">{{ m.settings.routeServiceDepartment }}</option>
                              <optgroup
                                v-for="group in staffStore.departmentGroups"
                                :key="group.label || 'other'"
                                :label="group.label || m.staff.departmentOtherGroup"
                              >
                                <option v-for="dept in group.items" :key="dept.id" :value="dept.id">
                                  {{ dept.name_uz }}
                                </option>
                              </optgroup>
                            </select>
                            <svg class="select-arrow" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
                          </span>
                          <span class="field-hint">{{ m.settings.routeDepartmentHint }}</span>
                        </label>

                        <label class="field">
                          <span class="field-label">{{ m.settings.routeColPriority }}</span>
                          <input
                            v-model.number="routeForm.priority"
                            type="number"
                            min="1"
                            class="field-input"
                            :placeholder="m.settings.routePriorityPlaceholder"
                          />
                          <span class="field-hint">{{ m.settings.routePriorityHint }}</span>
                        </label>

                        <label class="field">
                          <span class="field-label">{{ m.settings.routeColDispatch }}</span>
                          <span class="select-wrap">
                            <select v-model="routeForm.dispatch_mode" class="field-input">
                              <option v-for="mode in DISPATCH_OPTIONS" :key="mode" :value="mode">
                                {{ dispatchModeLabel(mode) }}
                              </option>
                            </select>
                            <svg class="select-arrow" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
                          </span>
                        </label>

                        <label class="gs-checkbox-field">
                          <input v-model="routeForm.is_active" type="checkbox" />
                          {{ m.settings.serviceActive }}
                        </label>
                      </div>

                      <div class="info-form-actions">
                        <button type="submit" class="submit-btn" :disabled="routeSaving">
                          <span v-if="routeSaving" class="spinner-border spinner-border-sm" />
                          <span>{{ editingRouteId ? m.settings.serviceSave : m.settings.routeAdd }}</span>
                        </button>
                        <button v-if="editingRouteId" type="button" class="appeal-btn" @click="resetRouteForm">
                          {{ m.settings.serviceCancel }}
                        </button>
                      </div>
                      <p v-if="routeFormError" class="form-error">{{ routeFormError }}</p>
                    </form>
                  </template>
                </div>
              </td>
            </tr>
            </template>

            <tr v-if="!servicesStore.services.length">
              <td colspan="9" class="contact-empty">{{ m.settings.serviceEmpty }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="serviceDeleteErrorMsg" class="form-error">{{ serviceDeleteErrorMsg }}</p>
    </article>

    <article class="appeal-form system-settings-card">
      <div class="info-header-row">
        <div>
          <h3>{{ m.settings.roleMgmtTitle }}</h3>
          <p class="services-subtitle">{{ m.settings.roleMgmtSubtitle }}</p>
        </div>
        <button v-if="!showRoleForm" type="button" class="submit-btn" @click="openAddRoleForm">
          {{ m.settings.roleAdd }}
        </button>
      </div>

      <form v-if="showRoleForm" class="appeal-form service-form" @submit.prevent="submitRoleForm">
        <h3>{{ editingRoleId ? m.settings.roleEditTitle : m.settings.roleAddTitle }}</h3>

        <div class="service-form-grid">
          <label class="field">
            <span class="field-label">{{ m.settings.roleNameLabel }}</span>
            <input
              v-model="roleForm.name"
              type="text"
              class="field-input"
              :placeholder="m.settings.roleNamePlaceholder"
            />
          </label>

          <label class="field">
            <span class="field-label">{{ m.settings.roleCodeLabel }}</span>
            <input
              v-model="roleForm.code"
              type="text"
              class="field-input"
              :disabled="!!editingRoleId"
              :placeholder="m.settings.roleCodePlaceholder"
            />
            <small class="field-hint">{{ m.settings.roleCodeHint }}</small>
          </label>
        </div>

        <label class="field">
          <span class="field-label">{{ m.settings.roleDescriptionLabel }}</span>
          <textarea v-model="roleForm.description" class="field-input service-textarea" rows="2" />
        </label>

        <!-- Murojaatlarni ko'rish doirasi — majburiy tanlov. `none` ataylab
             standart emas: u bilan xodim deyarli hech narsa ko'rmaydi. -->
        <label class="field">
          <span class="field-label">{{ m.settings.roleScopeLabel }} *</span>
          <span class="select-wrap">
            <select v-model="roleForm.request_scope" class="field-input">
              <option v-for="scope in REQUEST_SCOPES" :key="scope" :value="scope">
                {{ roleScopeLabel(scope) }}
              </option>
            </select>
            <svg class="select-arrow" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
          </span>
          <small class="field-hint">{{ m.settings.roleScopeHint }}</small>
          <small v-if="roleForm.request_scope === 'none'" class="form-error">
            {{ m.settings.roleScopeNoneWarning }}
          </small>
        </label>

        <div v-if="roleForm.request_scope === 'category'" class="field">
          <span class="field-label">{{ m.settings.roleCategoriesLabel }} *</span>
          <div class="service-checkbox-row">
            <label v-for="category in REQUEST_CATEGORIES" :key="category" class="gs-checkbox-field">
              <input
                type="checkbox"
                :checked="roleFormCategories.has(category)"
                @change="toggleRoleCategory(category)"
              />
              {{ serviceCategoryLabel(category) }}
            </label>
          </div>
        </div>

        <div class="field">
          <span class="field-label">{{ m.settings.rolePermissionsLabel }}</span>
          <p v-if="rolesStore.catalogLoading" class="appeal-empty">{{ m.settings.loadingList }}</p>
          <p v-else-if="rolesStore.catalogError" class="form-error">{{ rolesStore.catalogError }}</p>
          <p v-else-if="!permissionGroups.length" class="appeal-empty">{{ m.settings.rolePermissionsEmpty }}</p>
          <div v-else class="role-permission-groups">
            <div v-for="[category, perms] in permissionGroups" :key="category" class="role-permission-group">
              <h4 class="service-lang-heading">{{ category }}</h4>
              <div class="service-checkbox-row">
                <label v-for="p in perms" :key="p.code" class="gs-checkbox-field">
                  <input
                    type="checkbox"
                    :checked="roleFormPermissions.has(p.code)"
                    @change="togglePermission(p.code)"
                  />
                  {{ p.name }}
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="info-form-actions">
          <button type="submit" class="submit-btn" :disabled="roleSaving">
            <span v-if="roleSaving" class="spinner-border spinner-border-sm" />
            <span>{{ m.settings.roleSave }}</span>
          </button>
          <button type="button" class="appeal-btn" @click="cancelRoleForm">{{ m.settings.roleCancel }}</button>
        </div>
        <p v-if="roleSaveErrorMsg" class="form-error">{{ roleSaveErrorMsg }}</p>
      </form>

      <p v-if="roleSavedMsg" class="form-success">{{ m.settings.roleSaved }}</p>
      <p v-if="rolesStore.error" class="form-error">{{ rolesStore.error }}</p>
      <p v-if="rolesStore.loading" class="appeal-empty">{{ m.settings.loadingList }}</p>

      <div v-if="!rolesStore.loading" class="staff-table-wrap">
        <table class="staff-table">
          <thead>
            <tr>
              <th>{{ m.settings.colRoleName }}</th>
              <th>{{ m.settings.colRoleCode }}</th>
              <th>{{ m.settings.colRolePermissions }}</th>
              <th>{{ m.settings.colRoleUsers }}</th>
              <th>{{ m.grant.colActions }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="role in rolesStore.roles" :key="role.id">
              <td>
                {{ role.name }}
                <span v-if="role.isSystem" class="role-system-badge">{{ m.settings.roleSystemBadge }}</span>
              </td>
              <td>{{ role.code }}</td>
              <td>{{ role.permissions.length }}</td>
              <td>{{ role.usersCount }}</td>
              <td>
                <div class="gs-row-actions">
                  <button type="button" class="btn appeal-btn" @click="openEditRoleForm(role)">
                    {{ m.grant.editScore }}
                  </button>
                  <button
                    type="button"
                    class="btn appeal-btn req-cancel-btn"
                    :disabled="deletingRoleId === role.id"
                    @click="removeRoleEntry(role.id)"
                  >
                    {{ m.settings.systemSettingDelete }}
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!rolesStore.roles.length">
              <td colspan="5" class="contact-empty">{{ m.settings.roleEmpty }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="roleDeleteErrorMsg" class="form-error">{{ roleDeleteErrorMsg }}</p>
    </article>
  </DashboardLayout>
</template>

<style scoped>
.system-settings-card {
  margin-top: 20px;
}

.service-form {
  margin-top: 14px;
  margin-bottom: 18px;
}

.service-lang-block {
  display: grid;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(193, 211, 240, 0.7);
  background: rgba(47, 109, 255, 0.03);
}

.service-lang-heading {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: #2f6dff;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

:root[data-theme='dark'] .service-lang-block {
  border-color: rgba(84, 109, 154, 0.55);
  background: rgba(110, 160, 255, 0.06);
}

:root[data-theme='dark'] .service-lang-heading {
  color: #8fb4ff;
}

.service-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

.service-textarea {
  resize: vertical;
  font-family: inherit;
}

.service-checkbox-row {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin: 4px 0 6px;
}

@media (max-width: 860px) {
  .service-form-grid {
    grid-template-columns: 1fr;
  }
}

.system-setting-add-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1.4fr auto;
  gap: 10px;
  align-items: center;
  margin-bottom: 14px;
}

@media (max-width: 860px) {
  .system-setting-add-row {
    grid-template-columns: 1fr;
  }
}

.role-permission-groups {
  display: grid;
  gap: 12px;
  margin-top: 8px;
}

.role-permission-group {
  display: grid;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(193, 211, 240, 0.7);
  background: rgba(47, 109, 255, 0.03);
}

:root[data-theme='dark'] .role-permission-group {
  border-color: rgba(84, 109, 154, 0.55);
  background: rgba(110, 160, 255, 0.06);
}

.role-system-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: #2f6dff;
  background: rgba(47, 109, 255, 0.1);
}

:root[data-theme='dark'] .role-system-badge {
  color: #8fb4ff;
  background: rgba(110, 160, 255, 0.14);
}
</style>
