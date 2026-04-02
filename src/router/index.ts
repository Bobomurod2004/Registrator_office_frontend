import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'login',
    component: () => import('@/views/login.vue'),
  },
  {
    path: '/services',
    name: 'services',
    component: () => import('@/views/services.vue'),
  },
  {
    path: '/info',
    name: 'info',
    component: () => import('@/views/info.vue'),
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
