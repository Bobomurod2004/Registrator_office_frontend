import type { AuthMethod } from '@/stores/auth'

export interface OAuthProviderConfig {
  authorizeUrl: string
  tokenUrl: string
  userInfoUrl: string
  clientId: string
  scope: string
}

const env = import.meta.env

const REDIRECT_URI =
  (env.VITE_OAUTH_REDIRECT_URI as string) || `${window.location.origin}/callback`

export const oauthRedirectUri = REDIRECT_URI

export const providers: Record<AuthMethod, OAuthProviderConfig> = {
  staff: {
    authorizeUrl: (env.VITE_HEMIS_AUTHORIZE_URL as string) || '',
    tokenUrl: (env.VITE_HEMIS_TOKEN_URL as string) || '',
    userInfoUrl: (env.VITE_HEMIS_USERINFO_URL as string) || '',
    clientId: (env.VITE_HEMIS_STAFF_CLIENT_ID as string) || '',
    scope: (env.VITE_HEMIS_SCOPE as string) || 'profile',
  },
  student: {
    authorizeUrl: (env.VITE_HEMIS_AUTHORIZE_URL as string) || '',
    tokenUrl: (env.VITE_HEMIS_TOKEN_URL as string) || '',
    userInfoUrl: (env.VITE_HEMIS_USERINFO_URL as string) || '',
    clientId: (env.VITE_HEMIS_STUDENT_CLIENT_ID as string) || '',
    scope: (env.VITE_HEMIS_SCOPE as string) || 'profile',
  },
  oneid: {
    authorizeUrl: (env.VITE_ONEID_AUTHORIZE_URL as string) || '',
    tokenUrl: (env.VITE_ONEID_TOKEN_URL as string) || '',
    userInfoUrl: (env.VITE_ONEID_USERINFO_URL as string) || '',
    clientId: (env.VITE_ONEID_CLIENT_ID as string) || '',
    scope: (env.VITE_ONEID_SCOPE as string) || 'openid profile',
  },
}

/**
 * Mock rejim: real provider sozlanmagan bo'lsa (clientId yoki authorizeUrl yo'q),
 * login oqimi simulyatsiya qilinadi. Backend tayyor bo'lgach .env to'ldiriladi
 * va mock avtomatik o'chadi.
 */
export function isMockMode(method: AuthMethod): boolean {
  const p = providers[method]
  return !p.clientId || !p.authorizeUrl
}
