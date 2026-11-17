import { defineStore } from 'pinia'
import { ref } from 'vue'
import { http } from '@/services/http'
import { useAuthStore } from '@/stores/auth'

export interface AppNotification {
  id: number
  type: string
  type_display: string
  channel: 'sms' | 'email' | 'push' | 'in_app'
  channel_display: string
  title: string
  message: string
  /** Eski maydon (xizmat murojaati) — orqaga moslik uchun qoldirilgan. */
  request: number | null
  /** Sahifaga o'tishni shu maydon bo'yicha qiling: `request` | `appeal` | `corruption_report` | null. */
  target_type?: 'request' | 'appeal' | 'corruption_report' | null
  target_id?: number | null
  is_read: boolean
  created_at: string
}

export function notificationTarget(item: AppNotification): string | null {
  return item.target_type ?? (item.request ? 'request' : null)
}

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<AppNotification[]>([])
  const unreadCount = ref(0)
  const loading = ref(false)

  /**
   * Backend bildirishnomani faqat egasiga yuboradi, lekin turi bo'yicha filtr bermaydi.
   * Shu sabab foydalanuvchi sahifasiga kira olmaydigan turlar (masalan korrupsiya
   * xodimiga xizmat murojaatlari) ro'yxatdan chiqariladi.
   */
  async function loadVisible(): Promise<AppNotification[]> {
    const auth = useAuthStore()
    const { data } = await http.get('/api/v1/notifications/', { params: { page_size: 50 } })
    const raw: AppNotification[] = data.results ?? data ?? []
    return raw.filter((item) => auth.canSeeNotification(notificationTarget(item)))
  }

  async function fetchNotifications() {
    loading.value = true
    try {
      notifications.value = await loadVisible()
    } catch {
      notifications.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchUnreadCount() {
    // Cheklangan rejimda backend soni boshqa turlarni ham sanaydi — son ro'yxatdan hisoblanadi.
    if (useAuthStore().allowedPaths !== null) {
      try {
        const visible = await loadVisible()
        unreadCount.value = visible.filter((item) => !item.is_read).length
      } catch {
        // badge shunchaki yangilanmaydi
      }
      return
    }
    try {
      const { data } = await http.get('/api/v1/notifications/unread-count/')
      unreadCount.value = typeof data === 'number' ? data : (data.count ?? data.unread_count ?? 0)
    } catch {
      // jim tovushsiz — badge shunchaki yangilanmaydi
    }
  }

  async function markRead(id: number) {
    await http.post(`/api/v1/notifications/${id}/read/`)
    const item = notifications.value.find((n) => n.id === id)
    if (item) item.is_read = true
    await fetchUnreadCount()
  }

  async function markAllRead() {
    await http.post('/api/v1/notifications/mark-all-read/')
    notifications.value.forEach((n) => (n.is_read = true))
    unreadCount.value = 0
  }

  return { notifications, unreadCount, loading, fetchNotifications, fetchUnreadCount, markRead, markAllRead }
})
