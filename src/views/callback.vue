<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { extractApiError } from '@/services/http'

const router = useRouter()
const authStore = useAuthStore()
const errorMessage = ref<string | null>(null)

onMounted(async () => {
  const query = new URLSearchParams(window.location.search)
  try {
    await authStore.handleCallback(query)
    await router.replace({ path: authStore.homePath })
  } catch (err) {
    // Backend qaytargan aniq sabab bo'lsa (masalan validatsiya xatosi) shuni,
    // aks holda o'zimiz throw qilgan xabarni (masalan "kod topilmadi") ko'rsatamiz.
    const backendDetail = extractApiError(err, '')
    errorMessage.value = backendDetail || (err instanceof Error ? err.message : 'Kirish amalga oshmadi.')
  }
})

function backToLogin() {
  void router.replace({ name: 'login' })
}
</script>

<template>
  <div class="callback-page">
    <div class="callback-card">
      <template v-if="!errorMessage">
        <span class="callback-spinner" aria-hidden="true" />
        <h2>Kirish amalga oshirilmoqda…</h2>
        <p>Iltimos kuting, ma'lumotlaringiz tekshirilmoqda.</p>
      </template>

      <template v-else>
        <span class="callback-error-mark" aria-hidden="true">!</span>
        <h2>Kirishda xatolik</h2>
        <p>{{ errorMessage }}</p>
        <button class="callback-retry" @click="backToLogin">Login sahifasiga qaytish</button>
      </template>
    </div>
  </div>
</template>
