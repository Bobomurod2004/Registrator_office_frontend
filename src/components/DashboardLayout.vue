<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

type IconName =
  | 'services'
  | 'info'
  | 'appeals'
  | 'staff'
  | 'stats'
  | 'grant'

interface MenuLink {
  to: string
  label: string
  icon: IconName
}

const authStore = useAuthStore()

const profileName = computed(() => authStore.session?.name ?? 'Foydalanuvchi')
const profileRole = computed(() => authStore.session?.role ?? '')
const profileInitial = computed(() => profileName.value.charAt(0).toUpperCase())

const staffMenu: MenuLink[] = [
  { to: '/statistics', label: 'Statistika', icon: 'stats' },
  { to: '/appeals', label: 'Murojaatlar', icon: 'appeals' },
  { to: '/staff', label: "Xodim qo'shish", icon: 'staff' },
  { to: '/grant', label: "Ta'lim granti", icon: 'grant' },
  { to: '/info', label: 'Info', icon: 'info' },
]

const studentMenu: MenuLink[] = [
  { to: '/services', label: 'Tezkor xizmatlar', icon: 'services' },
  { to: '/appeals', label: 'Mening murojaatlarim', icon: 'appeals' },
  { to: '/grant', label: "Ta'lim granti", icon: 'grant' },
  { to: '/info', label: 'Info', icon: 'info' },
]

const menuLinks = computed(() => (authStore.isStaff ? staffMenu : studentMenu))
</script>

<template>
  <div class="services-page">
    <div class="container-fluid py-4 px-3 px-lg-4">
      <div class="services-layout">
        <aside class="services-sidebar">
          <div class="sidebar-header">Registrator Ofis</div>

          <div class="profile-card">
            <span class="profile-avatar profile-avatar-initial">{{ profileInitial }}</span>
            <div class="profile-meta">
              <strong>{{ profileName }}</strong>
              <span>{{ profileRole }}</span>
            </div>
          </div>

          <nav class="sidebar-menu">
            <router-link
              v-for="link in menuLinks"
              :key="link.to"
              class="menu-item"
              active-class="active"
              :to="link.to"
            >
              <span class="menu-icon">
                <svg v-if="link.icon === 'services'" viewBox="0 0 24 24" role="presentation">
                  <path
                    d="M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h10v2H4v-2Zm12.5-1.3 4.2 4.2-1.4 1.4-4.2-4.2V15h1.4Z"
                  />
                </svg>
                <svg v-else-if="link.icon === 'info'" viewBox="0 0 24 24" role="presentation">
                  <path
                    d="M11 7h2V5h-2v2Zm0 12h2v-8h-2v8Zm1-17a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8Z"
                  />
                </svg>
                <svg v-else-if="link.icon === 'appeals'" viewBox="0 0 24 24" role="presentation">
                  <path
                    d="M4 4h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H8l-4 4V5a1 1 0 0 1 1-1Zm3 5v2h10V9H7Zm0 4v2h7v-2H7Z"
                  />
                </svg>
                <svg v-else-if="link.icon === 'staff'" viewBox="0 0 24 24" role="presentation">
                  <path
                    d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-8 1a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm0 2c-2.3 0-5 1.2-5 3.5V20h6v-2.5c0-1 .4-1.9 1-2.7A8 8 0 0 0 8 14Zm8 0c-2.7 0-6 1.4-6 4v2h12v-2c0-2.6-3.3-4-6-4Z"
                  />
                </svg>
                <svg v-else-if="link.icon === 'stats'" viewBox="0 0 24 24" role="presentation">
                  <path d="M3 3h2v18H3V3Zm4 10h3v8H7v-8Zm5-6h3v14h-3V7Zm5 3h3v11h-3V10Z" />
                </svg>
                <svg v-else viewBox="0 0 24 24" role="presentation">
                  <path d="m12 3 9 4.5-9 4.5L3 7.5 12 3Zm-6.9 7.1V14c0 2.1 3.1 3.8 6.9 3.8s6.9-1.7 6.9-3.8v-3.9L12 14l-6.9-3.9Z" />
                </svg>
              </span>
              <span>{{ link.label }}</span>
            </router-link>
          </nav>

          <nav class="sidebar-menu secondary">
            <a class="menu-item" href="#">
              <span class="menu-icon">
                <svg viewBox="0 0 24 24" role="presentation">
                  <path
                    d="m19.4 13-.9-.5a7.1 7.1 0 0 0 0-1l.9-.5a1 1 0 0 0 .4-1.3l-1-1.8a1 1 0 0 0-1.2-.5l-1 .4a6.4 6.4 0 0 0-.9-.5l-.1-1.1a1 1 0 0 0-1-.9h-2.1a1 1 0 0 0-1 .9l-.1 1.1a6.4 6.4 0 0 0-.9.5l-1-.4a1 1 0 0 0-1.2.5l-1 1.8a1 1 0 0 0 .4 1.3l.9.5a7.1 7.1 0 0 0 0 1l-.9.5a1 1 0 0 0-.4 1.3l1 1.8a1 1 0 0 0 1.2.5l1-.4a6.4 6.4 0 0 0 .9.5l.1 1.1a1 1 0 0 0 1 .9h2.1a1 1 0 0 0 1-.9l.1-1.1a6.4 6.4 0 0 0 .9-.5l1 .4a1 1 0 0 0 1.2-.5l1-1.8a1 1 0 0 0-.4-1.3ZM12 15.5A3.5 3.5 0 1 1 15.5 12 3.5 3.5 0 0 1 12 15.5Z"
                  />
                </svg>
              </span>
              <span>Sozlamalar</span>
            </a>
          </nav>
        </aside>

        <section class="services-content">
          <slot />
        </section>
      </div>
    </div>
  </div>
</template>
