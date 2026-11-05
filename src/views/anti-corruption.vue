<script setup lang="ts">
import { computed, ref } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import { useLocaleStore } from '@/stores/locale'
import {
  DUTIES,
  HOTLINE,
  TEAM,
  TELEGRAM_BOT_URL,
  TELEGRAM_URL,
} from '@/data/antiCorruption'

const localeStore = useLocaleStore()
const m = computed(() => localeStore.m)

// Rasm yuklanmasa bosh harfli avatarga tushish uchun (fayl nomi bo'yicha).
const failedImages = ref<Set<string>>(new Set())
function onImageError(src: string) {
  failedImages.value = new Set(failedImages.value).add(src)
}
function initial(name: string) {
  return name.charAt(0).toUpperCase()
}
</script>

<template>
  <DashboardLayout>
    <div class="info-header-row">
      <div>
        <h1 class="info-page-title">{{ m.menu.antiCorruption }}</h1>
        <p class="services-subtitle">{{ m.antiCorruption.subtitle }}</p>
      </div>
    </div>

    <section class="ac-hotline">
      <img class="ac-hotline-logo" src="/anticorruption/logo.png" alt="" />
      <div class="ac-hotline-body">
        <span class="ac-hotline-label">{{ m.antiCorruption.hotline }}</span>
        <a class="ac-hotline-phone" :href="`tel:${HOTLINE.phone}`">{{ HOTLINE.display }}</a>
        <div class="ac-ext">
          <span class="ac-ext-label">{{ m.antiCorruption.extension }}:</span>
          <span v-for="ext in HOTLINE.extensions" :key="ext" class="ac-ext-chip">{{ ext }}</span>
        </div>
      </div>
      <div class="ac-hotline-actions">
        <a class="ac-action ac-action-telegram" :href="TELEGRAM_URL" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" role="presentation">
            <path d="M21.8 4.3 2.9 11.6c-1.3.5-1.3 1.2-.2 1.5l4.8 1.5 1.9 5.7c.2.6.1.8.7.8.5 0 .7-.2 1-.5l2.3-2.3 4.8 3.5c.9.5 1.5.2 1.7-.8L22.9 5.6c.3-1.2-.4-1.8-1.1-1.3ZM9.2 14.1l9.6-6c.5-.3.9-.1.5.2l-8 7.2-.3 3.2-1.8-4.6Z" />
          </svg>
          <span class="ac-action-text">
            <span class="ac-action-label">{{ m.antiCorruption.telegram }}</span>
            <strong>@uzdjtu_antikorrupsiya</strong>
          </span>
        </a>
        <a
          v-if="TELEGRAM_BOT_URL"
          class="ac-action ac-action-bot"
          :href="TELEGRAM_BOT_URL"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg viewBox="0 0 24 24" role="presentation">
            <path d="M12 2a1 1 0 0 1 1 1v1.1A7 7 0 0 1 19 11v1h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-1H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1v-1a7 7 0 0 1 6-6.9V3a1 1 0 0 1 1-1Zm-3 9.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
          </svg>
          <span class="ac-action-text">
            <span class="ac-action-label">{{ m.antiCorruption.telegramBot }}</span>
            <strong>Telegram</strong>
          </span>
        </a>
      </div>
    </section>

    <section class="ac-section">
      <h2 class="ac-section-title">{{ m.antiCorruption.team }}</h2>
      <div class="ac-team">
        <article v-for="person in TEAM" :key="person.name" class="ac-person">
          <img
            v-if="!failedImages.has(person.image)"
            class="ac-person-photo"
            :src="person.image"
            :alt="person.name"
            loading="lazy"
            @error="onImageError(person.image)"
          />
          <span v-else class="ac-person-photo ac-person-initial">{{ initial(person.name) }}</span>
          <strong class="ac-person-name">{{ person.name }}</strong>
          <span class="ac-person-position">{{ person.position }}</span>
          <span v-if="person.workHours" class="ac-person-hours">
            {{ m.antiCorruption.workHours }}: {{ person.workHours }}
          </span>
        </article>
      </div>
    </section>

    <section class="ac-section">
      <h2 class="ac-section-title">{{ m.antiCorruption.duties }}</h2>
      <ol class="ac-duties">
        <li v-for="(duty, index) in DUTIES" :key="index">{{ duty }}</li>
      </ol>
    </section>

  </DashboardLayout>
</template>
