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
    path: '/appeals',
    name: 'appeals',
    component: () => import('@/views/appeals.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/staff',
    name: 'staff',
    component: () => import('@/views/staff.vue'),
    meta: { requiresAuth: true, staffOnly: true },
  },
  {
    path: '/statistics',
    name: 'statistics',
    component: () => import('@/views/statistics.vue'),
    meta: { requiresAuth: true, staffOnly: true },
  },
  {
    path: '/grant',
    name: 'grant',
    component: () => import('@/views/grant.vue'),
    meta: { requiresAuth: true, staffOnly: true },
  },
  {
    path: '/info',
    name: 'info',
    component: () => import('@/views/info.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/settings.vue'),
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
    return { path: auth.homePath }
  }

  if (to.meta.staffOnly && !auth.isStaff) {
    return { name: 'services' }
  }

  return true
})
