import { defineStore } from 'pinia'
import { ref } from 'vue'
import { http } from '@/services/http'

export type AuthMethod = 'staff' | 'student' | 'oneid'

const AUTH_URLS: Record<AuthMethod, string> = {
  staff: '/auth/hemis/staff',
  student: '/auth/hemis/student',
  oneid: '/auth/oneid',
}

export const useAuthStore = defineStore('auth', () => {
  const loadingMethod = ref<AuthMethod | null>(null)

  async function beginLogin(method: AuthMethod) {
    loadingMethod.value = method

    try {
      // Optional pre-auth ping to keep axios integration ready for backend handshakes.
      await http.get('/auth/health')
    } catch {
      // Health-check can fail in early UI stage; continue to redirect flow.
    } finally {
      window.location.href = AUTH_URLS[method]
      loadingMethod.value = null
    }
  }

  return {
    loadingMethod,
    beginLogin,
  }
})
