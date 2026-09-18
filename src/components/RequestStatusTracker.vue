<script setup lang="ts">
import { computed } from 'vue'
import { useLocaleStore } from '@/stores/locale'
import { formatDateTime } from '@/utils/formatDate'
import type { RequestStatus } from '@/stores/requests'

const props = defineProps<{
  status: RequestStatus
  slaPercent: number
  isOverdue: boolean
  isCompletedOnTime: boolean
  slaDeadline: string | null
}>()

const localeStore = useLocaleStore()
const m = computed(() => localeStore.m)

type Outcome = 'none' | 'completed' | 'rejected' | 'expired' | 'cancelled'

/** Talaba faqat 'Yangi' holatdagi murojaatni bekor qila oladi — shu sabab
 *  'cancelled' hech qachon 2-bosqichga (ko'rib chiqilish) yetmagan bo'ladi,
 *  1-bosqichdan to'g'ridan-to'g'ri tarmoqlanadi. */
const outcome = computed<Outcome>(() => {
  if (props.status === 'completed') return 'completed'
  if (props.status === 'rejected') return 'rejected'
  if (props.status === 'expired') return 'expired'
  if (props.status === 'cancelled') return 'cancelled'
  return 'none'
})

const isCancelled = computed(() => outcome.value === 'cancelled')
const step1Done = computed(() => props.status !== 'new')
const step2Active = computed(() => props.status === 'in_progress' || props.status === 'redirected')
const step2Done = computed(() => outcome.value !== 'none' && !isCancelled.value)

/** 'Yakunlandi' natijasi ikki ko'rinishda bo'ladi: o'z vaqtida (yashil) yoki
 *  muddatidan kechikib bajarilgan (qizil) — [band 44-46] bo'yicha bu farq
 *  backend hisoblagan `resolved_at` vs `sla_deadline`ga asoslanadi, shu yerda
 *  faqat taqdimot darajasida aks ettiriladi. */
const outcomeTone = computed<'green' | 'red' | 'orange' | 'neutral'>(() => {
  switch (outcome.value) {
    case 'completed':
      return props.isCompletedOnTime ? 'green' : 'red'
    case 'expired':
      return 'orange'
    case 'rejected':
    case 'cancelled':
      return 'neutral'
    default:
      return 'neutral'
  }
})

const outcomeLabel = computed(() => {
  switch (outcome.value) {
    case 'completed':
      return props.isCompletedOnTime ? m.value.appeals.completedOnTimeTag : m.value.appeals.overdueTag
    case 'rejected':
      return m.value.appeals.statuses.rejected
    case 'expired':
      return m.value.appeals.statuses.expired
    case 'cancelled':
      return m.value.appeals.statuses.cancelled
    default:
      return ''
  }
})

const RING_RADIUS = 16
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

const ringOffset = computed(() => {
  const pct = Math.min(100, Math.max(0, props.slaPercent))
  return RING_CIRCUMFERENCE * (1 - pct / 100)
})

const ringTone = computed<'blue' | 'orange' | 'red'>(() => {
  if (props.isOverdue) return 'red'
  if (props.slaPercent >= 70) return 'orange'
  return 'blue'
})

const slaTitle = computed(() => {
  if (!props.slaDeadline) return `${Math.round(props.slaPercent)}%`
  const date = formatDateTime(props.slaDeadline, localeStore.locale)
  return `${Math.round(props.slaPercent)}% • ${date}`
})
</script>

<template>
  <div class="req-tracker" :class="{ 'req-tracker-cancelled': isCancelled }">
    <div class="req-tracker-step" :class="{ done: step1Done }">
      <span class="req-tracker-dot">
        <svg v-if="step1Done" class="req-tracker-check" viewBox="0 0 24 24"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" /></svg>
      </span>
      <span class="req-tracker-label">{{ m.appeals.trackerSubmitted }}</span>
    </div>

    <span class="req-tracker-line" :class="{ filled: step1Done, cut: isCancelled }" />

    <div class="req-tracker-step" :class="{ done: step2Done, active: step2Active, skipped: isCancelled }">
      <span class="req-tracker-dot" :title="step2Active ? slaTitle : undefined">
        <svg v-if="step2Active" class="req-tracker-ring" :class="`req-tracker-ring-${ringTone}`" viewBox="0 0 36 36">
          <circle class="req-tracker-ring-track" cx="18" cy="18" r="16" />
          <circle
            class="req-tracker-ring-fill"
            cx="18"
            cy="18"
            r="16"
            :style="{ strokeDasharray: RING_CIRCUMFERENCE, strokeDashoffset: ringOffset }"
          />
        </svg>
        <svg v-if="step2Done" class="req-tracker-check" viewBox="0 0 24 24"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" /></svg>
      </span>
      <span class="req-tracker-label">{{ m.appeals.statuses.in_progress }}</span>
    </div>

    <span v-if="!isCancelled" class="req-tracker-line" :class="{ filled: step2Done }" />

    <div v-if="outcome !== 'none'" class="req-tracker-step req-tracker-outcome" :class="[outcome, `tone-${outcomeTone}`]">
      <span class="req-tracker-dot">
        <svg v-if="outcome === 'completed'" class="req-tracker-check req-tracker-check-draw" viewBox="0 0 24 24">
          <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
        </svg>
        <svg v-else-if="outcome === 'expired'" viewBox="0 0 24 24">
          <path d="M1 21h22L12 2 1 21Zm13-3h-2v-2h2v2Zm0-4h-2v-4h2v4Z" />
        </svg>
        <svg v-else-if="outcome === 'cancelled'" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2ZM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12Zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8Z" />
        </svg>
        <svg v-else viewBox="0 0 24 24">
          <path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L12 13.41l-6.29 6.3-1.42-1.42L10.59 12 4.29 5.71 5.71 4.29 12 10.59l6.29-6.3z" />
        </svg>
      </span>
      <span class="req-tracker-label">{{ outcomeLabel }}</span>
    </div>
  </div>
</template>
