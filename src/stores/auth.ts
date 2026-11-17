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
  /** Barcha faol assignmentlardan olingan rol kodlari. `roleCode` esa eski
   * endpointlar uchun primary rol bo'lib qoladi. */
  roleCodes: string[]
  permissionCodes: string[]
  /** `true` bo'lsa `permissionCodes` backend'dan to'g'ridan-to'g'ri kelgan samarali ro'yxat. */
  permissionsExplicit?: boolean
  /** Backend qaytargan active assignmentlar; sessiyani yangilagandan keyin
   * navigatsiya bitta primary rolga bog'lanib qolmasligi uchun saqlanadi. */
  roleAssignments: UserRoleAssignment[]
  isSuperAdmin: boolean
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
export type BackendRole = string

/**
 * Rahbariyat rollarining kodlari. Bu rol egalari faqat "Rahbariyat murojaatlari"
 * va "Ma'lumotlar" bo'limini ko'radi, bosh sahifa ham shu bo'lim bo'ladi.
 * MUHIM: aniq rol kodi backend jamoasidan tasdiqlangach shu yerga yoziladi
 * (masalan `'leader'`). Ro'yxat bo'sh bo'lsa rahbar rejimi yoqilmaydi.
 */
export const LEADER_ROLE_CODES: string[] = ['prorektor']

/**
 * Bulardan birortasi bo'lsa foydalanuvchi korrupsiya rejimiga tushmaydi: u tizimni
 * boshqaradi. `send_bot_messages` va `handle_leadership_appeals` bu ro'yxatda yo'q —
 * korrupsiya xodimi rahbarga mas'ul ham bo'lishi mumkin (backend buni o'zi beradi).
 */
const BROAD_PERMISSIONS = [
  'manage_appeal_recipients',
  'manage_users',
  'manage_roles',
  'manage_settings',
  'manage_departments',
  'manage_services',
  'manage_content',
  'dispatch_requests',
  'view_audit_log',
]

/** `role_assignments` serializeri eski/yangi backend versiyalarida role'ni
 * ID yoki ichma-ich obyekt ko'rinishida qaytarishi mumkin. Shu ikki shaklni
 * bir tipda qabul qilamiz; amalda muhim maydonlar pastdagi normalizatsiyada
 * barqaror shaklga o'tkaziladi. */
export interface UserRoleAssignment {
  id: number
  role: number
  role_code: string
  role_display: string
  permissions: string[]
  department: number | null
  department_name: string
  request_scope: 'none' | 'department' | 'category' | 'all'
  request_categories: string[]
  starts_at: string | null
  expires_at: string | null
  note: string
  is_primary: boolean
  is_active: boolean
}

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
  role_assignments?: unknown[]
  is_super_admin?: boolean
  is_student?: boolean
  /** Samarali ruxsatlar ro'yxati (login va /auth/me/ javobida). Backend uni
   * o'zi hisoblaydi (SuperAdmin istisnolari hisobga olingan). Mavjud bo'lsa,
   * ruxsatlar faqat shu ro'yxatga qarab aniqlanadi. */
  permissions?: string[]
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
function resolveKind(user: BackendUser, method: AuthMethod): AccountKind {
  return method === 'student' || user.is_student === true || user.role_code === 'student' ? 'student' : 'staff'
}

function normalizeRoleAssignment(raw: any): UserRoleAssignment | null {
  if (!raw || typeof raw !== 'object') return null
  const role = raw.role
  const nestedRole = role && typeof role === 'object' ? role : null
  const id = Number(raw.id)
  const roleId = Number(nestedRole?.id ?? role ?? raw.role_id)
  if (!Number.isFinite(id) || !Number.isFinite(roleId)) return null
  const department = raw.department && typeof raw.department === 'object' ? raw.department.id : raw.department
  const categories = raw.request_categories ?? raw.categories ?? []
  return {
    id,
    role: roleId,
    role_code: String(raw.role_code ?? nestedRole?.code ?? ''),
    role_display: String(raw.role_display ?? raw.role_name ?? nestedRole?.name ?? nestedRole?.display ?? ''),
    permissions: Array.isArray(raw.permissions ?? nestedRole?.permissions)
      ? (raw.permissions ?? nestedRole?.permissions).map((permission: any) =>
          typeof permission === 'string' ? permission : String(permission?.code ?? permission?.codename ?? ''),
        ).filter(Boolean)
      : [],
    department: department == null || department === '' ? null : Number(department),
    department_name: String(raw.department_name ?? raw.department_display ?? raw.department?.name_uz ?? ''),
    request_scope: raw.request_scope ?? 'none',
    request_categories: Array.isArray(categories) ? categories.map(String) : [],
    starts_at: raw.starts_at ?? null,
    expires_at: raw.expires_at ?? null,
    note: String(raw.note ?? ''),
    is_primary: Boolean(raw.is_primary),
    is_active: raw.is_active == null ? true : Boolean(raw.is_active),
  }
}

function activeAssignments(user: BackendUser): UserRoleAssignment[] {
  const assignments = Array.isArray(user.role_assignments)
    ? user.role_assignments.map(normalizeRoleAssignment).filter((value): value is UserRoleAssignment => value !== null)
    : []
  if (assignments.length) return assignments.filter((assignment) => assignment.is_active)
  // Login va eski backend javoblari `role_assignments` qaytarmasa ham mavjud
  // primary rol ishlashda davom etadi.
  return [{
    id: 0,
    role: user.role,
    role_code: user.role_code ?? '',
    role_display: user.role_display ?? '',
    permissions: [],
    department: null,
    department_name: '',
    request_scope: 'none',
    request_categories: [],
    starts_at: null,
    expires_at: null,
    note: '',
    is_primary: true,
    is_active: true,
  }]
}

/**
 * Ruxsatlar: backend `permissions` ro'yxatini qaytarsa (samarali, SuperAdmin
 * istisnolari bilan) — u haqiqat manbai. Aks holda (eski javoblar) assignment
 * ruxsatlaridan yig'iladi.
 */
function resolvePermissions(
  user: BackendUser,
  roleAssignments: UserRoleAssignment[],
): { permissionCodes: string[]; permissionsExplicit: boolean } {
  if (Array.isArray(user.permissions)) {
    return {
      permissionCodes: [...new Set(user.permissions.map(String).filter(Boolean))],
      permissionsExplicit: true,
    }
  }
  return {
    permissionCodes: [...new Set(roleAssignments.flatMap((assignment) => assignment.permissions))],
    permissionsExplicit: false,
  }
}

function toSession(
  user: BackendUser,
  accessToken: string,
  refreshToken: string,
  method: AuthMethod = 'staff',
): UserSession {
  const roleAssignments = activeAssignments(user)
  const roleCodes = [...new Set(roleAssignments.map((assignment) => assignment.role_code).filter(Boolean))]
  const { permissionCodes, permissionsExplicit } = resolvePermissions(user, roleAssignments)
  return {
    id: String(user.id),
    name: user.full_name || user.hemis_id,
    role: user.role_display,
    roleId: user.role,
    roleCode: user.role_code,
    roleCodes,
    permissionCodes,
    permissionsExplicit,
    roleAssignments,
    isSuperAdmin: user.is_super_admin === true || roleCodes.includes('super_admin'),
    kind: resolveKind(user, method),
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
    if (!raw) return null
    const saved = JSON.parse(raw) as Partial<UserSession>
    if (!saved.id || !saved.accessToken) return null
    // Old localStorage sessiyalarida yangi ko'p-rolli maydonlar bo'lmaydi.
    // Birinchi `/me/` so'rovi ularni to'liq yangilaydi; ungacha primary rol
    // bilan xavfsiz fallback ishlaydi.
    const roleCode = saved.roleCode ?? null
    return {
      ...saved,
      id: saved.id,
      name: saved.name ?? '',
      role: saved.role ?? '',
      roleId: saved.roleId ?? null,
      roleCode,
      roleCodes: saved.roleCodes?.length ? saved.roleCodes : (roleCode ? [roleCode] : []),
      permissionCodes: saved.permissionCodes ?? [],
      roleAssignments: saved.roleAssignments ?? [],
      isSuperAdmin: saved.isSuperAdmin ?? roleCode === 'super_admin',
      kind: saved.kind ?? 'staff',
      method: saved.method ?? 'staff',
      accessToken: saved.accessToken,
    }
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
  const isSuperAdmin = computed(() => Boolean(session.value?.isSuperAdmin))
  /**
   * Ekranlarni ROL NOMIGA emas, RUXSATGA qarab boshqarish kerak (backend
   * jamoasining ko'rsatmasi) — ruxsatlar katalogi:
   * GET /api/v1/auth/roles/permission-catalog/.
   * SuperAdmin har doim `true` — uning vakolatlari alohida ro'yxat bilan
   * cheklanmaydi.
   */
  function can(permission: string): boolean {
    if (session.value?.permissionCodes.includes(permission)) return true
    // Backend samarali ro'yxat yubormagan (eski javob) bo'lsa, SuperAdmin
    // hamma narsaga ruxsatli deb olinadi; ro'yxat bo'lsa, u haqiqat manbai.
    return isSuperAdmin.value && session.value?.permissionsExplicit !== true
  }

  const canManageUsers = computed(() =>
    can('manage_users') ||
    session.value?.roleCodes.includes('department_admin') === true,
  )
  /** `dispatch_requests` — murojaatni rollar bo'yicha taqsimlash/yo'naltirish
   * (`POST /requests/<id>/route/`). Backendda yangi qo'shilgan ruxsat. */
  const canDispatchRequests = computed(() => can('dispatch_requests'))
  const isAdmin = computed(() =>
    canManageUsers.value,
  )
  /** Faqat rahbariyat roli (SuperAdmin bundan mustasno): menyu va sahifalar cheklanadi. */
  const isLeaderOnly = computed(() =>
    !isSuperAdmin.value &&
    (session.value?.roleCodes ?? []).some((code) => LEADER_ROLE_CODES.includes(code)),
  )
  /**
   * Faqat korrupsiya xodimi (masalan `anticorruption_officer`): korrupsiya ruxsati bor,
   * rahbariyat murojaatlari va boshqaruv ruxsatlari yo'q. Menyu, sahifalar va
   * bildirishnomalar faqat korrupsiya xabarlari (va Info) bilan cheklanadi.
   */
  const isCorruptionOnly = computed(() =>
    !isSuperAdmin.value &&
    !isLeaderOnly.value &&
    can('handle_corruption_reports') &&
    !BROAD_PERMISSIONS.some((code) => can(code)),
  )
  /** Cheklangan rejimda ochiq yo'llar; `null` — cheklov yo'q. */
  const allowedPaths = computed<string[] | null>(() => {
    if (isLeaderOnly.value) return ['/leadership-appeals', '/corruption-reports', '/info', '/profile']
    // Korrupsiya xodimi rahbarga mas'ul bo'lsa ham rahbariyat murojaatlari ochilmaydi.
    if (isCorruptionOnly.value) return ['/corruption-reports', '/anti-corruption', '/info', '/profile']
    return null
  })

  /** Bildirishnoma shu foydalanuvchiga tegishlimi (sahifasiga kira oladimi). */
  function canSeeNotification(targetType: string | null): boolean {
    if (targetType === 'corruption_report') return can('handle_corruption_reports')
    // Korrupsiya xodimiga faqat korrupsiya bildirishnomalari.
    if (isCorruptionOnly.value) return false
    if (targetType === 'appeal') return can('handle_leadership_appeals')
    // Cheklangan rejimda xizmat murojaatlari va umumiy (tizim) bildirishnomalar ko'rsatilmaydi.
    return allowedPaths.value === null
  }

  const homePath = computed(() => {
    if (isLeaderOnly.value) return '/leadership-appeals'
    if (isCorruptionOnly.value) return '/corruption-reports'
    return isStaff.value ? '/statistics' : '/services'
  })

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
      roleCodes: activeAssignments(user).map((assignment) => assignment.role_code).filter(Boolean),
      ...resolvePermissions(user, activeAssignments(user)),
      roleAssignments: activeAssignments(user),
      isSuperAdmin: user.is_super_admin === true || activeAssignments(user).some((assignment) => assignment.role_code === 'super_admin'),
      kind: resolveKind(user, session.value.method === 'demo' ? 'staff' : session.value.method),
    })
  }

  /** `/me/` dan barcha faol assignmentlarni qayta olib, sahifa/ruxsat
   * ko'rinishlarini serverdagi haqiqiy holat bilan sinxronlaydi. Role
   * o'zgartirilgan yoki muddat tugagan sessiyalar aynan shu orqali yangilanadi. */
  async function refreshSessionContext(): Promise<void> {
    if (!session.value) return
    try {
      const { data } = await http.get<BackendUser>('/api/v1/auth/me/')
      syncProfile(data)
    } catch {
      // Token yangilanishi yoki vaqtinchalik tarmoq xatosi loginni buzmasin.
    }
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
    can,
    canManageUsers,
    canDispatchRequests,
    homePath,
    isLeaderOnly,
    isCorruptionOnly,
    allowedPaths,
    canSeeNotification,
    loginWithPassword,
    beginLogin,
    handleCallback,
    logout,
    syncProfile,
    refreshSessionContext,
    fetchProfileImage,
    deleteProfileImage,
    syncFromHemis,
  }
})
