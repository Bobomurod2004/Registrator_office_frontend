<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) authStore.fetchProfileImage()
  },
  { immediate: true },
)

/** Ko'plab sichqonchalarning yon (bosh barmoq) tugmalari `button: 3` ("orqaga")
 * va `button: 4` ("oldinga") kodlari bilan keladi — brauzer standart holatda
 * bularni sahifa tarixida navigatsiya qilish uchun ishlatadi. Ilova ichida
 * (masalan forma to'ldirilayotganda) bu tasodifiy sodir bo'lib, saqlanmagan
 * ma'lumot yo'qolishiga olib kelishi mumkin — shu sabab butun ilova bo'ylab
 * bloklanadi.
 *
 * MUHIM: tinglovchi `capture: true` bilan qo'shilgan — bu uni hodisa
 * pastga (window'dan target'ga) tarqalishining ENG BOSHIDA ishlaydigan
 * qiladi. CKEditor kabi widget-asosidagi kutubxonalar o'z ichki sichqoncha
 * ishlov beruvchisida hodisani "stopPropagation" bilan to'xtatib qo'yishi
 * mumkin — bunday holda oddiy (bubble-phase, standart) tinglovchi hodisaga
 * umuman yetib bormay qoladi. Capture-phase tinglovchisi esa CKEditor hali
 * hodisani ko'rmasidan oldin ishlaydi, shu sabab har doim ishonchli. */
function blockMouseNavigationButtons(event: MouseEvent) {
  if (event.button === 3 || event.button === 4) {
    event.preventDefault()
  }
}

onMounted(() => {
  window.addEventListener('mousedown', blockMouseNavigationButtons, { capture: true })
  window.addEventListener('mouseup', blockMouseNavigationButtons, { capture: true })
  window.addEventListener('auxclick', blockMouseNavigationButtons, { capture: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('mousedown', blockMouseNavigationButtons, { capture: true })
  window.removeEventListener('mouseup', blockMouseNavigationButtons, { capture: true })
  window.removeEventListener('auxclick', blockMouseNavigationButtons, { capture: true })
})
</script>

<template>
  <AppHeader />
  <router-view />
</template>
