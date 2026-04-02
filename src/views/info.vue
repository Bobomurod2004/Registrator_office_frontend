<script setup lang="ts">
import { computed, ref } from 'vue'

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
  <div class="services-page">
    <div class="container-fluid py-4 px-3 px-lg-4">
      <div class="services-layout">
        <aside class="services-sidebar">
          <div class="sidebar-header">Registrator Ofis</div>

          <div class="profile-card">
            <img
              class="profile-avatar"
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80"
              alt="User profile image"
            />
            <div class="profile-meta">
              <strong>Aziza Karimova</strong>
              <span>Talaba</span>
            </div>
          </div>

          <nav class="sidebar-menu">
            <router-link class="menu-item" to="/services">
              <span class="menu-icon">
                <svg viewBox="0 0 24 24" role="presentation">
                  <path
                    d="M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h10v2H4v-2Zm12.5-1.3 4.2 4.2-1.4 1.4-4.2-4.2V15h1.4Z"
                  />
                </svg>
              </span>
              <span>Tezkor xizmatlar</span>
            </router-link>

            <router-link class="menu-item active" to="/info">
              <span class="menu-icon">
                <svg viewBox="0 0 24 24" role="presentation">
                  <path
                    d="M11 7h2V5h-2v2Zm0 12h2v-8h-2v8Zm1-17a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8Z"
                  />
                </svg>
              </span>
              <span>Info</span>
            </router-link>

            <a class="menu-item" href="#">
              <span class="menu-icon">
                <svg viewBox="0 0 24 24" role="presentation">
                  <path
                    d="M3 3h2v18H3V3Zm4 10h3v8H7v-8Zm5-6h3v14h-3V7Zm5 3h3v11h-3V10Z"
                  />
                </svg>
              </span>
              <span>Hisobotlar</span>
            </a>

            <a class="menu-item" href="#">
              <span class="menu-icon">
                <svg viewBox="0 0 24 24" role="presentation">
                  <path d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z" />
                </svg>
              </span>
              <span>Dashboard</span>
            </a>
          </nav>

          <nav class="sidebar-menu secondary">
            <a class="menu-item" href="#">
              <span class="menu-icon">
                <svg viewBox="0 0 24 24" role="presentation">
                  <path
                    d="M12 2a10 10 0 0 0-3.5 19.4c.6.1.8-.2.8-.6v-2.1c-3.4.7-4.1-1.6-4.1-1.6a3.2 3.2 0 0 0-1.4-1.8c-1.1-.8.1-.8.1-.8a2.5 2.5 0 0 1 1.8 1.2 2.5 2.5 0 0 0 3.4 1 2.6 2.6 0 0 1 .8-1.6c-2.7-.3-5.6-1.3-5.6-6A4.7 4.7 0 0 1 5.7 6a4.4 4.4 0 0 1 .1-3.1s1-.3 3.2 1.2a11 11 0 0 1 6 0c2.2-1.5 3.2-1.2 3.2-1.2a4.4 4.4 0 0 1 .1 3.1 4.7 4.7 0 0 1 1.3 3.2c0 4.7-2.9 5.7-5.7 6a2.9 2.9 0 0 1 .9 2.2v3.3c0 .4.2.7.8.6A10 10 0 0 0 12 2Z"
                  />
                </svg>
              </span>
              <span>Yordam va yo'riqnoma</span>
            </a>

            <a class="menu-item" href="#">
              <span class="menu-icon">
                <svg viewBox="0 0 24 24" role="presentation">
                  <path
                    d="m19.4 13-.9-.5a7.1 7.1 0 0 0 0-1l.9-.5a1 1 0 0 0 .4-1.3l-1-1.8a1 1 0 0 0-1.2-.5l-1 .4a6.4 6.4 0 0 0-.9-.5l-.1-1.1a1 1 0 0 0-1-.9h-2.1a1 1 0 0 0-1 .9l-.1 1.1a6.4 6.4 0 0 0-.9.5l-1-.4a1 1 0 0 0-1.2.5l-1 1.8a1 1 0 0 0 .4 1.3l.9.5a7.1 7.1 0 0 0 0 1l-.9.5a1 1 0 0 0-.4 1.3l1 1.8a1 1 0 0 0 1.2.5l1-.4a6.4 6.4 0 0 0 .9.5l.1 1.1a1 1 0 0 0 1 .9h2.1a1 1 0 0 0 1-.9l.1-1.1a6.4 6.4 0 0 0 .9-.5l1 .4a1 1 0 0 0 1.2-.5l1-1.8a1 1 0 0 0-.4-1.3ZM12 15.5A3.5 3.5 0 1 1 15.5 12 3.5 3.5 0 0 1 12 15.5Z"
                  />
                </svg>
              </span>
              <span>Sozlamalar</span>
            </a>
          </nav>
        </aside>

        <section class="services-content info-content">
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
        </section>
      </div>
    </div>
  </div>
</template>
