<script setup lang="ts">
import { computed, ref } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'

interface InfoCard {
  id: string
  title: string
  details: string[]
  fileName: string
}

const cards: InfoCard[] = [
  {
    id: 'transfer',
    title: "O'qishni ko'chirish tartibi",
    details: [
      "Arizalar odatda yozgi qabul oynasida qabul qilinadi.",
      "Talaba shaxsiy kabinet orqali elektron ariza to'ldiradi va hujjatlarni biriktiradi.",
      "Akademik farq bo'lsa, fakultet tomonidan individual o'quv rejasi belgilanadi.",
      "Yakunda qabul komissiyasi qarori asosida ko'chirish natijasi e'lon qilinadi.",
    ],
    fileName: "oqishni-kochirish-tartibi.txt",
  },
  {
    id: 'masters',
    title: 'Magistraturaga qabul qilish',
    details: [
      "Abituriyent mutaxassislik yo'nalishini tanlaydi va online ro'yxatdan o'tadi.",
      "Talab etilgan hujjatlar: diplom, transkript, pasport nusxasi va foto.",
      "Kirish sinovlari va suhbat jadvali e'lon qilingandan keyin natijalar kabinetda ko'rinadi.",
      "Qabul qilinganlar uchun kontrakt va buyruq jarayonlari avtomatlashtirilgan.",
    ],
    fileName: 'magistraturaga-qabul-qilish.txt',
  },
  {
    id: 'second-edu',
    title: "Ikkinchi ta'limga qabul qilish",
    details: [
      "Nomzod amaldagi oliy ma'lumot hujjatlari bilan ariza topshiradi.",
      "Ta'lim shakli va yo'nalishiga qarab to'lov-kontrakt miqdori belgilanadi.",
      "Fanlar bo'yicha perezachet jarayoni kafedra bilan kelishilgan holda o'tkaziladi.",
      "Tasdiqdan so'ng shaxsiy kabinet orqali dars jadvali va topshiriqlar ochiladi.",
    ],
    fileName: 'ikkinchi-talimga-qabul-qilish.txt',
  },
]

const selectedId = ref<string | null>(null)
const selectedCard = computed(() => cards.find((card) => card.id === selectedId.value) ?? null)

function selectCard(id: string) {
  selectedId.value = id
}

function downloadSelected() {
  if (!selectedCard.value) return

  const fileContent = [
    selectedCard.value.title,
    '',
    ...selectedCard.value.details.map((item, idx) => `${idx + 1}. ${item}`),
  ].join('\n')

  const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = selectedCard.value.fileName
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
          v-for="card in cards"
          :key="card.id"
          class="btn info-topic-card text-start"
          :class="{ active: selectedId === card.id }"
          @click="selectCard(card.id)"
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
          Yuklab olish
        </button>
      </article>
    </div>
  </DashboardLayout>
</template>
