<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useLocaleStore } from '@/stores/locale'

const props = defineProps<{ lastUpdatedAt: Date; refreshing: boolean }>()
const emit = defineEmits<{ refresh: [] }>()

const localeStore = useLocaleStore()
const m = computed(() => localeStore.m)

const now = ref(new Date())
let timer: number | undefined

onMounted(() => {
  timer = window.setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
})

function timeOf(date: Date) {
  return date.toLocaleTimeString('en-GB', { hour12: false })
}

const timeLabel = computed(() => timeOf(now.value))
const dateLabel = computed(() => {
  const d = now.value
  const month = m.value.statistics.fullMonths[d.getMonth()]
  return `${d.getDate()} ${month} ${d.getFullYear()}`
})
const weekdayLabel = computed(() => m.value.statistics.weekdays[now.value.getDay()])
const updatedTimeLabel = computed(() => timeOf(props.lastUpdatedAt))
</script>

<template>
  <div class="live-clock-v2">
    <span class="live-badge-v2"><span class="live-dot-v2" />{{ m.statistics.live }}</span>

    <div class="clock-rings">
      <span class="clock-ring clock-ring-a" />
      <span class="clock-ring clock-ring-b" />
      <span class="clock-ring clock-ring-c" />
      <span class="clock-spark clock-spark-1" />
      <span class="clock-spark clock-spark-2" />
      <span class="clock-spark clock-spark-3" />

      <div class="clock-face">
        <strong class="clock-time">{{ timeLabel }}</strong>
        <span class="clock-date">{{ dateLabel }}</span>
        <span class="clock-weekday">{{ weekdayLabel }}</span>
      </div>
    </div>

    <button class="clock-updated-pill" type="button" :class="{ spinning: refreshing }" @click="emit('refresh')">
      <span>{{ m.statistics.lastUpdated }}: {{ updatedTimeLabel }}</span>
      <svg viewBox="0 0 24 24">
        <path d="M17.65 6.35A8 8 0 1 0 19.94 13h-2.06a6 6 0 1 1-1.65-5.65L13 10h7V3l-2.35 3.35Z" />
      </svg>
    </button>
  </div>
</template>
