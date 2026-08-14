import axios from 'axios'
import { clearSession, getAccessToken, getRefreshToken, updateTokens } from './tokenStore'

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
