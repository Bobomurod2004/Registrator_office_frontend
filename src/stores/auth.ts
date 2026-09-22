import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fetchAuthenticatedImageUrl, http } from '@/services/http'

export type AuthMethod = 'staff' | 'student' | 'oneid'
type HemisMethod = 'staff' | 'student'
export type AccountKind = 'staff' | 'student'

export interface UserSession {
  id: string
  name: string
  role: string
  roleId: number | null
  roleCode: BackendRole | null
  kind: AccountKind
  method: AuthMethod | 'demo'
  accessToken: string
  refreshToken?: string
  imageUrl?: string | null
}

/**
 * Tizimning asosiy (built-in) rol kodlari — kirish usuli (login+parol vs
 * HEMIS OAuth) va asosiy huquq darajalarini shular aniqlaydi. SuperAdmin
 * `/api/v1/auth/roles/` orqali qo'shimcha (custom) rollar yaratishi ham
 * mumkin — ularning kodi bu ro'yxatda bo'lmasligi mumkin, shu sabab
 * `role_code` maydonining o'zi bu turdan kengroq (string) — bu yerdagi
 * qiymatlar faqat taqqoslash uchun ishlatiladigan ma'lum kodlar.
 */
export type BackendRole =
  | 'student'
  | 'operator'
  | 'dekanat'
  | 'accountant'
  | 'science'
  | 'international'
  | 'department_admin'
  | 'super_admin'

/**
 * Backenddagi RoleEnum (api/v1/auth/login/ va /auth/me/ shu formatda qaytaradi).
 * MUHIM (backend'dagi buzuvchi o'zgarish): `role` endi matn emas, Role ID
 * (butun son) — dasturiy taqqoslash uchun endi `role_code` ishlatiladi,
 * o'qiladigan nom uchun esa avvalgidek `role_display`.
 */
export interface BackendUser {
  id: number
  hemis_id: string
  full_name: string
  role: number
  role_code: BackendRole
  role_display: string
}

/** GET/PATCH /api/v1/auth/me/ to'liq javob shakli. */
export interface UserProfile extends BackendUser {
  email: string | null
  phone: string | null
  gender: 'male' | 'female' | null | ''
  language: 'uz' | 'uz_cyrl' | 'ru' | 'en'
  department: number | null
  department_name: string
  student_profile: string | Record<string, unknown> | null
  employee_profile: string | Record<string, unknown> | null
  is_locked: boolean
  created_at: string
}

const SESSION_KEY = 'r-office-session'
const OAUTH_METHOD_KEY = 'r-office-oauth-method'

/** HEMIS OAuth2 orqali kirish uchun backend endpointlari (staff va student uchun alohida). */
const HEMIS_ENDPOINTS: Record<HemisMethod, { redirect: string; callback: string }> = {
  staff: { redirect: '/api/v1/hemis/oauth/redirect/', callback: '/api/v1/hemis/oauth/callback/' },
  student: {
    redirect: '/api/v1/hemis/student/oauth/redirect/',
    callback: '/api/v1/hemis/student/oauth/callback/',
  },
}

/**
 * Talaba/xodim ekanligini aniqlaydi. `user.role`ning o'ziga ishonib bo'lmaydi —
 * backend ba'zan bu maydonni hujjatlashtirilmagan/kutilmagan qiymat bilan
 * qaytarishi mumkin (masalan yangi HEMIS-sinxronlangan talaba uchun bo'sh/boshqa
 * qiymat). HEMIS "Talaba" OAuth endpointi orqali kirish — bu sof talaba ekanining
 * eng ishonchli belgisi, shu sabab u `role`dan ustuvor olinadi.
 */
function resolveKind(roleCode: BackendRole, method: AuthMethod): AccountKind {
  return method === 'student' || roleCode === 'student' ? 'student' : 'staff'
}

function toSession(
  user: BackendUser,
  accessToken: string,
  refreshToken: string,
  method: AuthMethod = 'staff',
): UserSession {
  return {
    id: String(user.id),
    name: user.full_name || user.hemis_id,
    role: user.role_display,
    roleId: user.role,
    roleCode: user.role_code,
    kind: resolveKind(user.role_code, method),
    method,
    accessToken,
    refreshToken,
  }
}

/** GET .../oauth/redirect/ javobi Swagger'da hujjatlashtirilmagan — eng ehtimoliy maydon nomlari sinaladi. */
function extractRedirectUrl(data: any): string | null {
  return data?.url ?? data?.redirect_url ?? data?.login_url ?? data?.authorization_url ?? data?.auth_url ?? null
}

function loadSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as UserSession) : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const session = ref<UserSession | null>(loadSession())
  const loadingMethod = ref<AuthMethod | null>(null)
  const passwordLoading = ref(false)
  const error = ref<string | null>(null)
  const oauthError = ref<string | null>(null)

  const isAuthenticated = computed(() => session.value !== null)
  const isStaff = computed(() => session.value?.kind === 'staff')
  const isAdmin = computed(
    () => session.value?.roleCode === 'department_admin' || session.value?.roleCode === 'super_admin',
  )
  const isSuperAdmin = computed(() => session.value?.roleCode === 'super_admin')
  const homePath = computed(() => (isStaff.value ? '/statistics' : '/services'))

  function persist(value: UserSession | null) {
    session.value = value
    if (value) localStorage.setItem(SESSION_KEY, JSON.stringify(value))
    else localStorage.removeItem(SESSION_KEY)
  }

  /** Profil ma'lumoti (ism, rol) backendda yangilangach, lokal sessiyani ham sinxronlaydi. */
  function syncProfile(user: BackendUser) {
    if (!session.value) return
    persist({
      ...session.value,
      name: user.full_name || user.hemis_id,
      role: user.role_display,
      roleId: user.role,
      roleCode: user.role_code,
      kind: resolveKind(user.role_code, session.value.method === 'demo' ? 'staff' : session.value.method),
    })
  }

  /** GET /api/v1/auth/profile/ — hemis_id/full_name/phone/email/image/role/gender/bo'lim.
   *  Tizimga yuklangan rasm o'chirilgan bo'lsa, backend endi `effective_image_url`
   *  (yuklangan rasm bo'lmasa HEMIS'dan kelgan rasmga tushadigan, hal qiluvchi
   *  qiymat) qaytaradi — shu maydon `image`dan ustuvor o'qiladi, mavjud bo'lmasa
   *  eski `image`ga tushiladi (orqaga moslik uchun).
   *  Rasm fayli backendda himoyalangan (`IsAuthenticated`) bo'lgani uchun
   *  to'g'ridan-to'g'ri URL emas, tokenli so'rov orqali (blob) yuklanadi. */
  async function fetchProfileImage(): Promise<void> {
    if (!session.value) return
    try {
      const { data } = await http.get('/api/v1/auth/profile/')
      const newImageUrl = await fetchAuthenticatedImageUrl(data?.effective_image_url ?? data?.image)
      const previousImageUrl = session.value?.imageUrl
      if (previousImageUrl?.startsWith('blob:')) URL.revokeObjectURL(previousImageUrl)
      if (session.value) persist({ ...session.value, imageUrl: newImageUrl })
    } catch {
      // Jim tur — rasm bo'lmasa harf-avatar fallback ishlatiladi.
    }
  }

  /** DELETE /api/v1/auth/profile/ — foydalanuvchi tizim orqali o'zi yuklagan
   * rasmni o'chiradi (HEMIS'dan kelgan rasmga tegmaydi — o'chirilgandan keyin,
   * agar HEMIS rasmi bo'lsa, avtomatik o'sha ko'rsatiladi). Muvaffaqiyatli
   * bo'lsa profil rasmi darhol qayta yuklanadi. */
  async function deleteProfileImage(): Promise<void> {
    await http.delete('/api/v1/auth/profile/')
    await fetchProfileImage()
  }

  /**
   * Joriy foydalanuvchi o'z ma'lumotlarini (ism, bo'lim, rasm va h.k.) HEMIS'dan
   * qayta yuklaydi (POST /api/v1/hemis/sync/). Muvaffaqiyatli bo'lsa profil
   * rasmi darhol yangilanadi — chaqiruvchi (Sozlamalar sahifasi) qolgan
   * maydonlarni yangilash uchun profilni qayta yuklashi kerak.
   */
  async function syncFromHemis(): Promise<void> {
    await http.post('/api/v1/hemis/sync/')
    await fetchProfileImage()
  }

  /**
   * Login+parol bilan kirish (backend: POST /api/v1/auth/login/).
   * Faqat department_admin va super_admin uchun ishlaydi — boshqa rollar
   * OAuth2 (HEMIS/talaba) orqali kiradi.
   */
  async function loginWithPassword(username: string, password: string): Promise<boolean> {
    error.value = null

    const hemisId = username.trim()
    if (!hemisId || !password) {
      error.value = 'Login va parolni kiriting.'
      return false
    }

    passwordLoading.value = true

    try {
      const { data } = await http.post('/api/v1/auth/login/', {
        hemis_id: hemisId,
        password,
      })
      persist(toSession(data.user, data.access, data.refresh))
      return true
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || status === 400) {
        error.value = "Login yoki parol noto'g'ri."
      } else {
        error.value = 'Serverga ulanishda xatolik yuz berdi. Birozdan so\'ng qayta urinib ko\'ring.'
      }
      return false
    } finally {
      passwordLoading.value = false
    }
  }

  /**
   * HEMIS OAuth2 orqali kirishni boshlash (faqat 'staff'/'student' — OneID
   * backendda hali mavjud emas). Backend login URL'ini qaytaradi, biz shu
   * manzilga o'tamiz; HEMIS keyin foydalanuvchini backendda ro'yxatdan
   * o'tgan redirect_uri'ga (frontendning /callback sahifasi) code bilan qaytaradi.
   */
  async function beginLogin(method: AuthMethod) {
    oauthError.value = null

    if (method === 'oneid') {
      oauthError.value = 'OneID orqali kirish hali mavjud emas.'
      return
    }

    loadingMethod.value = method

    try {
      const { data } = await http.get(HEMIS_ENDPOINTS[method].redirect)
      const url = extractRedirectUrl(data)
      if (!url) throw new Error('Login URL topilmadi')

      sessionStorage.setItem(OAUTH_METHOD_KEY, method)
      window.location.href = url
    } catch {
      oauthError.value = 'Kirish sahifasiga yo\'naltirishda xatolik yuz berdi.'
      loadingMethod.value = null
    }
  }

  /** Callback sahifasidan chaqiriladi: HEMIS'dan kelgan code backendga yuboriladi va sessiya ochiladi. */
  async function handleCallback(query: URLSearchParams): Promise<UserSession> {
    const code = query.get('code')
    const state = query.get('state')
    const providerError = query.get('error')

    const method = (sessionStorage.getItem(OAUTH_METHOD_KEY) as HemisMethod | null) ?? null
    sessionStorage.removeItem(OAUTH_METHOD_KEY)

    if (providerError) throw new Error(`Provider xatosi: ${providerError}`)
    if (!code) throw new Error('Avtorizatsiya kodi topilmadi.')
    if (!method) throw new Error('Login metodi aniqlanmadi.')

    const { data } = await http.post(HEMIS_ENDPOINTS[method].callback, {
      code,
      state: state ?? undefined,
    })

    const accessToken = data.access ?? data.access_token
    const refreshToken = data.refresh ?? data.refresh_token
    if (!accessToken || !data.user) throw new Error('Backend javobi kutilgan shaklda emas.')

    const newSession = toSession(data.user, accessToken, refreshToken, method)
    persist(newSession)
    loadingMethod.value = null
    return newSession
  }

  /**
   * Chiqish: lokal sessiya darhol tozalanadi (UI/route guard kutmasin),
   * refresh tokenni blacklistga qo'shish esa fonda, natijasini kutmasdan yuboriladi.
   */
  function logout() {
    const refreshToken = session.value?.refreshToken
    const imageUrl = session.value?.imageUrl
    if (imageUrl?.startsWith('blob:')) URL.revokeObjectURL(imageUrl)

    persist(null)
    error.value = null
    oauthError.value = null
    loadingMethod.value = null

    if (refreshToken) {
      http.post('/api/v1/auth/logout/', { refresh: refreshToken }).catch(() => {
        // Server bilan bog'lanib bo'lmasa ham, lokal sessiya allaqachon tozalangan.
      })
    }
  }

  return {
    session,
    loadingMethod,
    passwordLoading,
    error,
    oauthError,
    isAuthenticated,
    isStaff,
    isAdmin,
    isSuperAdmin,
    homePath,
    loginWithPassword,
    beginLogin,
    handleCallback,
    logout,
    syncProfile,
    fetchProfileImage,
    deleteProfileImage,
    syncFromHemis,
  }
})
