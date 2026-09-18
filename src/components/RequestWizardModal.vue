<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useLocaleStore } from '@/stores/locale'
import { useRequestsStore } from '@/stores/requests'
import { http } from '@/services/http'
import { parseProfileJson } from '@/utils/profileJson'
import type { Service } from '@/stores/services'
import type { DocumentLanguage, RequestDetail } from '@/stores/requests'

const props = defineProps<{ service: Service }>()
const emit = defineEmits<{ close: []; created: [RequestDetail] }>()

const localeStore = useLocaleStore()
const m = computed(() => localeStore.m)
const requestsStore = useRequestsStore()

const step = ref<'loading' | 'options' | 'review' | 'success'>('loading')

const jshshir = ref('')
const profileError = ref('')
const student = ref<{ fullName: string; faculty: string; group: string } | null>(null)

/** Talaba tizimga allaqachon o'z hisobi bilan kirgan — murojaat doim shu
 *  foydalanuvchining o'ziga tegishli bo'lgani uchun JSHSHIR'ni qo'lda
 *  kiritish shart emas: u backend profilidan (`student_profile.jshshir`)
 *  avtomatik olinadi, foydalanuvchiga faqat ko'rsatiladi. */
async function loadOwnStudentData() {
  step.value = 'loading'
  profileError.value = ''
  try {
    const { data } = await http.get('/api/v1/auth/me/')
    const parsed = parseProfileJson(data?.student_profile)
    const ownJshshir = parsed?.jshshir
    if (typeof ownJshshir !== 'string' || !ownJshshir.trim()) {
      profileError.value = m.value.wizard.jshshirAutoError
      return
    }
    jshshir.value = ownJshshir.trim()
    student.value = {
      fullName: typeof data?.full_name === 'string' ? data.full_name : '',
      faculty: typeof parsed?.faculty === 'string' ? parsed.faculty : '',
      group: typeof parsed?.group === 'string' ? parsed.group : '',
    }
    step.value = 'options'
  } catch {
    profileError.value = m.value.wizard.jshshirAutoError
  }
}

onMounted(loadOwnStudentData)

const documentLanguage = ref<DocumentLanguage>('uz')
const fileFormat = ref(props.service.output_format)
const notes = ref('')

const LANGUAGE_OPTIONS: { value: DocumentLanguage; label: string }[] = [
  { value: 'uz', label: "O'zbek (lotin)" },
  { value: 'uz_cyrl', label: "Ўзбек (кирилл)" },
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
]

const submitting = ref(false)
const submitError = ref('')
const createdRequest = ref<RequestDetail | null>(null)

async function submitRequest() {
  submitting.value = true
  submitError.value = ''
  try {
    const result = await requestsStore.createRequest({
      service: props.service.id,
      jshshir: jshshir.value.trim(),
      document_language: documentLanguage.value,
      file_format: fileFormat.value,
      notes: notes.value.trim() || undefined,
    })
    createdRequest.value = result
    step.value = 'success'
    emit('created', result)
  } catch (err: any) {
    submitError.value = err?.response?.data?.detail || m.value.wizard.submitError
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="svc-modal-backdrop" @click.self="emit('close')">
    <div class="wizard-modal">
      <div class="wizard-head">
        <h3>{{ service.name_uz }}</h3>
        <button type="button" class="wizard-close" @click="emit('close')">×</button>
      </div>

      <div class="wizard-steps">
        <span class="wizard-step-dot" :class="{ active: step === 'options' }">1</span>
        <span class="wizard-step-line" />
        <span class="wizard-step-dot" :class="{ active: step === 'review' || step === 'success' }">2</span>
      </div>

      <!-- Talabaning o'z ma'lumotlari (JSHSHIR) avtomatik yuklanmoqda -->
      <div v-if="step === 'loading'" class="wizard-body wizard-loading">
        <template v-if="profileError">
          <p class="form-error">{{ profileError }}</p>
          <button type="button" class="submit-btn" @click="loadOwnStudentData">{{ m.wizard.retry }}</button>
        </template>
        <template v-else>
          <span class="spinner-border" />
          <p>{{ m.wizard.loadingStudentData }}</p>
        </template>
      </div>

      <!-- 1-qadam: shablon tili / turi -->
      <div v-else-if="step === 'options'" class="wizard-body">
        <div v-if="student" class="lookup-box wizard-student-box">
          <p class="lookup-info"><strong>{{ m.wizard.studentName }}:</strong> {{ student.fullName }}</p>
          <p v-if="student.faculty" class="lookup-info"><strong>{{ m.wizard.studentFaculty }}:</strong> {{ student.faculty }}</p>
          <p v-if="student.group" class="lookup-info"><strong>{{ m.wizard.studentGroup }}:</strong> {{ student.group }}</p>
          <p class="lookup-info"><strong>{{ m.wizard.jshshirAutoLabel }}:</strong> {{ jshshir }}</p>
        </div>

        <label class="field">
          <span class="field-label">{{ m.wizard.languageLabel }}</span>
          <span class="select-wrap">
            <select v-model="documentLanguage" class="field-input">
              <option v-for="opt in LANGUAGE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <svg class="select-arrow" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
          </span>
        </label>

        <label class="field">
          <span class="field-label">{{ m.wizard.formatLabel }}</span>
          <span class="select-wrap">
            <select v-model="fileFormat" class="field-input">
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
            </select>
            <svg class="select-arrow" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
          </span>
        </label>

        <label class="field">
          <span class="field-label">{{ m.wizard.notesLabel }}</span>
          <textarea v-model="notes" class="field-input field-textarea" rows="3" :placeholder="m.wizard.notesPlaceholder" />
        </label>

        <div class="wizard-actions">
          <button type="button" class="appeal-btn" @click="emit('close')">{{ m.wizard.back }}</button>
          <button type="button" class="submit-btn" @click="step = 'review'">{{ m.wizard.next }}</button>
        </div>
      </div>

      <!-- 2-qadam: tekshirish va yuborish -->
      <div v-else-if="step === 'review'" class="wizard-body">
        <div class="lookup-box wizard-student-box">
          <p class="lookup-info"><strong>{{ m.services.title }}:</strong> {{ service.name_uz }}</p>
          <p class="lookup-info"><strong>{{ m.wizard.studentName }}:</strong> {{ student?.fullName }}</p>
          <p class="lookup-info"><strong>{{ m.wizard.languageLabel }}:</strong> {{ LANGUAGE_OPTIONS.find((o) => o.value === documentLanguage)?.label }}</p>
          <p class="lookup-info"><strong>{{ m.wizard.formatLabel }}:</strong> {{ fileFormat === 'pdf' ? 'PDF' : 'Excel' }}</p>
        </div>

        <p v-if="submitError" class="form-error">{{ submitError }}</p>

        <div class="wizard-actions">
          <button type="button" class="appeal-btn" @click="step = 'options'">{{ m.wizard.back }}</button>
          <button type="button" class="submit-btn" :disabled="submitting" @click="submitRequest">
            {{ submitting ? m.wizard.submitting : m.wizard.submit }}
          </button>
        </div>
      </div>

      <!-- 3-qadam: muvaffaqiyat -->
      <div v-else-if="step === 'success' && createdRequest" class="wizard-body wizard-success">
        <span class="wizard-success-icon">
          <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm-1.5 14.5-4-4 1.4-1.4 2.6 2.6 6.6-6.6 1.4 1.4Z" /></svg>
        </span>
        <h3>{{ m.wizard.successTitle }}</h3>
        <p class="wizard-request-number">{{ createdRequest.request_number }}</p>
        <p class="wizard-success-text">{{ m.wizard.successText }}</p>
        <button type="button" class="submit-btn" @click="emit('close')">{{ m.wizard.done }}</button>
      </div>
    </div>
  </div>
</template>
