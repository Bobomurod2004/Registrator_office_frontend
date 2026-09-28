<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import { useStaffStore, type EmployeeLookupResult } from '@/stores/staff'
import type { UserRoleAssignment } from '@/stores/auth'
import { useRolesStore, type Role } from '@/stores/roles'
import { useLocaleStore } from '@/stores/locale'
import { extractApiError } from '@/services/http'

const staffStore = useStaffStore()
const rolesStore = useRolesStore()
const localeStore = useLocaleStore()
const m = computed(() => localeStore.m)

/** Rollar endi SuperAdmin tomonidan dinamik boshqariladi (/api/v1/auth/roles/).
 * Agar shu endpoint ishlamasa, ro'yxat bo'sh qolib, rol tanlab bo'lmasdi va
 * "Qo'shish" tugmasi hech qanday tushuntirishsiz o'chiq qolar edi — shu sabab
 * zaxira sifatida allaqachon yuklangan xodimlarning rollari ishlatiladi. */
const fallbackRoles = computed<Role[]>(() => {
  const seen = new Map<number, Role>()
  for (const member of staffStore.members) {
    if (!member.role || seen.has(member.role)) continue
    seen.set(member.role, {
      id: member.role,
      name: member.role_display || member.role_code,
      code: member.role_code,
      description: '',
      permissions: [],
      isSystem: false,
      usersCount: 0,
      isActive: true,
      requiresDepartment: false,
      allowsLocalLogin: null,
      // Zaxira ro'yxat faqat rol TANLASH uchun ishlatiladi — bu maydonlar
      // rolning haqiqiy sozlamasi emas, shunchaki tipni to'ldiradi.
      requestScope: 'department',
      requestCategories: [],
    })
  }
  return [...seen.values()]
})

/** Xodim qo'shish/tahrirlash oynasida `student` va `super_admin` kodli rollar
 * ko'rsatilmaydi — talaba bu yerdan qo'shilmaydi, SuperAdmin roli esa
 * xavfsizlik uchun shu umumiy forma orqali berilmaydi (avvalgi xatti-harakat). */
const assignableRoles = computed(() => {
  const source = rolesStore.roles.length ? rolesStore.roles : fallbackRoles.value
  return source.filter((r) => r.isActive && r.code !== 'student' && r.code !== 'super_admin')
})

/** Qo'shimcha assignment asosiy rolni almashtirmaydi. SuperAdmin tasdiqiga
 * ko'ra, `super_admin` ham faqat shu alohida assignment oqimida ko'rinadi;
 * yangi xodim/primary-rol formasidagi avvalgi cheklov o'zgarishsiz qoladi.
 * Backend yuborilgan har bir rolni `assignable_roles` va bo'lim bo'yicha
 * baribir qayta tekshiradi. */
const additionalAssignableRoles = computed(() => {
  const source = rolesStore.roles.length ? rolesStore.roles : fallbackRoles.value
  return source.filter((role) => role.isActive && role.code !== 'student')
})

/** Rollar ham, zaxira ro'yxat ham bo'sh — rol tanlash umuman mumkin emas. */
const rolesUnavailable = computed(() => !rolesStore.loading && !assignableRoles.value.length)

function roleById(id: number | ''): Role | undefined {
  if (!id) return undefined
  return assignableRoles.value.find((r) => r.id === id)
}

/** Rolning `allows_local_login` maydoni — login+parol bilan kiradigan rollarda
 * parol maydoni ko'rsatiladi. Backend bu maydonni qaytarmagan bo'lsa (zaxira
 * ro'yxat), avvalgidek kod bo'yicha aniqlanadi. */
function isPasswordRole(roleId: number | '') {
  const role = roleById(roleId)
  if (!role) return false
  if (role.allowsLocalLogin !== null) return role.allowsLocalLogin
  return role.code === 'department_admin' || role.code === 'super_admin'
}

/** Rol `requires_department: true` bo'lsa, bo'lim tanlanmasdan yuborilsa backend rad etadi. */
const departmentRequired = computed(() => roleById(form.value.role)?.requiresDepartment ?? false)
const departmentMissing = computed(() => departmentRequired.value && !form.value.department)

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

/** Rollar birinchi yuklanadi: xodimlar ro'yxatidagi talabalarni ajratish va
 * saralash uchun talaba rolining ID'si kerak. */
onMounted(async () => {
  staffStore.fetchDepartments()
  await rolesStore.fetchRoles()
  staffStore.fetchMembers()
})

const memberSearch = ref('')
let memberSearchTimer: number | undefined

function onMemberSearchInput() {
  window.clearTimeout(memberSearchTimer)
  memberSearchTimer = window.setTimeout(() => staffStore.fetchMembers({ search: memberSearch.value }), 400)
}

onBeforeUnmount(() => window.clearTimeout(memberSearchTimer))

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
  if (departmentMissing.value) {
    createError.value = m.value.staff.departmentRequired
    return
  }

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

/* ---------- Ko'p-rolli assignmentlar ---------- */

const assignmentMember = ref<{ id: number; name: string } | null>(null)
const roleAssignments = ref<UserRoleAssignment[]>([])
const assignmentsLoading = ref(false)
const assignmentsSaving = ref(false)
const assignmentsError = ref('')
const editingAssignmentId = ref<number | null>(null)
const assignmentForm = ref({
  role: '' as number | '',
  department: '' as number | '',
  request_scope: 'none' as 'none' | 'department' | 'category' | 'all',
  request_categories: [] as string[],
  starts_at: '',
  expires_at: '',
  note: '',
})

const ASSIGNMENT_CATEGORIES = ['reference', 'financial', 'academic', 'science']

function resetAssignmentForm() {
  editingAssignmentId.value = null
  assignmentForm.value = {
    role: '',
    department: '',
    request_scope: 'none',
    request_categories: [],
    starts_at: '',
    expires_at: '',
    note: '',
  }
}

function toDateTimeInput(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function toIso(value: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

async function openAssignments(member: { id: number; full_name: string; hemis_id: string }) {
  assignmentMember.value = { id: member.id, name: member.full_name || member.hemis_id }
  assignmentsLoading.value = true
  assignmentsError.value = ''
  resetAssignmentForm()
  try {
    roleAssignments.value = await staffStore.fetchRoleAssignments(member.id)
  } catch (err) {
    assignmentsError.value = extractApiError(err, m.value.staff.assignmentLoadError)
  } finally {
    assignmentsLoading.value = false
  }
}

function closeAssignments() {
  assignmentMember.value = null
  roleAssignments.value = []
  assignmentsError.value = ''
  resetAssignmentForm()
}

function editAssignment(assignment: UserRoleAssignment) {
  editingAssignmentId.value = assignment.id
  assignmentForm.value = {
    role: assignment.role,
    department: assignment.department ?? '',
    request_scope: assignment.request_scope,
    request_categories: [...assignment.request_categories],
    starts_at: toDateTimeInput(assignment.starts_at),
    expires_at: toDateTimeInput(assignment.expires_at),
    note: assignment.note,
  }
}

async function reloadAssignments() {
  if (!assignmentMember.value) return
  roleAssignments.value = await staffStore.fetchRoleAssignments(assignmentMember.value.id)
}

async function saveAssignment() {
  if (!assignmentMember.value || !assignmentForm.value.role) return
  assignmentsSaving.value = true
  assignmentsError.value = ''
  const payload = {
    role: Number(assignmentForm.value.role),
    department: assignmentForm.value.department ? Number(assignmentForm.value.department) : null,
    request_scope: assignmentForm.value.request_scope,
    request_categories: assignmentForm.value.request_scope === 'category' ? assignmentForm.value.request_categories : [],
    starts_at: toIso(assignmentForm.value.starts_at),
    expires_at: toIso(assignmentForm.value.expires_at),
    note: assignmentForm.value.note.trim() || undefined,
  }
  try {
    if (editingAssignmentId.value) {
      await staffStore.updateRoleAssignment(assignmentMember.value.id, editingAssignmentId.value, payload)
    } else {
      await staffStore.createRoleAssignment(assignmentMember.value.id, payload)
    }
    await reloadAssignments()
    resetAssignmentForm()
  } catch (err) {
    assignmentsError.value = extractApiError(err, m.value.staff.assignmentSaveError)
  } finally {
    assignmentsSaving.value = false
  }
}

async function revokeAssignment(assignment: UserRoleAssignment) {
  if (!assignmentMember.value || assignment.is_primary) return
  assignmentsSaving.value = true
  assignmentsError.value = ''
  try {
    await staffStore.revokeRoleAssignment(assignmentMember.value.id, assignment.id)
    await reloadAssignments()
  } catch (err) {
    assignmentsError.value = extractApiError(err, m.value.staff.assignmentRevokeError)
  } finally {
    assignmentsSaving.value = false
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
                <select v-model="form.role" class="field-input" :disabled="rolesUnavailable">
                  <option value="" disabled>
                    {{ rolesStore.loading ? m.staff.rolesLoading : m.staff.rolePlaceholder }}
                  </option>
                  <option v-for="role in assignableRoles" :key="role.id" :value="role.id">
                    {{ role.name }}
                  </option>
                </select>
                <svg class="select-arrow" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
              </span>
              <small v-if="rolesUnavailable" class="form-error">{{ m.staff.rolesUnavailable }}</small>
              <small v-else-if="rolesStore.error" class="field-hint">{{ rolesStore.error }}</small>
            </label>

            <label class="field">
              <span class="field-label">
                {{ m.staff.department }}<template v-if="departmentRequired"> *</template>
              </span>
              <span class="select-wrap">
                <select v-model="form.department" class="field-input">
                  <option value="">{{ m.staff.departmentPlaceholder }}</option>
                  <optgroup
                    v-for="group in staffStore.departmentGroups"
                    :key="group.label || 'other'"
                    :label="group.label || m.staff.departmentOtherGroup"
                  >
                    <option v-for="dept in group.items" :key="dept.id" :value="dept.id">
                      {{ dept.name_uz }}
                    </option>
                  </optgroup>
                </select>
                <svg class="select-arrow" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
              </span>
              <small v-if="departmentMissing" class="form-error">{{ m.staff.departmentRequired }}</small>
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

            <button
              type="button"
              class="submit-btn"
              :disabled="creating || !form.role || departmentMissing"
              @click="addStaff"
            >
              {{ creating ? m.staff.adding : m.staff.add }}
            </button>

            <p v-if="createError" class="form-error">{{ createError }}</p>
            <p v-if="createdMessage" class="form-success">{{ m.staff.added }}</p>
          </template>
        </template>
      </form>

      <div class="staff-table-wrap">
        <div class="staff-search-row">
          <input
            v-model="memberSearch"
            type="search"
            class="field-input"
            :placeholder="m.staff.searchMembersPlaceholder"
            @input="onMemberSearchInput"
          />
          <span v-if="staffStore.totalUsers" class="staff-scan-hint">
            {{ m.staff.scannedHint }}: {{ staffStore.scanned }} / {{ staffStore.totalUsers }}
          </span>
        </div>

        <p v-if="staffStore.error" class="form-error">
          {{ m.staff.loadError }}<template v-if="staffStore.error !== 'load'"> — {{ staffStore.error }}</template>
        </p>
        <p v-if="staffStore.loading" class="appeal-empty">{{ m.grant.loading }}</p>
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
                <button
                  type="button"
                  class="role-assignment-btn"
                  :disabled="rolesStore.loading"
                  @click="openAssignments(member)"
                >
                  {{ m.staff.manageAssignments }}
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
            <tr v-if="!staffStore.members.length && !staffStore.loading">
              <td colspan="5" class="contact-empty">{{ m.staff.noMembers }}</td>
            </tr>
          </tbody>
        </table>

        <div v-if="staffStore.hasMore" class="staff-load-more">
          <p class="field-hint">{{ m.staff.partialListHint }}</p>
          <button type="button" class="appeal-btn" :disabled="staffStore.loading" @click="staffStore.loadMoreMembers()">
            {{ staffStore.loading ? m.grant.loading : m.staff.loadMore }}
          </button>
        </div>
      </div>
    </div>

    <section v-if="assignmentMember" class="appeal-form assignment-panel">
      <div class="assignment-panel-head">
        <div>
          <h3>{{ m.staff.assignmentsTitle }}</h3>
          <p class="field-hint">{{ m.staff.assignmentsFor }}: {{ assignmentMember.name }}</p>
        </div>
        <button type="button" class="appeal-btn" :disabled="assignmentsSaving" @click="closeAssignments">
          {{ m.staff.assignmentCancel }}
        </button>
      </div>

      <p v-if="assignmentsLoading" class="appeal-empty">{{ m.staff.assignmentsLoading }}</p>
      <p v-if="assignmentsError" class="form-error">{{ assignmentsError }}</p>

      <template v-if="!assignmentsLoading">
        <div v-if="roleAssignments.length" class="assignment-list">
          <article v-for="assignment in roleAssignments" :key="assignment.id" class="assignment-card">
            <div>
              <strong>{{ assignment.role_display || assignment.role_code }}</strong>
              <span v-if="assignment.is_primary" class="assignment-badge">{{ m.staff.assignmentPrimary }}</span>
              <p class="field-hint assignment-meta">
                {{ assignment.department_name || m.staff.assignmentScopeNone }}
                · {{ assignment.request_scope }}
                <template v-if="assignment.expires_at"> · {{ toDateTimeInput(assignment.expires_at).replace('T', ' ') }}</template>
              </p>
              <p v-if="assignment.note" class="assignment-note">{{ assignment.note }}</p>
            </div>
            <div v-if="assignment.is_active" class="assignment-actions">
              <button type="button" class="appeal-btn" :disabled="assignmentsSaving" @click="editAssignment(assignment)">
                {{ m.staff.assignmentEdit }}
              </button>
              <button
                v-if="!assignment.is_primary"
                type="button"
                class="appeal-btn req-cancel-btn"
                :disabled="assignmentsSaving"
                @click="revokeAssignment(assignment)"
              >
                {{ m.staff.assignmentRevoke }}
              </button>
            </div>
          </article>
        </div>
        <p v-else class="appeal-empty">{{ m.staff.assignmentsEmpty }}</p>

        <form class="assignment-form" @submit.prevent="saveAssignment">
          <h4>{{ editingAssignmentId ? m.staff.assignmentEdit : m.staff.assignmentAdd }}</h4>
          <div class="assignment-form-grid">
            <label class="field">
              <span class="field-label">{{ m.staff.assignmentRole }}</span>
              <span class="select-wrap">
                <select v-model="assignmentForm.role" class="field-input" :disabled="!!editingAssignmentId || rolesUnavailable">
                  <option value="" disabled>{{ m.staff.rolePlaceholder }}</option>
                  <option v-for="role in additionalAssignableRoles" :key="role.id" :value="role.id">{{ role.name }}</option>
                </select>
                <svg class="select-arrow" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
              </span>
            </label>
            <label class="field">
              <span class="field-label">{{ m.staff.assignmentScope }}</span>
              <span class="select-wrap">
                <select v-model="assignmentForm.request_scope" class="field-input">
                  <option value="none">{{ m.staff.assignmentScopeNone }}</option>
                  <option value="department">{{ m.staff.assignmentScopeDepartment }}</option>
                  <option value="category">{{ m.staff.assignmentScopeCategory }}</option>
                  <option value="all">{{ m.staff.assignmentScopeAll }}</option>
                </select>
                <svg class="select-arrow" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
              </span>
            </label>
            <label class="field">
              <span class="field-label">{{ m.staff.assignmentDepartment }}</span>
              <span class="select-wrap">
                <select v-model="assignmentForm.department" class="field-input">
                  <option value="">{{ m.staff.departmentPlaceholder }}</option>
                  <optgroup
                    v-for="group in staffStore.departmentGroups"
                    :key="group.label || 'other'"
                    :label="group.label || m.staff.departmentOtherGroup"
                  >
                    <option v-for="dept in group.items" :key="dept.id" :value="dept.id">{{ dept.name_uz }}</option>
                  </optgroup>
                </select>
                <svg class="select-arrow" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
              </span>
            </label>
            <label class="field">
              <span class="field-label">{{ m.staff.assignmentStartsAt }}</span>
              <input v-model="assignmentForm.starts_at" type="datetime-local" class="field-input" />
            </label>
            <label class="field">
              <span class="field-label">{{ m.staff.assignmentExpiresAt }}</span>
              <input v-model="assignmentForm.expires_at" type="datetime-local" class="field-input" />
            </label>
          </div>
          <div v-if="assignmentForm.request_scope === 'category'" class="assignment-categories">
            <label v-for="category in ASSIGNMENT_CATEGORIES" :key="category" class="gs-checkbox-field">
              <input v-model="assignmentForm.request_categories" type="checkbox" :value="category" />
              {{ category }}
            </label>
          </div>
          <label class="field">
            <span class="field-label">{{ m.staff.assignmentNote }}</span>
            <textarea v-model="assignmentForm.note" class="field-input" rows="2" />
          </label>
          <div class="info-form-actions">
            <button type="submit" class="submit-btn" :disabled="assignmentsSaving || !assignmentForm.role">
              {{ m.staff.assignmentSave }}
            </button>
            <button type="button" class="appeal-btn" :disabled="assignmentsSaving" @click="resetAssignmentForm">
              {{ m.grant.cancelEdit }}
            </button>
          </div>
        </form>
      </template>
    </section>
  </DashboardLayout>
</template>
