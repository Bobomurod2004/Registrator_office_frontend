<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useLocaleStore } from '@/stores/locale'
import { isMobileMenuOpen, closeMobileMenu } from '@/composables/mobileNav'

type IconName =
  | 'services'
  | 'info'
  | 'appeals'
  | 'staff'
  | 'stats'
  | 'grant'
  | 'contacts'
  | 'audit'
  | 'anticorruption'
  | 'leadership'
  | 'reports'

interface MenuLink {
  to: string
  label: string
  icon: IconName
}

const authStore = useAuthStore()
const localeStore = useLocaleStore()
const m = computed(() => localeStore.m)

const profileName = computed(() => authStore.session?.name ?? 'Foydalanuvchi')
const profileRole = computed(() =>
  authStore.isStaff ? m.value.roles.staff : m.value.roles.student,
)
const profileInitial = computed(() => profileName.value.charAt(0).toUpperCase())
const profileImageUrl = computed(() => authStore.session?.imageUrl ?? null)

const baseMenuLinks = computed<MenuLink[]>(() =>
  authStore.isStaff
    ? [
        { to: '/statistics', label: m.value.menu.statistics, icon: 'stats' },
        { to: '/appeals', label: m.value.menu.appeals, icon: 'appeals' },
        ...(authStore.canManageUsers
          ? [{ to: '/staff', label: m.value.menu.addStaff, icon: 'staff' as IconName }]
          : []),
        { to: '/grant', label: m.value.menu.grant, icon: 'grant' },
        { to: '/info', label: m.value.menu.info, icon: 'info' },
        { to: '/contacts', label: m.value.menu.contacts, icon: 'contacts' },
        { to: '/anti-corruption', label: m.value.menu.antiCorruption, icon: 'anticorruption' },
        ...(authStore.isSuperAdmin
          ? [{ to: '/audit-log', label: m.value.menu.auditLog, icon: 'audit' as IconName }]
          : []),
      ]
    : [
        { to: '/services', label: m.value.menu.services, icon: 'services' },
        { to: '/appeals', label: m.value.menu.myAppeals, icon: 'appeals' },
        { to: '/info', label: m.value.menu.info, icon: 'info' },
        { to: '/contacts', label: m.value.menu.contacts, icon: 'contacts' },
        { to: '/anti-corruption', label: m.value.menu.antiCorruption, icon: 'anticorruption' },
      ],
)

/** "Rahbariyat murojaatlari" — ruxsat backend tomonidan hisoblanadi (mas'ul yoki SuperAdmin). */
const menuLinks = computed<MenuLink[]>(() => {
  // Rahbar rejimi: faqat rahbariyat murojaatlari va Ma'lumotlar (qolganlari yashirin).
  const leadership: MenuLink = { to: '/leadership-appeals', label: m.value.leadership.menuLabel, icon: 'leadership' }
  // Korrupsiya xabarlari — `handle_corruption_reports` ruxsati bilan (SuperAdmin avtomatik olmaydi).
  const corruption: MenuLink[] = authStore.can('handle_corruption_reports')
    ? [{ to: '/corruption-reports', label: m.value.corruption.menuLabel, icon: 'reports' }]
    : []
  const info: MenuLink = { to: '/info', label: m.value.menu.info, icon: 'info' }
  if (authStore.isLeaderOnly) return [leadership, ...corruption, info]
  // Korrupsiya xodimi: korrupsiya xabarlari, "Korrupsiyaga qarshi kurashish" bo'limi va Ma'lumotlar.
  if (authStore.isCorruptionOnly) {
    return [
      ...corruption,
      { to: '/anti-corruption', label: m.value.menu.antiCorruption, icon: 'anticorruption' },
      info,
    ]
  }
  const extra = authStore.can('handle_leadership_appeals') ? [leadership] : []
  return [...baseMenuLinks.value, ...extra, ...corruption]
})

onMounted(closeMobileMenu)
</script>

<template>
  <div class="services-page">
    <div class="container-fluid py-4 px-3 px-lg-4">
      <div class="services-layout">
        <div
          v-if="isMobileMenuOpen"
          class="sidebar-backdrop"
          @click="closeMobileMenu"
        />

        <aside class="services-sidebar" :class="{ 'is-open': isMobileMenuOpen }">
          <div class="sidebar-header-row">
            <div class="sidebar-header">{{ m.brand.office }}</div>
            <button class="sidebar-close-btn" type="button" aria-label="Yopish" @click="closeMobileMenu">
              ×
            </button>
          </div>

          <router-link class="profile-card" to="/profile">
            <img v-if="profileImageUrl" class="profile-avatar" :src="profileImageUrl" alt="" />
            <span v-else class="profile-avatar profile-avatar-initial">{{ profileInitial }}</span>
            <div class="profile-meta">
              <strong>{{ profileName }}</strong>
              <span>{{ profileRole }}</span>
            </div>
          </router-link>

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
                <svg v-else-if="link.icon === 'contacts'" viewBox="0 0 24 24" role="presentation">
                  <path
                    d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1L6.6 10.8Z"
                  />
                </svg>
                <svg v-else-if="link.icon === 'audit'" viewBox="0 0 24 24" role="presentation">
                  <path
                    d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm-1.2 13.2L7 11.4l1.4-1.4 2.4 2.4 4.8-4.8L17 9l-6.2 6.2Z"
                  />
                </svg>
                <svg v-else-if="link.icon === 'leadership'" viewBox="0 0 24 24" role="presentation">
                  <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8Zm2 13h14v1H5v-1Z" />
                </svg>
                <svg v-else-if="link.icon === 'reports'" viewBox="0 0 24 24" role="presentation">
                  <path
                    d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm8 1.5V8h4.5L14 3.5ZM12 10a3 3 0 0 0-3 3v1H8v5h8v-5h-1v-1a3 3 0 0 0-3-3Zm0 1.5a1.5 1.5 0 0 1 1.5 1.5v1h-3v-1a1.5 1.5 0 0 1 1.5-1.5Z"
                  />
                </svg>
                <svg v-else-if="link.icon === 'anticorruption'" viewBox="0 0 24 24" role="presentation">
                  <path
                    d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm1 13h-2v-2h2v2Zm0-4h-2V7h2v4Z"
                  />
                </svg>
                <svg v-else viewBox="0 0 24 24" role="presentation">
                  <path d="m12 3 9 4.5-9 4.5L3 7.5 12 3Zm-6.9 7.1V14c0 2.1 3.1 3.8 6.9 3.8s6.9-1.7 6.9-3.8v-3.9L12 14l-6.9-3.9Z" />
                </svg>
              </span>
              <span>{{ link.label }}</span>
            </router-link>
          </nav>

          <nav class="sidebar-menu secondary">
            <router-link class="menu-item" active-class="active" to="/profile">
              <span class="menu-icon">
                <svg viewBox="0 0 24 24" role="presentation">
                  <path
                    d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.3 0-6 1.9-6 4.2V20h12v-1.8c0-2.3-2.7-4.2-6-4.2Z"
                  />
                </svg>
              </span>
              <span>{{ m.menu.profile }}</span>
            </router-link>
            <router-link v-if="authStore.isSuperAdmin" class="menu-item" active-class="active" to="/settings">
              <span class="menu-icon">
                <svg viewBox="0 0 24 24" role="presentation">
                  <path
                    d="m19.4 13-.9-.5a7.1 7.1 0 0 0 0-1l.9-.5a1 1 0 0 0 .4-1.3l-1-1.8a1 1 0 0 0-1.2-.5l-1 .4a6.4 6.4 0 0 0-.9-.5l-.1-1.1a1 1 0 0 0-1-.9h-2.1a1 1 0 0 0-1 .9l-.1 1.1a6.4 6.4 0 0 0-.9.5l-1-.4a1 1 0 0 0-1.2.5l-1 1.8a1 1 0 0 0 .4 1.3l.9.5a7.1 7.1 0 0 0 0 1l-.9.5a1 1 0 0 0-.4 1.3l1 1.8a1 1 0 0 0 1.2.5l1-.4a6.4 6.4 0 0 0 .9.5l.1 1.1a1 1 0 0 0 1 .9h2.1a1 1 0 0 0 1-.9l.1-1.1a6.4 6.4 0 0 0 .9-.5l1 .4a1 1 0 0 0 1.2-.5l1-1.8a1 1 0 0 0-.4-1.3ZM12 15.5A3.5 3.5 0 1 1 15.5 12 3.5 3.5 0 0 1 12 15.5Z"
                  />
                </svg>
              </span>
              <span>{{ m.menu.settings }}</span>
            </router-link>
          </nav>
        </aside>

        <section class="services-content">
          <slot />
        </section>
      </div>
    </div>
  </div>
</template>
