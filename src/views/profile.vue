<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import { extractApiError, http } from '@/services/http'
import { useLocaleStore } from '@/stores/locale'
import { useAuthStore } from '@/stores/auth'
import { parseProfileJson } from '@/utils/profileJson'
import type { UserProfile } from '@/stores/auth'

const localeStore = useLocaleStore()
const authStore = useAuthStore()
const m = computed(() => localeStore.m)

const profile = ref<UserProfile | null>(null)
const loading = ref(true)
const loadError = ref(false)

const profileForm = ref({ full_name: '', email: '', phone: '', gender: '' })
const profileSaving = ref(false)
const profileSaved = ref(false)
const profileError = ref('')

async function loadProfile() {
  loading.value = true
  loadError.value = false
  try {
    const { data } = await http.get<UserProfile>('/api/v1/auth/me/')
    profile.value = data
    profileForm.value = {
      full_name: data.full_name ?? '',
      email: data.email ?? '',
      phone: data.phone ?? '',
      gender: data.gender ?? '',
    }
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

onMounted(loadProfile)

async function saveProfile() {
  profileSaving.value = true
  profileSaved.value = false
  profileError.value = ''

  try {
    const { data } = await http.patch<UserProfile>('/api/v1/auth/me/', {
      full_name: profileForm.value.full_name.trim(),
      email: profileForm.value.email.trim() || null,
      phone: profileForm.value.phone.trim() || null,
      gender: profileForm.value.gender || null,
    })
    profile.value = data
    authStore.syncProfile(data)
    profileSaved.value = true
    window.setTimeout(() => (profileSaved.value = false), 2500)
  } catch (err) {
    profileError.value = extractApiError(err, m.value.settings.loadError)
  } finally {
    profileSaving.value = false
  }
}

const passwordForm = ref({ old_password: '', new_password: '', confirm_password: '' })
const passwordSaving = ref(false)
const passwordSaved = ref(false)
const passwordError = ref('')

async function changePassword() {
  passwordError.value = ''
  passwordSaved.value = false

  if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
    passwordError.value = m.value.settings.passwordMismatch
    return
  }

  passwordSaving.value = true
  try {
    await http.post('/api/v1/auth/me/change-password/', {
      old_password: passwordForm.value.old_password,
      new_password: passwordForm.value.new_password,
    })
    passwordForm.value = { old_password: '', new_password: '', confirm_password: '' }
    passwordSaved.value = true
    window.setTimeout(() => (passwordSaved.value = false), 2500)
  } catch (err) {
    passwordError.value = extractApiError(err, m.value.settings.passwordError)
  } finally {
    passwordSaving.value = false
  }
}

const avatarInputRef = ref<HTMLInputElement | null>(null)
const avatarUploading = ref(false)
const avatarUploaded = ref(false)
const avatarError = ref('')

async function onAvatarFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  avatarUploading.value = true
  avatarUploaded.value = false
  avatarError.value = ''

  try {
    const formData = new FormData()
    formData.append('image', file)
    await http.patch('/api/v1/auth/profile/', formData)
    await authStore.fetchProfileImage()
    avatarUploaded.value = true
    window.setTimeout(() => (avatarUploaded.value = false), 2500)
  } catch (err) {
    avatarError.value = extractApiError(err, m.value.settings.avatarError)
  } finally {
    avatarUploading.value = false
    input.value = ''
  }
}

const avatarDeleting = ref(false)
const avatarDeleted = ref(false)
const avatarDeleteError = ref('')

/** Foydalanuvchi tizim orqali o'zi yuklagan rasmni o'chiradi (HEMIS'dan
 * kelgan rasmga tegmaydi — o'chirilgandan keyin, agar HEMIS rasmi bo'lsa,
 * avtomatik o'sha ko'rsatiladi). */
async function deleteAvatar() {
  avatarDeleting.value = true
  avatarDeleted.value = false
  avatarDeleteError.value = ''
  try {
    await authStore.deleteProfileImage()
    avatarDeleted.value = true
    window.setTimeout(() => (avatarDeleted.value = false), 2500)
  } catch (err) {
    avatarDeleteError.value = extractApiError(err, m.value.settings.avatarDeleteError)
  } finally {
    avatarDeleting.value = false
  }
}

const hemisSyncing = ref(false)
const hemisSynced = ref(false)
const hemisSyncError = ref('')

async function syncFromHemis() {
  hemisSyncing.value = true
  hemisSynced.value = false
  hemisSyncError.value = ''
  try {
    await authStore.syncFromHemis()
    await loadProfile()
    hemisSynced.value = true
    window.setTimeout(() => (hemisSynced.value = false), 2500)
  } catch (err) {
    hemisSyncError.value = extractApiError(err, m.value.settings.hemisSyncError)
  } finally {
    hemisSyncing.value = false
  }
}

const initial = computed(() => (profile.value?.full_name || profile.value?.hemis_id || 'U').charAt(0).toUpperCase())

const languageLabel = computed(() => {
  const lang = profile.value?.language
  if (!lang) return m.value.profile.notSet
  return (m.value.profile.languageValues as Record<string, string>)[lang] ?? lang
})

const memberSince = computed(() => {
  if (!profile.value?.created_at) return m.value.profile.notSet
  return new Date(profile.value.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

interface ProfileDetailItem {
  label: string
  value: string
}

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatProfileValue(value: unknown): string {
  if (typeof value === 'boolean') return value ? m.value.profile.yes : m.value.profile.no
  if (value === null || value === undefined || value === '') return m.value.profile.notSet
  return String(value)
}

function buildDetailItems(raw: unknown, knownLabels: Record<string, string>): ProfileDetailItem[] {
  const parsed = parseProfileJson(raw)
  if (!parsed) {
    if (raw == null || raw === '') return []
    return [{ label: '', value: typeof raw === 'string' ? raw : JSON.stringify(raw) }]
  }
  return Object.entries(parsed).map(([key, value]) => ({
    label: knownLabels[key] ?? humanizeKey(key),
    value: formatProfileValue(value),
  }))
}

const studentProfileItems = computed(() =>
  buildDetailItems(profile.value?.student_profile, m.value.profile.studentFields),
)
const employeeProfileItems = computed(() =>
  buildDetailItems(profile.value?.employee_profile, m.value.profile.employeeFields),
)
</script>

<template>
  <DashboardLayout>
    <h1>{{ m.profile.title }}</h1>
    <p class="services-subtitle">{{ m.profile.subtitle }}</p>

    <p v-if="loadError" class="form-error">{{ m.settings.loadError }}</p>
    <div v-else-if="loading" class="settings-skeleton" />

    <article v-else-if="profile" class="profile-view-card">
      <div class="profile-view-head">
        <img
          v-if="authStore.session?.imageUrl"
          class="profile-avatar profile-view-avatar"
          :src="authStore.session.imageUrl"
          alt=""
        />
        <span v-else class="profile-avatar profile-avatar-initial profile-view-avatar">{{ initial }}</span>
        <div class="profile-view-heading">
          <h2>{{ profile.full_name || profile.hemis_id }}</h2>
          <span class="profile-role-badge">{{ profile.role_display }}</span>
        </div>
        <div class="avatar-actions">
          <input
            ref="avatarInputRef"
            type="file"
            accept="image/*"
            class="visually-hidden"
            @change="onAvatarFileChange"
          />
          <button type="button" class="btn appeal-btn" :disabled="avatarUploading" @click="avatarInputRef?.click()">
            <span v-if="avatarUploading" class="spinner-border spinner-border-sm" />
            <span>{{ m.settings.avatarUpload }}</span>
          </button>
          <button
            v-if="authStore.session?.imageUrl"
            type="button"
            class="btn appeal-btn req-cancel-btn"
            :disabled="avatarDeleting"
            @click="deleteAvatar"
          >
            <span v-if="avatarDeleting" class="spinner-border spinner-border-sm" />
            <span>{{ m.settings.avatarDelete }}</span>
          </button>
          <button type="button" class="btn appeal-btn" :disabled="hemisSyncing" @click="syncFromHemis">
            <span v-if="hemisSyncing" class="spinner-border spinner-border-sm" />
            <span>{{ m.settings.hemisSync }}</span>
          </button>
        </div>
      </div>

      <p v-if="avatarUploaded" class="form-success">{{ m.settings.avatarUploaded }}</p>
      <p v-if="avatarError" class="form-error">{{ avatarError }}</p>
      <p v-if="avatarDeleted" class="form-success">{{ m.settings.avatarDeleted }}</p>
      <p v-if="avatarDeleteError" class="form-error">{{ avatarDeleteError }}</p>
      <p v-if="hemisSynced" class="form-success">{{ m.settings.hemisSynced }}</p>
      <p v-if="hemisSyncError" class="form-error">{{ hemisSyncError }}</p>

      <form class="profile-edit-grid" @submit.prevent="saveProfile">
        <label class="field">
          <span class="field-label">{{ m.settings.fullName }}</span>
          <input
            v-model="profileForm.full_name"
            type="text"
            class="field-input"
            :placeholder="m.settings.fullNamePlaceholder"
          />
        </label>

        <label class="field">
          <span class="field-label">{{ m.settings.email }}</span>
          <input
            v-model="profileForm.email"
            type="email"
            class="field-input"
            :placeholder="m.settings.emailPlaceholder"
          />
        </label>

        <label class="field">
          <span class="field-label">{{ m.settings.phone }}</span>
          <input
            v-model="profileForm.phone"
            type="tel"
            class="field-input"
            :placeholder="m.settings.phonePlaceholder"
          />
        </label>

        <label class="field">
          <span class="field-label">{{ m.settings.gender }}</span>
          <span class="select-wrap">
            <select v-model="profileForm.gender" class="field-input">
              <option value="">{{ m.settings.genderNotSet }}</option>
              <option value="male">{{ m.settings.genderMale }}</option>
              <option value="female">{{ m.settings.genderFemale }}</option>
            </select>
            <svg class="select-arrow" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
          </span>
        </label>

        <div class="profile-edit-actions">
          <button type="submit" class="submit-btn" :disabled="profileSaving">
            <span v-if="profileSaving" class="spinner-border spinner-border-sm" />
            <span>{{ m.settings.saveProfile }}</span>
          </button>
          <p v-if="profileSaved" class="form-success">{{ m.settings.profileSaved }}</p>
          <p v-if="profileError" class="form-error">{{ profileError }}</p>
        </div>
      </form>

      <div class="profile-view-grid">
        <div class="profile-view-item">
          <span class="field-label">{{ m.settings.hemisId }}</span>
          <strong>{{ profile.hemis_id }}</strong>
        </div>
        <div class="profile-view-item">
          <span class="field-label">{{ m.settings.role }}</span>
          <strong>{{ profile.role_display }}</strong>
        </div>
        <div class="profile-view-item">
          <span class="field-label">{{ m.settings.department }}</span>
          <strong>{{ profile.department_name || m.settings.departmentNotSet }}</strong>
        </div>
        <div class="profile-view-item">
          <span class="field-label">{{ m.settings.language }}</span>
          <strong>{{ languageLabel }}</strong>
        </div>
        <div class="profile-view-item">
          <span class="field-label">{{ m.profile.memberSince }}</span>
          <strong>{{ memberSince }}</strong>
        </div>
        <div class="profile-view-item">
          <span class="field-label">{{ m.profile.accountStatus }}</span>
          <strong :class="{ 'profile-status-locked': profile.is_locked }">
            {{ profile.is_locked ? m.profile.statusLocked : m.profile.statusActive }}
          </strong>
        </div>
      </div>

      <div v-if="studentProfileItems.length" class="profile-view-subsection">
        <h3>{{ m.profile.studentProfile }}</h3>
        <div class="profile-view-grid">
          <div
            v-for="item in studentProfileItems"
            :key="item.label"
            class="profile-view-item"
            :class="{ 'profile-view-item-raw': !item.label }"
          >
            <span v-if="item.label" class="field-label">{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
      </div>

      <div v-if="employeeProfileItems.length" class="profile-view-subsection">
        <h3>{{ m.profile.employeeProfile }}</h3>
        <div class="profile-view-grid">
          <div v-for="item in employeeProfileItems" :key="item.label" class="profile-view-item">
            <span v-if="item.label" class="field-label">{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
      </div>
    </article>

    <article v-if="!loading && authStore.isAdmin" class="appeal-form profile-password-card">
      <h3>{{ m.settings.passwordTitle }}</h3>

      <form class="profile-password-form" @submit.prevent="changePassword">
        <label class="field">
          <span class="field-label">{{ m.settings.oldPassword }}</span>
          <input
            v-model="passwordForm.old_password"
            type="password"
            class="field-input"
            autocomplete="current-password"
          />
        </label>

        <label class="field">
          <span class="field-label">{{ m.settings.newPassword }}</span>
          <input
            v-model="passwordForm.new_password"
            type="password"
            class="field-input"
            autocomplete="new-password"
          />
        </label>

        <label class="field">
          <span class="field-label">{{ m.settings.confirmPassword }}</span>
          <input
            v-model="passwordForm.confirm_password"
            type="password"
            class="field-input"
            autocomplete="new-password"
          />
        </label>

        <div class="profile-edit-actions">
          <button type="submit" class="submit-btn" :disabled="passwordSaving">
            <span v-if="passwordSaving" class="spinner-border spinner-border-sm" />
            <span>{{ m.settings.changePassword }}</span>
          </button>
          <p v-if="passwordSaved" class="form-success">{{ m.settings.passwordChanged }}</p>
          <p v-if="passwordError" class="form-error">{{ passwordError }}</p>
        </div>
      </form>
    </article>
  </DashboardLayout>
</template>

<style scoped>
.profile-view-card {
  padding: 24px;
  border-radius: 18px;
  border: 1px solid rgba(193, 211, 240, 0.7);
  background: #fbfdff;
}

.profile-view-head {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.profile-view-avatar {
  width: 64px;
  height: 64px;
  font-size: 24px;
}

.profile-view-heading {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.profile-view-heading h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #123056;
}

.profile-role-badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(47, 109, 255, 0.12);
  color: #2f6dff;
  font-size: 12px;
  font-weight: 700;
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile-edit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  padding: 16px;
  margin-bottom: 20px;
  border-radius: 14px;
  background: rgba(47, 109, 255, 0.04);
}

.profile-edit-actions {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.profile-password-card {
  margin-top: 20px;
  max-width: 480px;
}

.profile-password-form {
  display: grid;
  gap: 14px;
}

.profile-view-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.profile-view-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(47, 109, 255, 0.06);
  min-width: 0;
}

.profile-view-item strong {
  font-size: 14px;
  color: #123056;
  overflow-wrap: break-word;
  word-break: break-word;
}

.profile-view-item-raw {
  grid-column: 1 / -1;
}

.profile-view-item-raw strong {
  font-family: 'Courier New', ui-monospace, monospace;
  font-size: 12.5px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.profile-view-subsection {
  margin-top: 20px;
}

.profile-view-subsection h3 {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 700;
  color: #123056;
}

.profile-status-locked {
  color: #d9534f;
}

.settings-skeleton {
  height: 220px;
  border-radius: 14px;
  background: linear-gradient(90deg, rgba(203, 217, 240, 0.4), rgba(203, 217, 240, 0.7), rgba(203, 217, 240, 0.4));
  background-size: 200% 100%;
  animation: settings-shimmer 1.3s ease-in-out infinite;
}

@keyframes settings-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

:root[data-theme='dark'] .profile-view-card {
  border-color: rgba(94, 119, 165, 0.4);
  background: rgba(20, 30, 50, 0.6);
}

:root[data-theme='dark'] .profile-view-heading h2 {
  color: #e4eeff;
}

:root[data-theme='dark'] .profile-view-subsection h3 {
  color: #e4eeff;
}

:root[data-theme='dark'] .profile-role-badge {
  background: rgba(110, 160, 255, 0.18);
  color: #9fc3ff;
}

:root[data-theme='dark'] .profile-view-item {
  background: rgba(110, 160, 255, 0.1);
}

:root[data-theme='dark'] .profile-view-item strong {
  color: #e4eeff;
}

:root[data-theme='dark'] .profile-status-locked {
  color: #ff8a80;
}

:root[data-theme='dark'] .profile-edit-grid {
  background: rgba(110, 160, 255, 0.08);
}

@media (max-width: 640px) {
  .profile-view-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
