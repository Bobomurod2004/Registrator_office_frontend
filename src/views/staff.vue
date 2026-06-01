<script setup lang="ts">
import { ref } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import { useStaffStore } from '@/stores/staff'

const staffStore = useStaffStore()

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
    <h1>Xodim qo'shish</h1>
    <p class="services-subtitle">Yangi xodimni ro'yxatga qo'shing va xodimlar ro'yxatini boshqaring.</p>

    <div class="appeal-grid">
      <form class="appeal-form" @submit.prevent="addStaff">
        <h3>Yangi xodim</h3>

        <label class="field">
          <span class="field-label">F.I.Sh.</span>
          <input v-model="form.name" type="text" class="field-input" placeholder="Ism familiya" />
        </label>

        <label class="field">
          <span class="field-label">Lavozim</span>
          <input v-model="form.position" type="text" class="field-input" placeholder="Masalan: Registrator" />
        </label>

        <label class="field">
          <span class="field-label">Bo'lim</span>
          <input v-model="form.department" type="text" class="field-input" placeholder="Bo'lim nomi" />
        </label>

        <label class="field">
          <span class="field-label">Telefon</span>
          <input v-model="form.phone" type="text" class="field-input" placeholder="+998 ..." />
        </label>

        <button type="submit" class="submit-btn">Qo'shish</button>
        <p v-if="submitted" class="form-success">Xodim qo'shildi.</p>
      </form>

      <div class="staff-table-wrap">
        <table class="staff-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>F.I.Sh.</th>
              <th>Lavozim</th>
              <th>Bo'lim</th>
              <th>Telefon</th>
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
