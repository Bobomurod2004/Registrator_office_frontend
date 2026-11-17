<script setup lang="ts">
import { computed } from 'vue'
import { useLocaleStore } from '@/stores/locale'
import type { HemisEmployeeResult } from '@/services/staffLookup'
import { staffDetailGroups } from '@/utils/staffDetail'

/**
 * Bitta xodim qidiruv natijasi: qisqa qator (ochiladigan tugma) + to'liq ma'lumot
 * paneli. Talaba kartasi (StudentSearchItem) bilan bir xil ko'rinishda.
 * Ochiq holat ota komponentda boshqariladi (`expanded` / `toggle`).
 */
const props = defineProps<{
  employee: HemisEmployeeResult
  expanded: boolean
}>()

defineEmits<{ toggle: [] }>()

const localeStore = useLocaleStore()
const m = computed(() => localeStore.m)
const groups = computed(() => staffDetailGroups(props.employee, m.value))
const initial = computed(() => (props.employee.fullName || '?').charAt(0).toUpperCase())
</script>

<template>
  <div class="app-search-student">
    <button
      type="button"
      class="app-search-student-summary"
      :aria-expanded="expanded"
      @click="$emit('toggle')"
    >
      <img v-if="employee.imageUrl" class="app-search-avatar" :src="employee.imageUrl" alt="" />
      <span v-else class="app-search-avatar app-search-avatar-fallback">{{ initial }}</span>
      <span class="app-search-student-info">
        <strong>{{ employee.fullName || employee.hemisId }}</strong>
        <span class="person-staff-badge" :class="{ 'is-in-system': employee.inSystem }">
          {{ employee.inSystem ? m.person.inSystem : m.header.notInSystem }}
        </span>
        <span>{{ m.settings.hemisId }}: {{ employee.hemisId }}</span>
        <span v-if="employee.department">{{ employee.department }}</span>
      </span>
      <svg class="app-search-chevron" :class="{ open: expanded }" viewBox="0 0 24 24">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>

    <div v-if="expanded" class="app-search-details">
      <section v-for="group in groups" :key="group.title" class="app-search-detail-group">
        <h4>{{ group.title }}</h4>
        <dl>
          <template v-for="item in group.items" :key="item.label">
            <dt>{{ item.label }}</dt>
            <dd>{{ item.value }}</dd>
          </template>
        </dl>
      </section>
    </div>
  </div>
</template>
