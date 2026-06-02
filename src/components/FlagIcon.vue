<script setup lang="ts">
import { useId } from 'vue'

defineProps<{ code: 'uz' | 'ru' | 'en' }>()

const cid = useId()
</script>

<template>
  <svg class="flag-icon" viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" role="presentation">
    <defs>
      <clipPath :id="cid">
        <rect width="30" height="20" rx="3" />
      </clipPath>
    </defs>

    <g :clip-path="`url(#${cid})`">
      <!-- Uzbekistan -->
      <template v-if="code === 'uz'">
        <rect width="30" height="20" fill="#ffffff" />
        <rect width="30" height="6.4" y="0" fill="#0099b5" />
        <rect width="30" height="6.4" y="13.6" fill="#1eb53a" />
        <rect width="30" height="0.6" y="6.4" fill="#ce1126" />
        <rect width="30" height="0.6" y="13" fill="#ce1126" />
        <circle cx="5.4" cy="3.2" r="1.9" fill="#ffffff" />
        <circle cx="6.5" cy="3.2" r="1.9" fill="#0099b5" />
      </template>

      <!-- Russia -->
      <template v-else-if="code === 'ru'">
        <rect width="30" height="6.67" y="0" fill="#ffffff" />
        <rect width="30" height="6.67" y="6.67" fill="#0039a6" />
        <rect width="30" height="6.66" y="13.33" fill="#d52b1e" />
      </template>

      <!-- United Kingdom (English) -->
      <template v-else>
        <rect width="30" height="20" fill="#012169" />
        <path d="M0 0 L30 20 M30 0 L0 20" stroke="#ffffff" stroke-width="4" />
        <path d="M0 0 L30 20 M30 0 L0 20" stroke="#c8102e" stroke-width="1.8" />
        <rect x="11.5" width="7" height="20" fill="#ffffff" />
        <rect y="6.5" width="30" height="7" fill="#ffffff" />
        <rect x="13" width="4" height="20" fill="#c8102e" />
        <rect y="8" width="30" height="4" fill="#c8102e" />
      </template>
    </g>
  </svg>
</template>
