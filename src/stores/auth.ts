import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { http } from '@/services/http'
import { isMockMode, oauthRedirectUri, providers } from '@/config/oauth'
import { createCodeVerifier, createState, deriveCodeChallenge } from '@/services/pkce'

export type AuthMethod = 'staff' | 'student' | 'oneid'

export interface UserSession {
  id: string
  name: string
  role: string
  method: AuthMethod
  accessToken: string
}

const SESSION_KEY = 'r-office-session'
const PKCE_VERIFIER_KEY = 'r-office-pkce-verifier'
const OAUTH_STATE_KEY = 'r-office-oauth-state'
const OAUTH_METHOD_KEY = 'r-office-oauth-method'

const MOCK_PROFILES: Record<AuthMethod, Omit<UserSession, 'accessToken' | 'method'>> = {
  staff: { id: 'EMP-1024', name: 'Registrar Xodimi', role: 'Staff' },
  student: { id: 'STU-2031', name: 'Talaba Foydalanuvchi', role: 'Student' },
  oneid: { id: 'OID-7782', name: 'OneID Foydalanuvchi', role: 'Citizen' },
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
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => session.value !== null)

  function persist(value: UserSession | null) {
    session.value = value
    if (value) localStorage.setItem(SESSION_KEY, JSON.stringify(value))
    else localStorage.removeItem(SESSION_KEY)
  }

  /** Login boshlash: real provider bo'lsa HEMIS/OneID ga otadi, aks holda mock. */
  async function beginLogin(method: AuthMethod) {
    error.value = null
    loadingMethod.value = method

    if (isMockMode(method)) {
      await mockLogin(method)
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

  /** Demo login — backend yo'q paytida to'liq oqimni sinash uchun. */
  async function mockLogin(method: AuthMethod) {
    const state = createState()
    sessionStorage.setItem(OAUTH_STATE_KEY, state)
    sessionStorage.setItem(OAUTH_METHOD_KEY, method)
    const params = new URLSearchParams({ code: `mock-${method}-code`, state })
    await new Promise((resolve) => setTimeout(resolve, 400))
    window.location.href = `${oauthRedirectUri}?${params.toString()}`
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
      role: method === 'oneid' ? 'Citizen' : method === 'staff' ? 'Staff' : 'Student',
      method,
      accessToken,
    }
  }

  function logout() {
    persist(null)
    error.value = null
    loadingMethod.value = null
  }

  return {
    session,
    loadingMethod,
    error,
    isAuthenticated,
    beginLogin,
    handleCallback,
    logout,
  }
})
