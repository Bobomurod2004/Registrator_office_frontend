<script setup lang="ts">
import { computed, ref } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import { useStaffStore } from '@/stores/staff'
import { useLocaleStore } from '@/stores/locale'

const staffStore = useStaffStore()
const localeStore = useLocaleStore()
const m = computed(() => localeStore.m)

const form = ref({ name: '', position: '', department: '', phone: '' })
const submitted = ref(false)

function addStaff() {
  if (!form.value.name.trim() || !form.value.position.trim()) return
  staffStore.addMember({
    name: form.value.name.trim(),
    position: form.value.position.trim(),
    department: form.value.department.trim() || 'Belgilanmagan',
    phone: form.value.phone.trim() || '—',
  })
  form.value = { name: '', position: '', department: '', phone: '' }
  submitted.value = true
  window.setTimeout(() => (submitted.value = false), 2500)
}
</script>

<template>
  <DashboardLayout>
    <h1>{{ m.staff.title }}</h1>
    <p class="services-subtitle">{{ m.staff.subtitle }}</p>

    <div class="appeal-grid">
      <form class="appeal-form" @submit.prevent="addStaff">
        <h3>{{ m.staff.newStaff }}</h3>

        <label class="field">
          <span class="field-label">{{ m.staff.name }}</span>
          <input v-model="form.name" type="text" class="field-input" :placeholder="m.staff.namePlaceholder" />
        </label>

        <label class="field">
          <span class="field-label">{{ m.staff.position }}</span>
          <input v-model="form.position" type="text" class="field-input" :placeholder="m.staff.positionPlaceholder" />
        </label>

        <label class="field">
          <span class="field-label">{{ m.staff.department }}</span>
          <input v-model="form.department" type="text" class="field-input" :placeholder="m.staff.departmentPlaceholder" />
        </label>

        <label class="field">
          <span class="field-label">{{ m.staff.phone }}</span>
          <input v-model="form.phone" type="text" class="field-input" placeholder="+998 ..." />
        </label>

        <button type="submit" class="submit-btn">{{ m.staff.add }}</button>
        <p v-if="submitted" class="form-success">{{ m.staff.added }}</p>
      </form>

      <div class="staff-table-wrap">
        <table class="staff-table">
          <thead>
            <tr>
              <th>{{ m.staff.colId }}</th>
              <th>{{ m.staff.name }}</th>
              <th>{{ m.staff.position }}</th>
              <th>{{ m.staff.department }}</th>
              <th>{{ m.staff.colPhone }}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in staffStore.members" :key="member.id">
              <td>{{ member.id }}</td>
              <td>{{ member.name }}</td>
              <td>{{ member.position }}</td>
              <td>{{ member.department }}</td>
              <td>{{ member.phone }}</td>
              <td>
                <button class="staff-remove" title="O'chirish" @click="staffStore.removeMember(member.id)">
                  ×
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </DashboardLayout>
</template>
