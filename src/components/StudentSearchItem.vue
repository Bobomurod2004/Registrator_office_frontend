<script setup lang="ts">
import { computed } from 'vue'
import { useLocaleStore } from '@/stores/locale'
import type { StudentSearchResult } from '@/services/hemisLookup'
import { studentDetailGroups } from '@/utils/studentDetail'

/**
 * Bitta talaba qidiruv natijasi: qisqa qator (ochiladigan tugma) + to'liq
 * ma'lumot paneli. Header qidiruvi va shaxs qidiruv paneli ikkalasi ishlatadi.
 * Ochiq holat ota komponentda boshqariladi (`expanded` / `toggle`).
 */
const props = defineProps<{
  student: StudentSearchResult
  expanded: boolean
}>()

defineEmits<{ toggle: [] }>()

const localeStore = useLocaleStore()
const m = computed(() => localeStore.m)
const groups = computed(() => studentDetailGroups(props.student, m.value))
</script>

<template>
  <div class="app-search-student">
    <button
      type="button"
      class="app-search-student-summary"
      :aria-expanded="expanded"
      @click="$emit('toggle')"
    >
      <img v-if="student.photoUrl" class="app-search-avatar" :src="student.photoUrl" alt="" />
      <span v-else class="app-search-avatar app-search-avatar-fallback">
        {{ (student.fullName || '?').charAt(0).toUpperCase() }}
      </span>
      <span class="app-search-student-info">
        <strong>
          {{ student.fullName || student.hemisId }}
          <span v-if="!student.inSystem" class="app-search-not-in-system">{{ m.header.notInSystem }}</span>
        </strong>
        <span>{{ m.settings.hemisId }}: {{ student.hemisId }}</span>
        <span v-if="student.faculty">{{ m.profile.studentFields.faculty }}: {{ student.faculty }}</span>
        <span v-if="student.course || student.group">
          {{ m.profile.studentFields.course }}: {{ student.course }}
          <template v-if="student.group"> · {{ m.profile.studentFields.group }}: {{ student.group }}</template>
        </span>
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
