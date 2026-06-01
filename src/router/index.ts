import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    name: 'login',
    component: () => import('@/views/login.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/callback',
    name: 'callback',
    component: () => import('@/views/callback.vue'),
  },
  {
    path: '/services',
    name: 'services',
    component: () => import('@/views/services.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/info',
    name: 'info',
    component: () => import('@/views/info.vue'),
    meta: { requiresAuth: true },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'services' }
  }

  return true
})
