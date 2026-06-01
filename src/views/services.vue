<script setup lang="ts">
import { computed, ref } from 'vue'
import DashboardLayout from '@/components/DashboardLayout.vue'

type ServiceTab = 'all' | 'docs' | 'finance' | 'research' | 'academic'

interface ServiceItem {
  title: string
  description: string
}

const tabs: Array<{ key: ServiceTab; label: string }> = [
  { key: 'all', label: 'Barcha xizmatlar' },
  { key: 'docs', label: "Ma'lumotnomalar" },
  { key: 'finance', label: 'Moliyaviy jarayon' },
  { key: 'research', label: 'Ilmiy jarayon' },
  { key: 'academic', label: 'Akademik jarayon' },
]

const activeTab = ref<ServiceTab>('all')

const servicesByTab: Record<ServiceTab, ServiceItem[]> = {
  all: [
    {
      title: "O'qish joyidan ma'lumotnoma olish",
      description: "Talabalik holatini tasdiqlovchi rasmiy ma'lumotnoma.",
    },
    {
      title: "To'lov shartnoma olish",
      description: "Kontrakt to'lov hujjatini yuklab olish va tekshirish.",
    },
    {
      title: "Talabalar turar joyi uchun shartnoma olish",
      description: "TTJ joylashuvi bo'yicha shartnoma arizasini rasmiylashtirish.",
    },
    {
      title: 'Reyting daftarcha olish',
      description: "Fanlar kesimida o'zlashtirish natijalari ko'rsatilgan hujjat.",
    },
    {
      title: "Akademik ta'til arizasi",
      description: "Semestr yoki yil bo'yicha akademik ta'til so'rovini yuborish.",
    },
    {
      title: "Transkriptga buyurtma berish",
      description: "Barcha fanlar va kreditlar bo'yicha transkript olish.",
    },
  ],
  docs: [
    {
      title: "Talabalik guvohnomasi dublikati",
      description: "Yo'qolgan holatlar uchun yangi guvohnoma so'rovi.",
    },
    {
      title: 'Diplom ilovasidan nusxa',
      description: "Arxivdan diplom ilovasi nusxasini rasmiy so'rash.",
    },
    {
      title: "O'qishni tasdiqlash xati",
      description: 'Ish joyi yoki boshqa tashkilotlar uchun rasmiy xat.',
    },
  ],
  finance: [
    {
      title: "Kontrakt qarzdorlik holati",
      description: "To'lovlar bo'yicha joriy holat va muddatlarni ko'rish.",
    },
    {
      title: 'To‘lov kvitansiyasini yuklab olish',
      description: "To'langan summalar bo'yicha rasmiy kvitansiya.",
    },
    {
      title: 'Stipendiya hisobi',
      description: "Stipendiya miqdori va to'lov davrlarini tekshirish.",
    },
  ],
  research: [
    {
      title: 'Ilmiy rahbar biriktirish',
      description: 'Bitiruv yoki ilmiy ish uchun rahbar tanlash xizmati.',
    },
    {
      title: 'Maqola taqdim etish',
      description: 'Konferensiya va jurnal uchun maqola yuborish oynasi.',
    },
    {
      title: 'Ilmiy faoliyat hisoboti',
      description: "Nashr va ishtiroklar bo'yicha hisobot topshirish.",
    },
  ],
  academic: [
    {
      title: "Fan tanlash va ro'yxatdan o'tish",
      description: "Semestr uchun fanlarni tanlash va tasdiqlash.",
    },
    {
      title: "Qayta o'qish (retake) arizasi",
      description: "O'zlashtirilmagan fanlar bo'yicha qayta o'qishga yozilish.",
    },
    {
      title: 'Dars jadvalini olish',
      description: 'Haftalik dars jadvali va auditoriyalar ro‘yxati.',
    },
  ],
}

const visibleServices = computed(() => servicesByTab[activeTab.value])
</script>

<template>
  <DashboardLayout>
    <h1>Tezkor xizmatlar</h1>
    <p class="services-subtitle">Kerakli bo'limni tanlang va xizmatni tez ishga tushiring.</p>

    <div class="services-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="btn service-tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="row g-3 services-grid">
      <div v-for="service in visibleServices" :key="service.title" class="col-12 col-md-6 col-xl-4">
        <article class="service-card">
          <h3>{{ service.title }}</h3>
          <p>{{ service.description }}</p>
          <button class="btn service-open-btn" type="button">Ochish</button>
        </article>
      </div>
    </div>
  </DashboardLayout>
</template>
