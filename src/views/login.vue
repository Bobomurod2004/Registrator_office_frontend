<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { AuthMethod } from '@/stores/auth'
import { useAuthStore } from '@/stores/auth'
import { useLocaleStore } from '@/stores/locale'
import AppLogo from '@/components/AppLogo.vue'

const authStore = useAuthStore()
const router = useRouter()
const localeStore = useLocaleStore()
const m = computed(() => localeStore.m)

const typedWord = ref('')
let typingTimer: number | null = null

const loginMethods = computed(() => [
  {
    id: 'staff' as AuthMethod,
    title: m.value.login.methods.staff.title,
    description: m.value.login.methods.staff.description,
    accent: 'staff',
    icon: 'staff',
  },
  {
    id: 'student' as AuthMethod,
    title: m.value.login.methods.student.title,
    description: m.value.login.methods.student.description,
    accent: 'student',
    icon: 'student',
  },
  {
    id: 'oneid' as AuthMethod,
    title: m.value.login.methods.oneid.title,
    description: m.value.login.methods.oneid.description,
    accent: 'oneid',
    icon: 'oneid',
  },
])

const username = ref('')
const password = ref('')
const showPassword = ref(false)

async function handleSubmit() {
  const ok = await authStore.loginWithPassword(username.value, password.value)
  if (ok) await router.push({ path: authStore.homePath })
}

// OAuth (HEMIS/OneID) hozircha o'chirilgan — backend tayyor bo'lgach yoqiladi.
const oauthEnabled = false

function startTypingLoop() {
  let wordIndex = 0
  let charIndex = 0
  let deleting = false
  let pauseSteps = 0

  typingTimer = window.setInterval(() => {
    if (pauseSteps > 0) {
      pauseSteps -= 1
      return
    }

    const words = m.value.login.rotating
    const current = words[wordIndex % words.length] ?? ''

    if (!deleting) {
      charIndex += 1
      typedWord.value = current.slice(0, charIndex)
      if (charIndex >= current.length) {
        deleting = true
        pauseSteps = 26
      }
    } else {
      charIndex -= 1
      typedWord.value = current.slice(0, charIndex)
      if (charIndex <= 0) {
        deleting = false
        wordIndex = (wordIndex + 1) % words.length
        pauseSteps = 4
      }
    }
  }, 95)
}

onMounted(() => {
  startTypingLoop()
})

onBeforeUnmount(() => {
  if (typingTimer !== null) window.clearInterval(typingTimer)
})
</script>

<template>
  <div class="login-page">
    <div class="login-shell">
      <div class="login-card">
        <!-- Left showcase -->
        <section class="showcase">
          <span class="showcase-orb orb-a" aria-hidden="true" />
          <span class="showcase-orb orb-b" aria-hidden="true" />

          <div class="showcase-content">
            <span class="showcase-pill">
              <svg viewBox="0 0 24 24" role="presentation">
                <path
                  d="M12 1 3 5v6c0 5 3.8 9.7 9 11 5.2-1.3 9-6 9-11V5l-9-4Zm-1.2 14.2-3.5-3.5 1.4-1.4 2.1 2.1 4.9-4.9 1.4 1.4-6.3 6.3Z"
                />
              </svg>
              {{ m.login.pill }}
            </span>

            <h1 class="showcase-title">
              {{ m.login.titlePrefix }}
              <span class="typed">{{ typedWord }}<i class="caret" /></span>
            </h1>
            <p class="showcase-text">{{ m.login.showcaseText }}</p>
          </div>
        </section>

        <!-- Right auth panel -->
        <section class="auth-panel">
          <div class="auth-brand">
            <AppLogo size="md" />
            <span class="brand-copy">
              <strong>UzSWLU Registrar</strong>
              <small>{{ m.brand.gateway }}</small>
            </span>
          </div>

          <div class="auth-heading">
            <h2>{{ m.login.heading }}</h2>
            <p>{{ m.login.subheading }}</p>
          </div>

          <form class="login-form" @submit.prevent="handleSubmit">
            <label class="field">
              <span class="field-label">{{ m.login.loginLabel }}</span>
              <input
                v-model="username"
                type="text"
                class="field-input"
                :placeholder="m.login.loginPlaceholder"
                autocomplete="username"
              />
            </label>

            <label class="field">
              <span class="field-label">{{ m.login.passwordLabel }}</span>
              <span class="field-input-group">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  class="field-input"
                  :placeholder="m.login.passwordPlaceholder"
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  class="password-toggle"
                  :aria-label="showPassword ? m.login.hidePassword : m.login.showPassword"
                  @click="showPassword = !showPassword"
                >
                  <svg v-if="showPassword" viewBox="0 0 24 24" role="presentation">
                    <path
                      d="M3.5 3.5 20.5 20.5M9.9 9.9a3 3 0 0 0 4.2 4.2M6.4 6.6C4 8.2 2.3 10.4 1.5 12c1.6 3.4 5.4 7 10.5 7 1.8 0 3.4-.4 4.8-1.1M10.6 5.1C11 5 11.5 5 12 5c5.1 0 8.9 3.6 10.5 7-.6 1.3-1.5 2.6-2.7 3.8"
                    />
                  </svg>
                  <svg v-else viewBox="0 0 24 24" role="presentation">
                    <path
                      d="M1.5 12C3.1 8.6 6.9 5 12 5s8.9 3.6 10.5 7C20.9 15.4 17.1 19 12 19S3.1 15.4 1.5 12Z"
                    />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </span>
            </label>

            <p v-if="authStore.error" class="form-error">{{ authStore.error }}</p>

            <button type="submit" class="submit-btn" :disabled="authStore.passwordLoading">
              <span
                v-if="authStore.passwordLoading"
                class="spinner-border spinner-border-sm"
              />
              <span>{{ m.login.submit }}</span>
            </button>
          </form>

          <div class="auth-divider"><span>{{ m.login.orVia }}</span></div>

          <div class="method-list">
            <button
              v-for="method in loginMethods"
              :key="method.id"
              type="button"
              class="method-btn"
              :class="[method.accent, { 'is-soon': !oauthEnabled }]"
              :disabled="!oauthEnabled"
              :aria-disabled="!oauthEnabled"
            >
              <span class="method-icon">
                <!-- <svg v-if="method.icon === 'staff'" viewBox="0 0 24 24" role="presentation">
                  <path
                    d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.3 0-6 1.9-6 4.2V20h12v-1.8c0-2.3-2.7-4.2-6-4.2ZM19 6h-2V4h-2v2h-2v2h2v2h2V8h2V6Z"
                  />
                </svg>  -->
                <img
                  v-if="method.icon === 'staff'"
                  src="/iconka.png"
                  alt="Hodimlar uchun login"
                  class="method-icon-image"
                >
                
                <svg v-else-if="method.icon === 'student'" viewBox="0 0 24 24" role="presentation">
                  <path
                    d="m12 3 9 4.5-9 4.5L3 7.5 12 3Zm-6.9 7.1V14c0 2.1 3.1 3.8 6.9 3.8s6.9-1.7 6.9-3.8v-3.9L12 14l-6.9-3.9Z"
                  />
                </svg>
                <img
                  v-else
                  src="/one_id.ico"
                  alt="OneID login"
                  class="method-icon-image"
                >
              </span>

              <span class="method-copy">
                <strong>{{ method.title }}</strong>
                <small>{{ method.description }}</small>
              </span>

              <span class="soon-badge">{{ m.login.soon }}</span>
            </button>
          </div>

          <p class="auth-foot">
            <svg viewBox="0 0 24 24" role="presentation">
              <path
                d="M12 1 3 5v6c0 5 3.8 9.7 9 11 5.2-1.3 9-6 9-11V5l-9-4Zm0 10.9h7c-.5 3.6-3 6.8-7 8V12H5V6.3l7-3.1v8.7Z"
              />
            </svg>
            {{ m.login.secured }}
          </p>
        </section>
      </div>
    </div>
  </div>
</template>
