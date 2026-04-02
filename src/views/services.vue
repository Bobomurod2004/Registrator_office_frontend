<script setup lang="ts">
import { computed, ref } from 'vue'

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
            <router-link class="menu-item active" to="/services">
              <span class="menu-icon">
                <svg viewBox="0 0 24 24" role="presentation">
                  <path
                    d="M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h10v2H4v-2Zm12.5-1.3 4.2 4.2-1.4 1.4-4.2-4.2V15h1.4Z"
                  />
                </svg>
              </span>
              <span>Tezkor xizmatlar</span>
            </router-link>

            <router-link class="menu-item" to="/info">
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

        <section class="services-content">
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
        </section>
      </div>
    </div>
  </div>
</template>
