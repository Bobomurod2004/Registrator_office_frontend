<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLocaleStore } from '@/stores/locale'
import { extractApiError } from '@/services/http'
import { isTelegramState, linkTelegramFromHemis, type TelegramLinkResult } from '@/services/telegramLink'

const router = useRouter()
const authStore = useAuthStore()
const localeStore = useLocaleStore()
const errorMessage = ref<string | null>(null)

// Telegram bot boshlagan login (state `tg_...`): saytga kirilmaydi,
// faqat natija va "Botga qaytish" tugmasi ko'rsatiladi.
const query = new URLSearchParams(window.location.search)
const telegramMode = isTelegramState(query.get('state'))
const telegramResult = ref<TelegramLinkResult | null>(null)
// code bir martalik: ikkinchi so'rov "allaqachon ishlatilgan" xatosini qaytarib,
// muvaffaqiyat o'rniga xato ko'rsatib qo'yadi — shu sabab faqat bitta so'rov.
let telegramSent = false

async function runTelegramLink() {
  if (telegramSent) return
  telegramSent = true
  const code = query.get('code')
  if (!code) {
    telegramResult.value = { ok: false, detail: query.get('error') ?? '', botUrl: null }
    return
  }
  telegramResult.value = await linkTelegramFromHemis(code, query.get('state') ?? '')
}

function telegramErrorText(result: Extract<TelegramLinkResult, { ok: false }>): string {
  const t = localeStore.m.telegramLink
  if (result.detail === null) return t.networkError
  return result.detail || t.unexpected
}

onMounted(async () => {
  if (telegramMode) {
    await runTelegramLink()
    return
  }

  try {
    await authStore.handleCallback(query)
    await router.replace({ path: authStore.homePath })
  } catch (err) {
    // Backend qaytargan aniq sabab bo'lsa (masalan validatsiya xatosi) shuni,
    // aks holda o'zimiz throw qilgan xabarni (masalan "kod topilmadi") ko'rsatamiz.
    const backendDetail = extractApiError(err, '')
    errorMessage.value = backendDetail || (err instanceof Error ? err.message : 'Kirish amalga oshmadi.')
  }
})

function backToLogin() {
  void router.replace({ name: 'login' })
}
</script>

<template>
  <div class="callback-page">
    <div v-if="telegramMode" class="callback-card">
      <template v-if="!telegramResult">
        <span class="callback-spinner" aria-hidden="true" />
        <h2>{{ localeStore.m.telegramLink.checking }}</h2>
        <p>{{ localeStore.m.telegramLink.checkingHint }}</p>
      </template>

      <template v-else-if="telegramResult.ok">
        <span class="callback-success-mark" aria-hidden="true">✓</span>
        <h2>{{ localeStore.m.telegramLink.successTitle.replace('{name}', telegramResult.fullName).replace(', !', '!') }}</h2>
        <p>{{ localeStore.m.telegramLink.successHint }}</p>
        <a v-if="telegramResult.botUrl" class="callback-retry callback-bot-btn" :href="telegramResult.botUrl">
          {{ localeStore.m.telegramLink.backToBot }}
        </a>
      </template>

      <template v-else>
        <span class="callback-error-mark" aria-hidden="true">!</span>
        <h2>{{ localeStore.m.telegramLink.errorTitle }}</h2>
        <p>{{ telegramErrorText(telegramResult) }}</p>
        <p class="callback-subhint">{{ localeStore.m.telegramLink.errorHint }}</p>
        <a v-if="telegramResult.botUrl" class="callback-retry callback-bot-btn" :href="telegramResult.botUrl">
          {{ localeStore.m.telegramLink.backToBot }}
        </a>
      </template>
    </div>

    <div v-else class="callback-card">
      <template v-if="!errorMessage">
        <span class="callback-spinner" aria-hidden="true" />
        <h2>Kirish amalga oshirilmoqda…</h2>
        <p>Iltimos kuting, ma'lumotlaringiz tekshirilmoqda.</p>
      </template>

      <template v-else>
        <span class="callback-error-mark" aria-hidden="true">!</span>
        <h2>Kirishda xatolik</h2>
        <p>{{ errorMessage }}</p>
        <button class="callback-retry" @click="backToLogin">Login sahifasiga qaytish</button>
      </template>
    </div>
  </div>
</template>
