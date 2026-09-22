<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import { useStaffStore, type EmployeeLookupResult } from '@/stores/staff'
import { useRolesStore } from '@/stores/roles'
import { useLocaleStore } from '@/stores/locale'
import { extractApiError } from '@/services/http'

const staffStore = useStaffStore()
const rolesStore = useRolesStore()
const localeStore = useLocaleStore()
const m = computed(() => localeStore.m)

/** Rollar endi SuperAdmin tomonidan dinamik boshqariladi (/api/v1/auth/roles/).
 * Xodim qo'shish/tahrirlash oynasida `student` va `super_admin` kodli rollar
 * ko'rsatilmaydi — talaba bu yerdan qo'shilmaydi, SuperAdmin roli esa
 * xavfsizlik uchun shu umumiy forma orqali berilmaydi (avvalgi xatti-harakat). */
const assignableRoles = computed(() =>
  rolesStore.roles.filter((r) => r.code !== 'student' && r.code !== 'super_admin'),
)

function roleCodeById(id: number | ''): string {
  if (!id) return ''
  return rolesStore.roles.find((r) => r.id === id)?.code ?? ''
}

/** Faqat shu kodli rollar login+parol bilan kiradi — shu sabab parol maydoni faqat shularda ko'rsatiladi. */
function isPasswordRole(roleId: number | '') {
  const code = roleCodeById(roleId)
  return code === 'department_admin' || code === 'super_admin'
}

const employeeId = ref('')
const searching = ref(false)
const searchError = ref('')
const lookupResult = ref<EmployeeLookupResult | null>(null)

const form = ref({
  role: '' as number | '',
  department: '' as number | '',
  email: '',
  phone: '',
  password: '',
})
const creating = ref(false)
const createError = ref('')
const createdMessage = ref(false)

onMounted(() => {
  staffStore.fetchMembers()
  staffStore.fetchDepartments()
  rolesStore.fetchRoles()
})

async function search() {
  const id = employeeId.value.trim()
  if (!id) return

  searching.value = true
  searchError.value = ''
  lookupResult.value = null
  form.value = { role: '', department: '', email: '', phone: '', password: '' }

  try {
    lookupResult.value = await staffStore.lookupEmployee(id)
  } catch (err) {
    searchError.value = extractApiError(err, m.value.staff.lookupError)
  } finally {
    searching.value = false
  }
}

const foundName = computed(() => lookupResult.value?.user?.full_name || lookupResult.value?.full_name || '')
const foundDepartment = computed(
  () => lookupResult.value?.user?.department_name || lookupResult.value?.department_name || '',
)

async function addStaff() {
  if (!lookupResult.value || lookupResult.value.exists || !form.value.role) return

  creating.value = true
  createError.value = ''

  try {
    await staffStore.createMember({
      employee_id_number: employeeId.value.trim(),
      full_name: foundName.value || undefined,
      role: form.value.role,
      department: form.value.department || null,
      email: form.value.email.trim() || undefined,
      phone: form.value.phone.trim() || undefined,
      password: isPasswordRole(form.value.role) ? form.value.password.trim() || undefined : undefined,
    })
    createdMessage.value = true
    window.setTimeout(() => (createdMessage.value = false), 3000)
    employeeId.value = ''
    lookupResult.value = null
    form.value = { role: '', department: '', email: '', phone: '', password: '' }
  } catch (err) {
    createError.value = extractApiError(err, m.value.staff.createError)
  } finally {
    creating.value = false
  }
}

const editingRoleId = ref<number | null>(null)
const editingRoleValue = ref<number | ''>('')
const editingRolePassword = ref('')
const roleSaving = ref(false)
const roleError = ref('')

function startEditRole(memberId: number, currentRoleId: number) {
  editingRoleId.value = memberId
  editingRoleValue.value = currentRoleId
  editingRolePassword.value = ''
  roleError.value = ''
}

function cancelEditRole() {
  editingRoleId.value = null
  editingRoleValue.value = ''
  editingRolePassword.value = ''
  roleError.value = ''
}

async function saveRole(memberId: number) {
  if (!editingRoleValue.value) return

  roleSaving.value = true
  roleError.value = ''

  try {
    await staffStore.updateRole(
      memberId,
      editingRoleValue.value,
      isPasswordRole(editingRoleValue.value) ? editingRolePassword.value.trim() || undefined : undefined,
    )
    cancelEditRole()
  } catch (err) {
    roleError.value = extractApiError(err, m.value.staff.roleUpdateError)
  } finally {
    roleSaving.value = false
  }
}

const removingId = ref<number | null>(null)
const removing = ref(false)
const removeError = ref('')

function startRemove(memberId: number) {
  removingId.value = memberId
  removeError.value = ''
}

function cancelRemove() {
  removingId.value = null
  removeError.value = ''
}

async function confirmRemove(memberId: number) {
  removing.value = true
  removeError.value = ''

  try {
    await staffStore.removeMember(memberId)
    removingId.value = null
  } catch (err) {
    removeError.value = extractApiError(err, m.value.staff.removeError)
  } finally {
    removing.value = false
  }
}
</script>

<template>
  <DashboardLayout>
    <h1>{{ m.staff.title }}</h1>
    <p class="services-subtitle">{{ m.staff.subtitle }}</p>

    <div class="appeal-grid">
      <form class="appeal-form" @submit.prevent="search">
        <h3>{{ m.staff.newStaff }}</h3>

        <label class="field">
          <span class="field-label">{{ m.staff.employeeId }}</span>
          <input
            v-model="employeeId"
            type="text"
            class="field-input"
            :placeholder="m.staff.employeeIdPlaceholder"
          />
        </label>

        <button type="submit" class="submit-btn" :disabled="searching || !employeeId.trim()">
          {{ searching ? m.staff.searching : m.staff.search }}
        </button>

        <p v-if="searchError" class="form-error">{{ searchError }}</p>

        <template v-if="lookupResult">
          <p v-if="lookupResult.exists" class="form-error">{{ m.staff.alreadyExists }}</p>

          <template v-else>
            <p class="form-success">{{ m.staff.foundInHemis }}</p>
            <div class="lookup-box">
              <p v-if="foundName" class="lookup-info">
                <strong>{{ m.staff.name }}:</strong> {{ foundName }}
              </p>
              <p v-if="foundDepartment" class="lookup-info">
                <strong>{{ m.staff.hemisDepartment }}:</strong> {{ foundDepartment }}
              </p>
            </div>

            <label class="field">
              <span class="field-label">{{ m.staff.role }}</span>
              <span class="select-wrap">
                <select v-model="form.role" class="field-input">
                  <option value="" disabled>{{ m.staff.rolePlaceholder }}</option>
                  <option v-for="role in assignableRoles" :key="role.id" :value="role.id">
                    {{ role.name }}
                  </option>
                </select>
                <svg class="select-arrow" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
              </span>
            </label>

            <label class="field">
              <span class="field-label">{{ m.staff.department }}</span>
              <span class="select-wrap">
                <select v-model="form.department" class="field-input">
                  <option value="">{{ m.staff.departmentPlaceholder }}</option>
                  <option v-for="dept in staffStore.departments" :key="dept.id" :value="dept.id">
                    {{ dept.name_uz }}
                  </option>
                </select>
                <svg class="select-arrow" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
              </span>
            </label>

            <label class="field">
              <span class="field-label">{{ m.staff.phone }}</span>
              <input v-model="form.phone" type="text" class="field-input" placeholder="+998 ..." />
            </label>

            <label class="field">
              <span class="field-label">{{ m.staff.email }}</span>
              <input v-model="form.email" type="email" class="field-input" placeholder="email@example.com" />
            </label>

            <label v-if="isPasswordRole(form.role)" class="field">
              <span class="field-label">{{ m.staff.passwordLabel }}</span>
              <input
                v-model="form.password"
                type="password"
                class="field-input"
                :placeholder="m.staff.passwordPlaceholder"
                autocomplete="new-password"
              />
              <small class="field-hint">{{ m.staff.passwordHint }}</small>
            </label>

            <button type="button" class="submit-btn" :disabled="creating || !form.role" @click="addStaff">
              {{ creating ? m.staff.adding : m.staff.add }}
            </button>

            <p v-if="createError" class="form-error">{{ createError }}</p>
            <p v-if="createdMessage" class="form-success">{{ m.staff.added }}</p>
          </template>
        </template>
      </form>

      <div class="staff-table-wrap">
        <p v-if="staffStore.error" class="form-error">{{ m.staff.loadError }}</p>
        <table class="staff-table">
          <thead>
            <tr>
              <th>{{ m.staff.colId }}</th>
              <th>{{ m.staff.name }}</th>
              <th>{{ m.staff.role }}</th>
              <th>{{ m.staff.department }}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in staffStore.members" :key="member.id">
              <td>{{ member.hemis_id }}</td>
              <td>{{ member.full_name }}</td>
              <td>
                <template v-if="editingRoleId === member.id">
                  <div class="role-edit-row">
                    <span class="select-wrap role-edit-select">
                      <select v-model="editingRoleValue" class="field-input">
                        <option v-for="role in assignableRoles" :key="role.id" :value="role.id">
                          {{ role.name }}
                        </option>
                      </select>
                      <svg class="select-arrow" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
                    </span>
                    <button
                      class="role-save-btn"
                      type="button"
                      title="Saqlash"
                      :disabled="roleSaving"
                      @click="saveRole(member.id)"
                    >
                      <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                    </button>
                    <button class="role-cancel-btn" type="button" title="Bekor qilish" @click="cancelEditRole">
                      ×
                    </button>
                  </div>
                  <input
                    v-if="isPasswordRole(editingRoleValue)"
                    v-model="editingRolePassword"
                    type="password"
                    class="field-input role-edit-password"
                    :placeholder="m.staff.passwordPlaceholder"
                    autocomplete="new-password"
                  >
                  <small v-if="isPasswordRole(editingRoleValue)" class="field-hint">{{ m.staff.passwordHint }}</small>
                  <p v-if="roleError" class="form-error role-edit-error">{{ roleError }}</p>
                </template>
                <button
                  v-else
                  class="role-display-btn"
                  type="button"
                  :title="m.staff.editRole"
                  @click="startEditRole(member.id, member.role)"
                  :disabled="!rolesStore.roles.length"
                >
                  {{ member.role_display }}
                  <svg class="role-edit-icon" viewBox="0 0 24 24">
                    <path
                      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25ZM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z"
                    />
                  </svg>
                </button>
              </td>
              <td>{{ member.department_name || '—' }}</td>
              <td>
                <template v-if="removingId === member.id">
                  <div class="role-edit-row">
                    <button
                      class="staff-remove-confirm"
                      type="button"
                      :title="m.staff.removeConfirm"
                      :disabled="removing"
                      @click="confirmRemove(member.id)"
                    >
                      <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                    </button>
                    <button class="staff-remove-cancel" type="button" :title="m.staff.removeCancel" @click="cancelRemove">
                      ×
                    </button>
                  </div>
                  <p v-if="removeError" class="form-error role-edit-error">{{ removeError }}</p>
                </template>
                <button v-else class="staff-remove" type="button" :title="m.staff.remove" @click="startRemove(member.id)">
                  <svg viewBox="0 0 24 24">
                    <path
                      d="M9 3h6a1 1 0 0 1 1 1v1h5v2H3V5h5V4a1 1 0 0 1 1-1Zm-3 6h12l-1 12H7L6 9Zm3 2v8h1v-8H9Zm4 0v8h1v-8h-1Z"
                    />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </DashboardLayout>
</template>
