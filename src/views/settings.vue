<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import { http } from '@/services/http'
import { useAuthStore } from '@/stores/auth'
import { useLocaleStore } from '@/stores/locale'
import type { UserProfile } from '@/stores/auth'

const authStore = useAuthStore()
const localeStore = useLocaleStore()
const m = computed(() => localeStore.m)

const profile = ref<UserProfile | null>(null)
const profileLoading = ref(true)
const profileLoadError = ref(false)

const profileForm = ref({ full_name: '', email: '', phone: '', gender: '' })
const profileSaving = ref(false)
const profileSaved = ref(false)
const profileError = ref('')

const passwordForm = ref({ old_password: '', new_password: '', confirm_password: '' })
const passwordSaving = ref(false)
const passwordSaved = ref(false)
const passwordError = ref('')

async function loadProfile() {
  profileLoading.value = true
  profileLoadError.value = false
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
    profileLoadError.value = true
  } finally {
    profileLoading.value = false
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
  } catch {
    profileError.value = m.value.settings.loadError
  } finally {
    profileSaving.value = false
  }
}

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
  } catch {
    passwordError.value = m.value.settings.passwordError
  } finally {
    passwordSaving.value = false
  }
}
</script>

<template>
  <DashboardLayout>
    <h1>{{ m.settings.title }}</h1>
    <p class="services-subtitle">{{ m.settings.subtitle }}</p>

    <p v-if="profileLoadError" class="form-error">{{ m.settings.loadError }}</p>

    <div v-else class="settings-grid">
      <form class="appeal-form" @submit.prevent="saveProfile">
        <h3>{{ m.settings.profileTitle }}</h3>

        <div v-if="profileLoading" class="settings-skeleton" />
        <template v-else>
          <div class="settings-readonly">
            <span>{{ m.settings.hemisId }}: <strong>{{ profile?.hemis_id }}</strong></span>
            <span>{{ m.settings.role }}: <strong>{{ profile?.role_display }}</strong></span>
            <span>
              {{ m.settings.department }}:
              <strong>{{ profile?.department_name || m.settings.departmentNotSet }}</strong>
            </span>
          </div>

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
            <select v-model="profileForm.gender" class="field-input">
              <option value="">{{ m.settings.genderNotSet }}</option>
              <option value="male">{{ m.settings.genderMale }}</option>
              <option value="female">{{ m.settings.genderFemale }}</option>
            </select>
          </label>

          <button type="submit" class="submit-btn" :disabled="profileSaving">
            <span v-if="profileSaving" class="spinner-border spinner-border-sm" />
            <span>{{ m.settings.saveProfile }}</span>
          </button>
          <p v-if="profileSaved" class="form-success">{{ m.settings.profileSaved }}</p>
          <p v-if="profileError" class="form-error">{{ profileError }}</p>
        </template>
      </form>

      <form class="appeal-form" @submit.prevent="changePassword">
        <h3>{{ m.settings.passwordTitle }}</h3>

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

        <button type="submit" class="submit-btn" :disabled="passwordSaving">
          <span v-if="passwordSaving" class="spinner-border spinner-border-sm" />
          <span>{{ m.settings.changePassword }}</span>
        </button>
        <p v-if="passwordSaved" class="form-success">{{ m.settings.passwordChanged }}</p>
        <p v-if="passwordError" class="form-error">{{ passwordError }}</p>
      </form>
    </div>
  </DashboardLayout>
</template>

<style scoped>
.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}

.settings-readonly {
  display: grid;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(47, 109, 255, 0.06);
  font-size: 13px;
  color: #45618a;
  margin-bottom: 4px;
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

@media (max-width: 860px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}

:root[data-theme='dark'] .settings-readonly {
  background: rgba(110, 160, 255, 0.1);
  color: #9fb6d8;
}
</style>
