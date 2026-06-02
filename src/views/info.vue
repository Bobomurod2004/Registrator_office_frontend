<script setup lang="ts">
import { computed, ref } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'
import { useLocaleStore } from '@/stores/locale'

const localeStore = useLocaleStore()
const m = computed(() => localeStore.m)

const fileNames = [
  'oqishni-kochirish-tartibi.txt',
  'magistraturaga-qabul-qilish.txt',
  'ikkinchi-talimga-qabul-qilish.txt',
]

const cards = computed(() => m.value.info.cards)
const selectedIndex = ref<number | null>(null)
const selectedCard = computed(() =>
  selectedIndex.value !== null ? (cards.value[selectedIndex.value] ?? null) : null,
)

function selectCard(index: number) {
  selectedIndex.value = index
}

function downloadSelected() {
  if (!selectedCard.value || selectedIndex.value === null) return

  const fileContent = [
    selectedCard.value.title,
    '',
    ...selectedCard.value.details.map((item, idx) => `${idx + 1}. ${item}`),
  ].join('\n')

  const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileNames[selectedIndex.value] ?? 'info.txt'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <DashboardLayout>
    <div class="info-content">
      <div class="info-cards">
        <button
          v-for="(card, index) in cards"
          :key="card.title"
          class="btn info-topic-card text-start"
          :class="{ active: selectedIndex === index }"
          @click="selectCard(index)"
        >
          <h3>{{ card.title }}</h3>
        </button>
      </div>

      <article v-if="selectedCard" class="info-details">
        <h2>{{ selectedCard.title }}</h2>
        <ul>
          <li v-for="detail in selectedCard.details" :key="detail">{{ detail }}</li>
        </ul>
        <button class="btn service-open-btn info-download-btn" type="button" @click="downloadSelected">
          {{ m.info.download }}
        </button>
      </article>
    </div>
  </DashboardLayout>
</template>
