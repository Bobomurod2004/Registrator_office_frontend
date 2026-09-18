<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import { extractApiError } from '@/services/http'
import { useLocaleStore } from '@/stores/locale'
import { useSystemSettingsStore } from '@/stores/systemSettings'
import { useStaffStore } from '@/stores/staff'
import {
  useServicesStore,
  type Service,
  type ServiceCategory,
  type ServiceLang,
  type ServicePayload,
  type FileFormat,
  type SlaUnit,
} from '@/stores/services'

const localeStore = useLocaleStore()
const m = computed(() => localeStore.m)
const settingsStore = useSystemSettingsStore()
const servicesStore = useServicesStore()
const staffStore = useStaffStore()

onMounted(() => {
  settingsStore.fetchAll()
  servicesStore.fetchServices()
  staffStore.fetchDepartments()
})

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
  if (!serviceForm.value.code.trim() || !serviceNames.value.uz.trim() || !serviceForm.value.department) return

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
        <button v-if="!showServiceForm" type="button" class="submit-btn" @click="openAddServiceForm">
          {{ m.settings.serviceAdd }}
        </button>
      </div>

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
                <option v-for="dept in staffStore.departments" :key="dept.id" :value="dept.id">
                  {{ dept.name_uz }}
                </option>
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
            <tr v-for="service in servicesStore.services" :key="service.id">
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
                    class="btn appeal-btn req-cancel-btn"
                    :disabled="deletingServiceId === service.id"
                    @click="removeServiceEntry(service.id)"
                  >
                    {{ m.settings.systemSettingDelete }}
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!servicesStore.services.length">
              <td colspan="9" class="contact-empty">{{ m.settings.serviceEmpty }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="serviceDeleteErrorMsg" class="form-error">{{ serviceDeleteErrorMsg }}</p>
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
</style>
