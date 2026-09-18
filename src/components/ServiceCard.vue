<script setup lang="ts">
defineProps<{
  title: string
  description: string
  sla: string
  status: 'available' | 'unavailable'
  color: string
  iconPath: string
  detailsLabel: string
  applyLabel: string
  statusLabel: string
}>()

defineEmits<{ details: []; apply: [] }>()
</script>

<template>
  <article class="svc-card">
    <span class="svc-card-icon" :style="{ background: color }">
      <svg viewBox="0 0 24 24"><path :d="iconPath" /></svg>
    </span>

    <h3 class="svc-card-title">{{ title }}</h3>
    <p class="svc-card-desc">{{ description }}</p>

    <div class="svc-card-meta">
      <span class="svc-sla-badge">
        <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 10.6-4.3 2.5-.7-1.2 3.5-2V6h1.5v6.6Z" /></svg>
        {{ sla }}
      </span>
      <span class="svc-status" :class="`svc-status-${status}`">
        <span class="svc-status-dot" />
        {{ statusLabel }}
      </span>
    </div>

    <div class="svc-card-actions">
      <button type="button" class="appeal-btn svc-details-btn" @click="$emit('details')">{{ detailsLabel }}</button>
      <button
        type="button"
        class="submit-btn svc-apply-btn"
        :disabled="status === 'unavailable'"
        @click="$emit('apply')"
      >
        {{ applyLabel }}
      </button>
    </div>
  </article>
</template>
