<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { AuthMethod } from '@/stores/auth'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const baseTitle = 'Registrar Office Platform'
const baseDescription =
  'The platform provides services for students and university staff through the registrar office with secure authentication channels.'
const typedTitle = ref('')
const typedDescription = ref('')
let typingTimer: number | null = null

const loginMethods = computed(() => [
  {
    id: 'staff' as AuthMethod,
    title: 'Login via HEMIS (Staff)',
    description: 'Academic and registrar employees',
    accent: 'staff',
    icon: 'staff',
  },
  {
    id: 'student' as AuthMethod,
    title: 'Login via HEMIS (Student)',
    description: 'Undergraduate and graduate students',
    accent: 'student',
    icon: 'student',
  },
  {
    id: 'oneid' as AuthMethod,
    title: 'Login via OneID',
    description: 'Government unified identity provider',
    accent: 'oneid',
    icon: 'oneid',
  },
])

function handleLogin(method: AuthMethod) {
  void authStore.beginLogin(method)
}

function startTypingLoop() {
  const fullText = `${baseTitle}\n${baseDescription}`
  let index = 0
  let deleting = false
  let pauseSteps = 0

  typingTimer = window.setInterval(() => {
    if (pauseSteps > 0) {
      pauseSteps -= 1
      return
    }

    if (!deleting) {
      index += 1
      if (index >= fullText.length) {
        index = fullText.length
        deleting = true
        pauseSteps = 24
      }
    } else {
      index -= 1
      if (index <= 0) {
        index = 0
        deleting = false
        pauseSteps = 7
      }
    }

    const snapshot = fullText.slice(0, index).split('\n')
    typedTitle.value = snapshot[0] || ''
    typedDescription.value = snapshot[1] || ''
  }, 42)
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
    <div class="container-fluid shell px-3 px-lg-4 pb-4">
      <main class="row g-3 g-xl-4 justify-content-center align-items-stretch content-row">
        <div class="col-12 col-lg-6 d-flex justify-content-center">
          <section class="hero-panel">
            <div class="hero-overlay">
              <h1>Welcome to Academic Services</h1>
              <p>
                A unified registrar platform delivering trusted digital services for students,
                faculty, and university administration.
              </p>
            </div>
          </section>
        </div>

        <div class="col-12 col-lg-6 d-flex justify-content-center">
          <section class="auth-card p-3 p-md-4 d-flex flex-column">
            <p class="eyebrow mb-2">University Digital Portal</p>
            <h2 class="typing-line mb-2">{{ typedTitle }}</h2>
            <p class="description mb-3">{{ typedDescription }}</p>

            <div class="row g-2 g-sm-3 mt-auto">
              <div
                v-for="method in loginMethods"
                :key="method.id"
                :class="method.id === 'oneid' ? 'col-12 col-lg-12' : 'col-6 col-lg-12'"
              >
                <button
                  class="btn login-action w-100 d-flex align-items-center"
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
                  <span class="action-copy">
                    <strong>{{ method.title }}</strong>
                    <small>{{ method.description }}</small>
                  </span>
                  <span
                    v-if="authStore.loadingMethod === method.id"
                    class="spinner-border spinner-border-sm ms-auto"
                  />
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  </div>
</template>
