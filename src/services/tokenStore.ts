const SESSION_KEY = 'r-office-session'

interface StoredSession {
  accessToken?: string
  refreshToken?: string
}

/**
 * localStorage'dagi sessiyani to'g'ridan-to'g'ri o'qish/yozish.
 * Pinia store'ga bog'lanmagan — http.ts interceptor'lari (auth store'ni
 * import qilmasdan) tokenlarga kirishi va yangilashi uchun ishlatiladi.
 */
export function getAccessToken(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return (JSON.parse(raw) as StoredSession).accessToken ?? null
  } catch {
    return null
  }
}

export function getRefreshToken(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return (JSON.parse(raw) as StoredSession).refreshToken ?? null
  } catch {
    return null
  }
}

export function updateTokens(accessToken: string, refreshToken: string): void {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return
    const session = JSON.parse(raw)
    session.accessToken = accessToken
    session.refreshToken = refreshToken
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // sessiya yo'q — hech narsa qilmaymiz
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}
