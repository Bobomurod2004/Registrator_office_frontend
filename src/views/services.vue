<script setup lang="ts">
import { computed, ref } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import { useLocaleStore } from '@/stores/locale'
import type { ServiceTab } from '@/i18n/messages'

const localeStore = useLocaleStore()
const m = computed(() => localeStore.m)

const tabKeys: ServiceTab[] = ['all', 'docs', 'finance', 'research', 'academic']
const activeTab = ref<ServiceTab>('all')

const visibleServices = computed(() => m.value.services.items[activeTab.value])
</script>

<template>
  <DashboardLayout>
    <h1>{{ m.services.title }}</h1>
    <p class="services-subtitle">{{ m.services.subtitle }}</p>

    <div class="services-tabs">
      <button
        v-for="key in tabKeys"
        :key="key"
        class="btn service-tab-btn"
        :class="{ active: activeTab === key }"
        @click="activeTab = key"
      >
        {{ m.services.tabs[key] }}
      </button>
    </div>

    <div class="row g-3 services-grid">
      <div v-for="service in visibleServices" :key="service.title" class="col-12 col-md-6 col-xl-4">
        <article class="service-card">
          <h3>{{ service.title }}</h3>
          <p>{{ service.description }}</p>
          <button class="btn service-open-btn" type="button">{{ m.services.open }}</button>
        </article>
      </div>
    </div>
  </DashboardLayout>
</template>
