import axios from 'axios'

/**
 * Telegram bot (@uzswlu_rofficebot) orqali boshlangan HEMIS talaba OAuth'i.
 *
 * HEMIS'da redirect_uri bitta (saytning /api/auth/callback/studentoauth), shu
 * sabab bot boshlagan login ham saytga qaytadi. Farqi faqat `state`da: bot
 * oqimida u `tg_` bilan boshlanadi. Bunday holatda saytga login QILINMAYDI —
 * code+state backendga yuboriladi, backend Telegram akkauntini talabaga
 * bog'laydi va token qaytarmaydi. `tg_` — ochiq belgi; imzoni backend tekshiradi.
 */
export const TELEGRAM_STATE_PREFIX = 'tg_'

export function isTelegramState(state: string | null): boolean {
  return !!state && state.startsWith(TELEGRAM_STATE_PREFIX)
}

export type TelegramLinkResult =
  | { ok: true; fullName: string; botUrl: string | null }
  | { ok: false; detail: string | null; botUrl: string | null }

/** Faqat Telegram havolasiga tugma chiqaramiz — backend javobidagi istalgan URL'ga emas. */
function safeBotUrl(value: unknown): string | null {
  return typeof value === 'string' && value.startsWith('https://t.me/') ? value : null
}

/**
 * Bot oqimining qaysi HEMIS OAuth'idan kelganini callback yo'li belgilaydi:
 * talaba — /api/auth/callback/studentoauth, o'qituvchi/xodim — /api/auth/callback/hemis.
 * Ikkalasi ham bir xil ish qiladi, faqat backend endpoint'i boshqa.
 */
export type TelegramFlow = 'student' | 'employee'

const FLOW_ENDPOINT: Record<TelegramFlow, string> = {
  student: '/api/v1/hemis/student/oauth/callback/',
  employee: '/api/v1/hemis/oauth/callback/',
}

export function telegramFlowFromPath(pathname: string): TelegramFlow {
  return pathname.replace(/\/+$/, '').endsWith('/hemis') ? 'employee' : 'student'
}

export async function linkTelegramFromHemis(
  code: string,
  state: string,
  flow: TelegramFlow = 'student',
): Promise<TelegramLinkResult> {
  // Umumiy `http` klienti ishlatilmaydi: u saytdagi sessiyaning Bearer tokenini
  // qo'shadi va 401 da refresh/clearSession qiladi. Bu endpoint token talab
  // qilmaydi, va bot oqimi saytda kim kirib turganiga ta'sir qilmasligi kerak.
  const base = (import.meta.env.VITE_API_BASE_URL || '/').replace(/\/+$/, '')
  try {
    const { data } = await axios.post(
      `${base}${FLOW_ENDPOINT[flow]}`,
      { code, state },
      // Backend shu so'rov ichida HEMIS bilan code→token almashinuvini qiladi.
      { timeout: 30000, headers: { Accept: 'application/json' } },
    )
    if (data?.telegram_linked) {
      return { ok: true, fullName: data.user?.full_name ?? '', botUrl: safeBotUrl(data.bot_url) }
    }
    return { ok: false, detail: typeof data?.detail === 'string' ? data.detail : '', botUrl: safeBotUrl(data?.bot_url) }
  } catch (err) {
    const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data
    // `detail: null` — javob umuman kelmadi (tarmoq xatosi); sahifa o'zi matn tanlaydi.
    if (!data) return { ok: false, detail: null, botUrl: null }
    return {
      ok: false,
      detail: typeof data.detail === 'string' ? data.detail : '',
      botUrl: safeBotUrl(data.bot_url),
    }
  }
}
