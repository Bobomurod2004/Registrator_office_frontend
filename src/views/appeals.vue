<script setup lang="ts">
import { computed, ref } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useAppealsStore } from '@/stores/appeals'
import type { AppealCategory, AppealStatus } from '@/stores/appeals'

const authStore = useAuthStore()
const appealsStore = useAppealsStore()

const STATUS_LABEL: Record<AppealStatus, string> = {
  new: 'Yangi',
  in_progress: 'Jarayonda',
  resolved: 'Hal qilindi',
}

const CATEGORY_LABEL: Record<AppealCategory, string> = {
  onsite: 'Joyida hal qilinadigan',
  general: 'Umumiy murojaat',
}

type Filter = 'all' | AppealCategory
const filter = ref<Filter>('all')

const visibleAppeals = computed(() => {
  if (filter.value === 'all') return appealsStore.appeals
  return appealsStore.appeals.filter((a) => a.category === filter.value)
})

const myAppeals = computed(() =>
  appealsStore.appeals.filter((a) => a.studentName === authStore.session?.name),
)

const form = ref<{ topic: string; category: AppealCategory; message: string }>({
  topic: '',
  category: 'general',
  message: '',
})
const submitted = ref(false)

function submitAppeal() {
  if (!form.value.topic.trim() || !form.value.message.trim()) return
  appealsStore.addAppeal({
    studentName: authStore.session?.name ?? 'Talaba',
    topic: form.value.topic.trim(),
    category: form.value.category,
    message: form.value.message.trim(),
  })
  form.value = { topic: '', category: 'general', message: '' }
  submitted.value = true
  window.setTimeout(() => (submitted.value = false), 2500)
}
</script>

<template>
  <DashboardLayout>
    <!-- ===== Xodim ko'rinishi ===== -->
    <template v-if="authStore.isStaff">
      <h1>Murojaatlar</h1>
      <p class="services-subtitle">Talabalar murojaatlarini ko'rib chiqing va holatini yangilang.</p>

      <div class="appeal-stat-row">
        <div class="appeal-stat">
          <strong>{{ appealsStore.total }}</strong>
          <span>Jami</span>
        </div>
        <div class="appeal-stat is-new">
          <strong>{{ appealsStore.newCount }}</strong>
          <span>Yangi</span>
        </div>
        <div class="appeal-stat is-progress">
          <strong>{{ appealsStore.inProgressCount }}</strong>
          <span>Jarayonda</span>
        </div>
        <div class="appeal-stat is-done">
          <strong>{{ appealsStore.resolvedCount }}</strong>
          <span>Hal qilindi</span>
        </div>
      </div>

      <div class="services-tabs">
        <button class="btn service-tab-btn" :class="{ active: filter === 'all' }" @click="filter = 'all'">
          Barchasi
        </button>
        <button class="btn service-tab-btn" :class="{ active: filter === 'general' }" @click="filter = 'general'">
          Umumiy murojaatlar
        </button>
        <button class="btn service-tab-btn" :class="{ active: filter === 'onsite' }" @click="filter = 'onsite'">
          Joyida hal qilinadigan
        </button>
      </div>

      <div class="appeal-list">
        <article v-for="item in visibleAppeals" :key="item.id" class="appeal-card">
          <div class="appeal-card-head">
            <div>
              <h3>{{ item.topic }}</h3>
              <p class="appeal-meta">
                {{ item.studentName }} · {{ item.id }} · {{ item.createdAt }}
              </p>
            </div>
            <span class="appeal-status" :class="`st-${item.status}`">
              {{ STATUS_LABEL[item.status] }}
            </span>
          </div>
          <p class="appeal-message">{{ item.message }}</p>
          <div class="appeal-card-foot">
            <span class="appeal-tag">{{ CATEGORY_LABEL[item.category] }}</span>
            <div class="appeal-actions">
              <button
                v-if="item.status !== 'in_progress'"
                class="btn appeal-btn"
                @click="appealsStore.setStatus(item.id, 'in_progress')"
              >
                Jarayonga olish
              </button>
              <button
                v-if="item.status !== 'resolved'"
                class="btn appeal-btn primary"
                @click="appealsStore.setStatus(item.id, 'resolved')"
              >
                Hal qilindi
              </button>
            </div>
          </div>
        </article>
      </div>
    </template>

    <!-- ===== Talaba ko'rinishi ===== -->
    <template v-else>
      <h1>Mening murojaatlarim</h1>
      <p class="services-subtitle">Yangi murojaat yuboring yoki holatini kuzating.</p>

      <div class="appeal-grid">
        <form class="appeal-form" @submit.prevent="submitAppeal">
          <h3>Yangi murojaat</h3>

          <label class="field">
            <span class="field-label">Mavzu</span>
            <input v-model="form.topic" type="text" class="field-input" placeholder="Murojaat mavzusi" />
          </label>

          <label class="field">
            <span class="field-label">Turi</span>
            <select v-model="form.category" class="field-input">
              <option value="general">Umumiy murojaat</option>
              <option value="onsite">Joyida hal qilinadigan</option>
            </select>
          </label>

          <label class="field">
            <span class="field-label">Matn</span>
            <textarea
              v-model="form.message"
              class="field-input field-textarea"
              rows="4"
              placeholder="Murojaat mazmunini yozing"
            />
          </label>

          <button type="submit" class="submit-btn">Yuborish</button>
          <p v-if="submitted" class="form-success">Murojaatingiz qabul qilindi.</p>
        </form>

        <div class="appeal-list">
          <p v-if="myAppeals.length === 0" class="appeal-empty">
            Hozircha murojaatlaringiz yo'q.
          </p>
          <article v-for="item in myAppeals" :key="item.id" class="appeal-card">
            <div class="appeal-card-head">
              <div>
                <h3>{{ item.topic }}</h3>
                <p class="appeal-meta">{{ item.id }} · {{ item.createdAt }}</p>
              </div>
              <span class="appeal-status" :class="`st-${item.status}`">
                {{ STATUS_LABEL[item.status] }}
              </span>
            </div>
            <p class="appeal-message">{{ item.message }}</p>
            <span class="appeal-tag">{{ CATEGORY_LABEL[item.category] }}</span>
          </article>
        </div>
      </div>
    </template>
  </DashboardLayout>
</template>
