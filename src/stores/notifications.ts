import { defineStore } from 'pinia'
import { ref } from 'vue'
import { http } from '@/services/http'

export interface AppNotification {
  id: number
  type: string
  type_display: string
  channel: 'sms' | 'email' | 'push' | 'in_app'
  channel_display: string
  title: string
  message: string
  request: number | null
  is_read: boolean
  created_at: string
}

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<AppNotification[]>([])
  const unreadCount = ref(0)
  const loading = ref(false)

  async function fetchNotifications() {
    loading.value = true
    try {
      const { data } = await http.get('/api/v1/notifications/', { params: { page_size: 30 } })
      notifications.value = data.results ?? data
    } catch {
      notifications.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchUnreadCount() {
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
