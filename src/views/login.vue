<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { AuthMethod } from '@/stores/auth'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const rotatingWords = ['students', 'faculty', 'registrar staff', 'researchers']
const typedWord = ref('')
let typingTimer: number | null = null

const loginMethods = computed(() => [
  {
    id: 'staff' as AuthMethod,
    title: 'HEMIS · Staff',
    description: 'Academic and registrar employees',
    accent: 'staff',
    icon: 'staff',
  },
  {
    id: 'student' as AuthMethod,
    title: 'HEMIS · Student',
    description: 'Undergraduate and graduate students',
    accent: 'student',
    icon: 'student',
  },
  {
    id: 'oneid' as AuthMethod,
    title: 'OneID',
    description: 'Government unified identity provider',
    accent: 'oneid',
    icon: 'oneid',
  },
])

function handleLogin(method: AuthMethod) {
  void authStore.beginLogin(method)
}

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

    const current = rotatingWords[wordIndex]

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
        wordIndex = (wordIndex + 1) % rotatingWords.length
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
              Secure HEMIS &amp; OneID
            </span>

            <h1 class="showcase-title">
              Digital services for
              <span class="typed">{{ typedWord }}<i class="caret" /></span>
            </h1>
            <p class="showcase-text">
              A unified registrar platform delivering trusted, fast and secure academic services for
              the entire university community.
            </p>
          </div>
        </section>

        <!-- Right auth panel -->
        <section class="auth-panel">
          <div class="auth-brand">
            <span class="brand-mark">
              <svg viewBox="0 0 64 64" role="presentation">
                <path
                  d="M32 8 56 20 32 32 8 20 32 8Zm-16 19v11c0 5 8 10 16 10s16-5 16-10V27l-16 8-16-8Z"
                />
              </svg>
            </span>
            <span class="brand-copy">
              <strong>UzSWLU Registrar</strong>
              <small>Digital identity gateway</small>
            </span>
          </div>

          <div class="auth-heading">
            <h2>Sign in to continue</h2>
            <p>Choose your authentication method to access the registrar office.</p>
          </div>

          <div class="method-list">
            <button
              v-for="method in loginMethods"
              :key="method.id"
              class="method-btn"
              :class="method.accent"
              :disabled="authStore.loadingMethod === method.id"
              @click="handleLogin(method.id)"
            >
              <span class="method-icon">
                <svg v-if="method.icon === 'staff'" viewBox="0 0 24 24" role="presentation">
                  <path
                    d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.3 0-6 1.9-6 4.2V20h12v-1.8c0-2.3-2.7-4.2-6-4.2ZM19 6h-2V4h-2v2h-2v2h2v2h2V8h2V6Z"
                  />
                </svg>
                <svg v-else-if="method.icon === 'student'" viewBox="0 0 24 24" role="presentation">
                  <path
                    d="m12 3 9 4.5-9 4.5L3 7.5 12 3Zm-6.9 7.1V14c0 2.1 3.1 3.8 6.9 3.8s6.9-1.7 6.9-3.8v-3.9L12 14l-6.9-3.9Z"
                  />
                </svg>
                <svg v-else viewBox="0 0 24 24" role="presentation">
                  <path
                    d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 4a6 6 0 0 1 0 12 6 6 0 1 1 0-12Z"
                  />
                </svg>
              </span>

              <span class="method-copy">
                <strong>{{ method.title }}</strong>
                <small>{{ method.description }}</small>
              </span>

              <span
                v-if="authStore.loadingMethod === method.id"
                class="spinner-border spinner-border-sm method-tail"
              />
              <svg v-else class="method-arrow" viewBox="0 0 24 24" role="presentation">
                <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>

          <p class="auth-foot">
            <svg viewBox="0 0 24 24" role="presentation">
              <path
                d="M12 1 3 5v6c0 5 3.8 9.7 9 11 5.2-1.3 9-6 9-11V5l-9-4Zm0 10.9h7c-.5 3.6-3 6.8-7 8V12H5V6.3l7-3.1v8.7Z"
              />
            </svg>
            Protected by government-grade encryption
          </p>
        </section>
      </div>
    </div>
  </div>
</template>
