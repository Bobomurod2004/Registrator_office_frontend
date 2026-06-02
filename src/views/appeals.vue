<script setup lang="ts">
import { computed, ref } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useAppealsStore } from '@/stores/appeals'
import { useLocaleStore } from '@/stores/locale'
import type { AppealCategory, AppealStatus } from '@/stores/appeals'

const authStore = useAuthStore()
const appealsStore = useAppealsStore()
const localeStore = useLocaleStore()
const m = computed(() => localeStore.m)

const STATUS_LABEL = computed<Record<AppealStatus, string>>(() => ({
  new: m.value.appeals.new,
  in_progress: m.value.appeals.inProgress,
  resolved: m.value.appeals.resolved,
}))

const CATEGORY_LABEL = computed<Record<AppealCategory, string>>(() => ({
  onsite: m.value.appeals.catOnsite,
  general: m.value.appeals.catGeneral,
}))

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
      <h1>{{ m.appeals.staffTitle }}</h1>
      <p class="services-subtitle">{{ m.appeals.staffSubtitle }}</p>

      <div class="appeal-stat-row">
        <div class="appeal-stat">
          <strong>{{ appealsStore.total }}</strong>
          <span>{{ m.appeals.total }}</span>
        </div>
        <div class="appeal-stat is-new">
          <strong>{{ appealsStore.newCount }}</strong>
          <span>{{ m.appeals.new }}</span>
        </div>
        <div class="appeal-stat is-progress">
          <strong>{{ appealsStore.inProgressCount }}</strong>
          <span>{{ m.appeals.inProgress }}</span>
        </div>
        <div class="appeal-stat is-done">
          <strong>{{ appealsStore.resolvedCount }}</strong>
          <span>{{ m.appeals.resolved }}</span>
        </div>
      </div>

      <div class="services-tabs">
        <button class="btn service-tab-btn" :class="{ active: filter === 'all' }" @click="filter = 'all'">
          {{ m.appeals.filterAll }}
        </button>
        <button class="btn service-tab-btn" :class="{ active: filter === 'general' }" @click="filter = 'general'">
          {{ m.appeals.filterGeneral }}
        </button>
        <button class="btn service-tab-btn" :class="{ active: filter === 'onsite' }" @click="filter = 'onsite'">
          {{ m.appeals.filterOnsite }}
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
                {{ m.appeals.take }}
              </button>
              <button
                v-if="item.status !== 'resolved'"
                class="btn appeal-btn primary"
                @click="appealsStore.setStatus(item.id, 'resolved')"
              >
                {{ m.appeals.markResolved }}
              </button>
            </div>
          </div>
        </article>
      </div>
    </template>

    <!-- ===== Talaba ko'rinishi ===== -->
    <template v-else>
      <h1>{{ m.appeals.studentTitle }}</h1>
      <p class="services-subtitle">{{ m.appeals.studentSubtitle }}</p>

      <div class="appeal-grid">
        <form class="appeal-form" @submit.prevent="submitAppeal">
          <h3>{{ m.appeals.newAppeal }}</h3>

          <label class="field">
            <span class="field-label">{{ m.appeals.topic }}</span>
            <input v-model="form.topic" type="text" class="field-input" :placeholder="m.appeals.topicPlaceholder" />
          </label>

          <label class="field">
            <span class="field-label">{{ m.appeals.type }}</span>
            <select v-model="form.category" class="field-input">
              <option value="general">{{ m.appeals.catGeneral }}</option>
              <option value="onsite">{{ m.appeals.catOnsite }}</option>
            </select>
          </label>

          <label class="field">
            <span class="field-label">{{ m.appeals.text }}</span>
            <textarea
              v-model="form.message"
              class="field-input field-textarea"
              rows="4"
              :placeholder="m.appeals.textPlaceholder"
            />
          </label>

          <button type="submit" class="submit-btn">{{ m.appeals.send }}</button>
          <p v-if="submitted" class="form-success">{{ m.appeals.sent }}</p>
        </form>

        <div class="appeal-list">
          <p v-if="myAppeals.length === 0" class="appeal-empty">
            {{ m.appeals.empty }}
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
