<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import ServiceCard from '@/components/ServiceCard.vue'
import RequestWizardModal from '@/components/RequestWizardModal.vue'
import { useLocaleStore } from '@/stores/locale'
import { useServicesStore, type Service, type ServiceCategory } from '@/stores/services'
import type { ServiceTab, ServiceTabKey } from '@/i18n/messages'

const localeStore = useLocaleStore()
const m = computed(() => localeStore.m)
const servicesStore = useServicesStore()

const CATEGORY_META: Record<ServiceCategory, { color: string; icon: string; tab: ServiceTabKey }> = {
  reference: {
    color: '#0f6b42',
    icon: 'M6 4h9l3 3v13H6V4Zm8 1.5V8h2.5L14 5.5ZM8 11h8v1.5H8V11Zm0 3h8v1.5H8V14Zm0 3h5v1.5H8V17Z',
    tab: 'docs',
  },
  financial: {
    color: '#2f6dff',
    icon: 'M2 5h20a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm0 4h22v2H2V9Zm2 5h6v2H4v-2Z',
    tab: 'finance',
  },
  science: {
    color: '#c2660f',
    icon: 'M9 2h6v2h-1v5.2l4.4 8.1A2 2 0 0 1 16.6 21H7.4a2 2 0 0 1-1.8-3.7L10 9.2V4H9V2Zm2 2v5.6l-.9 1.7h3.8L13 9.6V4h-2Z',
    tab: 'research',
  },
  academic: {
    color: '#1f9e6a',
    icon: 'M12 2 1 8l11 6 9-4.9V17h2V8L12 2Zm0 8.4L4.2 6.4 12 4l7.8 2.4L12 10.4ZM5 12.2v3.6c0 2 3.1 3.6 7 3.6s7-1.6 7-3.6v-3.6l-7 3.8-7-3.8Z',
    tab: 'academic',
  },
}

const activeTab = ref<ServiceTab>('all')

function serviceName(service: Service) {
  if (localeStore.locale === 'RU') return service.name_ru || service.name_uz
  if (localeStore.locale === 'EN') return service.name_en || service.name_uz
  return service.name_uz
}

function serviceDescription(service: Service) {
  if (localeStore.locale === 'RU') return service.description_ru || service.description_uz
  return service.description_uz
}

const tabKeys: ServiceTab[] = ['all', 'docs', 'finance', 'research', 'academic']

const TAB_COLOR: Record<ServiceTabKey, string> = {
  docs: CATEGORY_META.reference.color,
  finance: CATEGORY_META.financial.color,
  research: CATEGORY_META.science.color,
  academic: CATEGORY_META.academic.color,
}

const visibleServices = computed(() =>
  activeTab.value === 'all'
    ? servicesStore.services
    : servicesStore.services.filter((s) => CATEGORY_META[s.category].tab === activeTab.value),
)

function tabCount(key: ServiceTab) {
  if (key === 'all') return servicesStore.services.length
  return servicesStore.services.filter((s) => CATEGORY_META[s.category].tab === key).length
}

const statusLabelFor = (isActive: boolean) => (isActive ? m.value.services.statusAvailable : m.value.services.statusUnavailable)

const detailsService = ref<Service | null>(null)
function openDetails(service: Service) {
  detailsService.value = service
}
function closeDetails() {
  detailsService.value = null
}

const wizardService = ref<Service | null>(null)
function openWizard(service: Service) {
  wizardService.value = service
}
function closeWizard() {
  wizardService.value = null
}

onMounted(() => servicesStore.fetchServices())
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
        <span
          class="svc-tab-dot"
          :class="{ 'svc-tab-dot-mixed': key === 'all' }"
          :style="key === 'all' ? {} : { background: TAB_COLOR[key as ServiceTabKey] }"
        />
        {{ m.services.tabs[key] }}
        <span class="svc-tab-count">{{ tabCount(key) }}</span>
      </button>
    </div>

    <p v-if="servicesStore.error" class="form-error">{{ servicesStore.error }}</p>
    <p v-else-if="!servicesStore.loading && !visibleServices.length" class="appeal-empty">
      {{ m.services.noServices }}
    </p>

    <div class="row g-3 services-grid">
      <div v-for="service in visibleServices" :key="service.id" class="col-12 col-md-6 col-xl-4">
        <ServiceCard
          :title="serviceName(service)"
          :description="serviceDescription(service)"
          :sla="service.sla_text"
          :status="service.is_active ? 'available' : 'unavailable'"
          :color="CATEGORY_META[service.category].color"
          :icon-path="CATEGORY_META[service.category].icon"
          :details-label="m.services.details"
          :apply-label="m.services.apply"
          :status-label="statusLabelFor(service.is_active)"
          @details="openDetails(service)"
          @apply="openWizard(service)"
        />
      </div>
    </div>

    <div v-if="detailsService" class="svc-modal-backdrop" @click.self="closeDetails">
      <div class="svc-modal">
        <span class="svc-card-icon svc-modal-icon" :style="{ background: CATEGORY_META[detailsService.category].color }">
          <svg viewBox="0 0 24 24"><path :d="CATEGORY_META[detailsService.category].icon" /></svg>
        </span>
        <h3>{{ serviceName(detailsService) }}</h3>
        <p class="svc-modal-desc">{{ serviceDescription(detailsService) }}</p>
        <div class="svc-card-meta">
          <span class="svc-sla-badge">{{ m.services.slaLabel }}: {{ detailsService.sla_text }}</span>
          <span class="svc-status" :class="`svc-status-${detailsService.is_active ? 'available' : 'unavailable'}`">
            <span class="svc-status-dot" />
            {{ statusLabelFor(detailsService.is_active) }}
          </span>
        </div>
        <div class="svc-card-actions">
          <button type="button" class="appeal-btn" @click="closeDetails">{{ m.services.closeModal }}</button>
          <button
            type="button"
            class="submit-btn svc-apply-btn"
            :disabled="!detailsService.is_active"
            @click="openWizard(detailsService); closeDetails()"
          >
            {{ m.services.apply }}
          </button>
        </div>
      </div>
    </div>

    <RequestWizardModal v-if="wizardService" :service="wizardService" @close="closeWizard" />
  </DashboardLayout>
</template>
