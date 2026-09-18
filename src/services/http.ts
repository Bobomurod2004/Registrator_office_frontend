import axios from 'axios'
import { clearSession, getAccessToken, getRefreshToken, updateTokens } from './tokenStore'

/**
 * Backend rasm/fayl maydonlarini (masalan profil rasmi) ba'zan to'liq URL
 * emas, nisbiy yo'l (masalan `/media/...`) sifatida qaytaradi. Bunday holda
 * brauzer uni frontend'ning o'z manziliga (localhost:3000) nisbatan
 * so'raydi va rasm topilmaydi — shu funksiya backend manziliga to'g'ri
 * ulaydi, to'liq URL bo'lsa o'zgarishsiz qaytaradi.
 */
export function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) return path
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/',
  timeout: 10000,
  headers: {
    Accept: 'application/json',
  },
})

http.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new Error('Refresh token yo\'q')

  const { data } = await axios.post(
    `${import.meta.env.VITE_API_BASE_URL || '/'}/api/v1/auth/token/refresh/`,
    { refresh: refreshToken },
  )
  updateTokens(data.access, data.refresh)
  return data.access as string
}

/**
 * DRF xato javobidan o'qiladigan matn ajratib oladi: {detail: "..."} yoki
 * serializer validatsiya xatolari ({field: ["xabar", ...], ...}) ikkalasini
 * ham qo'llab-quvvatlaydi, aks holda fallback matnni qaytaradi.
 */
export function extractApiError(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: unknown } })?.response?.data
  if (!data) return fallback
  if (typeof data === 'string') return data
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (typeof obj.detail === 'string') return obj.detail
    const parts: string[] = []
    for (const [key, value] of Object.entries(obj)) {
      const message = Array.isArray(value) ? value.join(' ') : String(value)
      parts.push(key === 'non_field_errors' ? message : `${key}: ${message}`)
    }
    if (parts.length) return parts.join(' ')
  }
  return fallback
}

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const isAuthRoute = String(original?.url ?? '').includes('/auth/login') ||
      String(original?.url ?? '').includes('/auth/token/refresh')

    if (error.response?.status === 401 && !original._retry && !isAuthRoute) {
      original._retry = true
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null
        })
        const newAccess = await refreshPromise
        original.headers.Authorization = `Bearer ${newAccess}`
        return http(original)
      } catch {
        clearSession()
        window.location.assign('/')
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  },
)

/**
 * Ba'zi media fayllar (masalan profil rasmlari, `/media/profile_images/...`)
 * backendda ochiq statik fayl sifatida emas, `IsAuthenticated` talab
 * qiluvchi himoyalangan endpoint sifatida xizmat qiladi (`curl` bilan
 * tasdiqlangan: token'siz so'rov 401 qaytaradi). Oddiy `<img src="...">`
 * brauzer so'roviga bizning JWT tokenimizni qo'sha olmaydi, shu sabab rasm
 * hech qachon yuklanmasdi. Bu funksiya rasmni tokenli so'rov orqali (blob
 * sifatida) yuklab, natijasini `<img>` tushuna oladigan mahalliy
 * (`blob:...`) URL'ga aylantiradi.
 */
export async function fetchAuthenticatedImageUrl(path: string | null | undefined): Promise<string | null> {
  const url = resolveMediaUrl(path)
  if (!url) return null
  try {
    const { data } = await http.get(url, { responseType: 'blob' })
    return URL.createObjectURL(data)
  } catch {
    return null
  }
}
