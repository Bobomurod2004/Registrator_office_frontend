import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { http } from '@/services/http'
import { isMockMode, oauthRedirectUri, providers } from '@/config/oauth'
import { createCodeVerifier, createState, deriveCodeChallenge } from '@/services/pkce'

export type AuthMethod = 'staff' | 'student' | 'oneid'
export type AccountKind = 'staff' | 'student'

export interface UserSession {
  id: string
  name: string
  role: string
  kind: AccountKind
  method: AuthMethod | 'demo'
  accessToken: string
  refreshToken?: string
}

export type BackendRole =
  | 'student'
  | 'operator'
  | 'dekanat'
  | 'accountant'
  | 'science'
  | 'international'
  | 'department_admin'
  | 'super_admin'

/** Backenddagi RoleEnum qiymatlari (api/v1/auth/login/ va /auth/me/ shu formatda qaytaradi). */
export interface BackendUser {
  id: number
  hemis_id: string
  full_name: string
  role: BackendRole
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
  student_profile: string | null
  is_locked: boolean
  created_at: string
}

const SESSION_KEY = 'r-office-session'
const PKCE_VERIFIER_KEY = 'r-office-pkce-verifier'
const OAUTH_STATE_KEY = 'r-office-oauth-state'
const OAUTH_METHOD_KEY = 'r-office-oauth-method'

const MOCK_PROFILES: Record<AuthMethod, Omit<UserSession, 'accessToken' | 'method'>> = {
  staff: { id: 'EMP-1024', name: 'Registrar Xodimi', role: 'Xodim', kind: 'staff' },
  student: { id: 'STU-2031', name: 'Talaba Foydalanuvchi', role: 'Talaba', kind: 'student' },
  oneid: { id: 'OID-7782', name: 'OneID Foydalanuvchi', role: 'Talaba', kind: 'student' },
}

function toSession(user: BackendUser, accessToken: string, refreshToken: string): UserSession {
  return {
    id: String(user.id),
    name: user.full_name || user.hemis_id,
    role: user.role_display,
    kind: user.role === 'student' ? 'student' : 'staff',
    method: 'staff',
    accessToken,
    refreshToken,
  }
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

  const isAuthenticated = computed(() => session.value !== null)
  const isStaff = computed(() => session.value?.kind === 'staff')
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
      kind: user.role === 'student' ? 'student' : 'staff',
    })
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

  /** Login boshlash: real provider bo'lsa HEMIS/OneID ga otadi, aks holda mock. */
  async function beginLogin(method: AuthMethod) {
    error.value = null
    loadingMethod.value = method

    if (isMockMode(method)) {
      await new Promise((resolve) => setTimeout(resolve, 400))
      const profile = MOCK_PROFILES[method]
      persist({ ...profile, method, accessToken: `mock-token-${Date.now()}` })
      loadingMethod.value = null
      return
    }

    try {
      const provider = providers[method]
      const verifier = createCodeVerifier()
      const state = createState()
      const challenge = await deriveCodeChallenge(verifier)

      sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier)
      sessionStorage.setItem(OAUTH_STATE_KEY, state)
      sessionStorage.setItem(OAUTH_METHOD_KEY, method)

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: provider.clientId,
        redirect_uri: oauthRedirectUri,
        scope: provider.scope,
        state,
        code_challenge: challenge,
        code_challenge_method: 'S256',
      })

      window.location.href = `${provider.authorizeUrl}?${params.toString()}`
    } catch (err) {
      error.value = 'Login boshlashda xatolik yuz berdi.'
      loadingMethod.value = null
      throw err
    }
  }

  /** Callback sahifasidan chaqiriladi: code/state tekshiriladi va sessiya ochiladi. */
  async function handleCallback(query: URLSearchParams): Promise<UserSession> {
    const code = query.get('code')
    const returnedState = query.get('state')
    const oauthError = query.get('error')

    const method = (sessionStorage.getItem(OAUTH_METHOD_KEY) as AuthMethod | null) ?? null
    const expectedState = sessionStorage.getItem(OAUTH_STATE_KEY)

    sessionStorage.removeItem(OAUTH_STATE_KEY)
    sessionStorage.removeItem(OAUTH_METHOD_KEY)

    if (oauthError) throw new Error(`Provider xatosi: ${oauthError}`)
    if (!code) throw new Error('Avtorizatsiya kodi topilmadi.')
    if (!method) throw new Error('Login metodi aniqlanmadi.')
    if (expectedState && returnedState !== expectedState) {
      throw new Error('State mos kelmadi (CSRF himoyasi).')
    }

    let newSession: UserSession

    if (isMockMode(method)) {
      const profile = MOCK_PROFILES[method]
      newSession = { ...profile, method, accessToken: `mock-token-${Date.now()}` }
    } else {
      newSession = await exchangeCodeForSession(method, code)
    }

    sessionStorage.removeItem(PKCE_VERIFIER_KEY)
    persist(newSession)
    loadingMethod.value = null
    return newSession
  }

  /**
   * PKCE token almashinuvi to'g'ridan-to'g'ri brauzerdan.
   * DIQQAT: faqat provider PKCE (public client) + CORS qo'llasa ishlaydi.
   * Aks holda bu qism backendga ko'chiriladi.
   */
  async function exchangeCodeForSession(method: AuthMethod, code: string): Promise<UserSession> {
    const provider = providers[method]
    const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY) || ''

    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: oauthRedirectUri,
      client_id: provider.clientId,
      code_verifier: verifier,
    })

    const tokenResp = await http.post(provider.tokenUrl, tokenBody, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    const accessToken = tokenResp.data.access_token as string

    const userResp = await http.get(provider.userInfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = userResp.data

    return {
      id: String(data.id ?? data.sub ?? data.login ?? 'unknown'),
      name: String(data.name ?? data.full_name ?? data.firstname ?? 'Foydalanuvchi'),
      role: method === 'staff' ? 'Xodim' : 'Talaba',
      kind: method === 'staff' ? 'staff' : 'student',
      method,
      accessToken,
    }
  }

  /**
   * Chiqish: lokal sessiya darhol tozalanadi (UI/route guard kutmasin),
   * refresh tokenni blacklistga qo'shish esa fonda, natijasini kutmasdan yuboriladi.
   */
  function logout() {
    const refreshToken = session.value?.refreshToken

    persist(null)
    error.value = null
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
    isAuthenticated,
    isStaff,
    homePath,
    loginWithPassword,
    beginLogin,
    handleCallback,
    logout,
    syncProfile,
  }
})
