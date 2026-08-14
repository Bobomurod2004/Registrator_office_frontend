# CLAUDE.md — o'zgarishlar tarixi (Claude tomonidan qilingan ishlar)

Bu fayl Claude yordamida loyihaga kiritilgan barcha o'zgarishlarni kuzatib borish uchun yuritiladi. Har bir yozuv: sana, nima qilindi, qaysi fayllar o'zgartirildi.

## Loyiha haqida
- **Stack:** Vue 3 + TypeScript + Vite + Pinia + Vue Router
- **Local ishga tushirish:** `npm install` → `npm run dev` (http://localhost:3000 — port 3000 shart, chunki backend CORS faqat shu portga ruxsat bergan)
- Node.js talab qilinadi (`^20.19.0 || >=22.12.0`). Bu muhitda Node v22.14.0 o'rnatildi.
- **Backend API:** `http://172.22.0.57:8002` (`.env` dagi `VITE_API_BASE_URL`). Swagger: `http://172.22.0.57:8002/api/docs/`, OpenAPI sxema: `/api/schema/`.
- **Diqqat:** Docker'dagi Grafana konteyneri ham 3000-portni ishlatadi (monitoring stack, `docker-compose`). Frontend dev serverni ishga tushirishdan oldin agar 3000-port band bo'lsa: `docker stop reistratoroffice-grafana-1`.

---

## 2026-08-14

### 1. Loyihani local muhitda ishga tushirish
- Node.js v22.14.0 va npm 10.9.2 o'rnatildi (winget orqali muvaffaqiyatsiz bo'lgani uchun nodejs.org MSI orqali qo'lda o'rnatildi).
- `npm install` bajarildi — barcha bog'liqliklar o'rnatildi.
- Dev server ishga tushirildi: `npm run dev` (Vite, port 5173).
- **Yaratildi:** `.claude/launch.json` — Browser preview tool uchun dev server konfiguratsiyasi.

### 2. Login sahifasida parolni ko'rsatish/yashirish (password visibility toggle)
Login formasidagi parol maydoniga ko'z belgili tugma qo'shildi — bosilganda parol matn sifatida ko'rinadi, qayta bosilganda yashiriladi.

**O'zgartirilgan fayllar:**
- [`src/views/login.vue`](src/views/login.vue)
  - `showPassword` reaktiv o'zgaruvchisi qo'shildi.
  - Parol `<input>` `.field-input-group` wrapper ichiga olindi, `type` endi `showPassword` ga qarab `text`/`password` bo'lib o'zgaradi.
  - Wrapper ichiga `.password-toggle` tugmasi qo'shildi (ochiq/yopiq ko'z SVG ikonkalari bilan), `@click="showPassword = !showPassword"`.
- [`src/style.css`](src/style.css)
  - `.field-input-group`, `.password-toggle` va shu bilan bog'liq hover/dark-theme stillari qo'shildi (`:root[data-theme='dark'] .password-toggle` va `:hover` holatlari).
- [`src/i18n/messages.ts`](src/i18n/messages.ts)
  - Uchala tilga (`uz`, `ru`, `en`) `showPassword` va `hidePassword` matn kalitlari qo'shildi (tugmaning `aria-label`i uchun).

**Sinov:** Brauzerda parol maydoniga matn kiritilib, toggle tugmasi bosildi — input turi `password` dan `text` ga muvaffaqiyatli o'zgargani tasdiqlandi.

### 3. Login sahifasidagi "HEMIS - Xodim" ikonkasi (rasm) tuzatildi
Foydalanuvchi `method-icon` ichiga `<img src="/public/iconka.png">` qo'shgan edi, lekin rasm o'ta katta hajmda chiqib ketayotgan edi.

**Sabab:**
1. `src="/public/iconka.png"` noto'g'ri — Vite'da `public/` papkasi ichidagi fayllar build/dev vaqtida saytning ildiziga (`/`) ko'chiriladi, ya'ni to'g'ri yo'l `/iconka.png` (prefiksda `public/` bo'lmaydi).
2. Yangi `.method-icon-image` klassi uchun `style.css`da hech qanday o'lcham qoidasi yo'q edi, shu sabab rasm o'zining haqiqiy (katta) piksel o'lchamida ko'rsatilgan.

**O'zgartirilgan fayllar:**
- [`src/views/login.vue`](src/views/login.vue) — `src="/public/iconka.png"` → `src="/iconka.png"`.
- [`src/style.css`](src/style.css) — `.method-icon-image { width: 22px; height: 22px; object-fit: contain; }` qo'shildi (boshqa `.method-icon svg` ikonkalar bilan bir xil o'lchamda).

**Sinov:** Brauzerda login sahifasi ochilib, "HEMIS - Xodim" qatoridagi ikonka endi boshqa ikonkalar kabi 22x22px o'lchamda to'g'ri ko'rinishi tasdiqlandi.

### 4. OneID uchun `.ico` rasm qo'shilganda buzilgan `method-icon` blok tuzatildi
Foydalanuvchi OneID metodi uchun `<img src="/one_id.ico">` qo'shgan edi, natijada "HEMIS - Talaba" va "OneID" qatorlari noto'g'ri joylashib qoldi.

**Sabab (`.ico` faylning o'zida muammo yo'q edi):**
1. `<span class="method-icon">` ni yopadigan `</span>` tegi xato tarzda eski SVG kodini o'chirish uchun yozilgan HTML kommentariyaning ichida qolib ketgan edi — natijada span umuman yopilmagan, `method-copy` va `soon-badge` bloklari noto'g'ri joylashuvda render bo'layotgan edi.
2. Shu bilan birga "HEMIS - Talaba" metodining ikonkasi ham xato tarzda staff bilan bir xil rasmga (`/iconka.png`) almashtirilgan edi.

**O'zgartirilgan fayllar:**
- [`src/views/login.vue`](src/views/login.vue)
  - `method-icon` span'ini yopuvchi `</span>` to'g'ri joyga (uchta icon/img elementidan keyin) ko'chirildi.
  - "HEMIS - Talaba" uchun ikonka original SVG (talaba shapkasi) holatiga qaytarildi — alohida student rasm fayli mavjud bo'lmagani uchun.
  - OneID uchun `<img src="/one_id.ico">` saqlab qolindi (`.method-icon-image` klassi orqali 22x22px o'lchamda ko'rsatiladi).

**Sinov:** Brauzerda uchala metod qatori (HEMIS-Xodim, HEMIS-Talaba, OneID) to'g'ri, bir xil o'lchamdagi ikonkalar bilan, ustma-ust tushmasdan chiqishi tasdiqlandi.

### 5. Talabalar uchun "Ta'lim granti" bo'limi olib tashlandi
Talaba sifatida tizimga kirganlarga endi "Ta'lim granti" (`/grant`) ko'rinmaydi va u yerga to'g'ridan-to'g'ri havola orqali ham kira olmaydi. Xodimlar (staff) uchun sahifa va menyu bandi o'zgarishsiz qoldi.

**Izoh:** `grant.vue` ichida talabalar uchun mo'ljallangan alohida ko'rinish (`v-if="!authStore.isStaff"` — shaxsiy grant holati) mavjud edi, lekin foydalanuvchi talabalar uchun umuman olib tashlashni so'ragani sabab, route darajasida to'liq yopildi (faqat menyudan yashirish yetarli emas edi, chunki `/grant` manziliga to'g'ridan-to'g'ri kirish mumkin bo'lib qolar edi).

**O'zgartirilgan fayllar:**
- [`src/components/DashboardLayout.vue`](src/components/DashboardLayout.vue) — talaba uchun `menuLinks` ro'yxatidan `{ to: '/grant', ... }` bandi olib tashlandi.
- [`src/router/index.ts`](src/router/index.ts) — `/grant` route'iga `staffOnly: true` meta qo'shildi, endi talaba shu manzilga kirishga urinsa `/services`ga qaytariladi.

**Sinov:** `student / student123` bilan kirilib, chap menyuda "Ta'lim granti" yo'qligi va `/grant`ga to'g'ridan-to'g'ri kirishga urinilganda `/services`ga qaytarilishi brauzerda tasdiqlandi.

---

### 6. Login+parol qismi haqiqiy backendga ulandi (mock/demo olib tashlandi)
Backend API (`http://172.22.0.57:8002`, Swagger orqali tekshirildi) tayyor ekan. Login+parol endpointi (`POST /api/v1/auth/login/`) **faqat `department_admin` va `super_admin` rollari uchun** ishlaydi — boshqa rollar (talaba, operator, dekanat va h.k.) hali backendda faqat OAuth2/HEMIS orqali kiradi, u qism bugun tegilmadi (hali mock holida, tugmalar "Tez orada" deb o'chirilgan).

**Aniqlangan muammolar va yechimlari:**
1. **CORS:** backendda faqat `http://localhost:3000` origin uchun ruxsat berilgan ekan (boshqa portlar, jumladan avvalgi `5173`, bloklanadi). Shu sabab `vite.config.ts`ga `server.port: 3000` (`strictPort: true`) qo'shildi va `.claude/launch.json` ham yangilandi.
2. **Port to'qnashuvi:** mahalliy Docker'dagi `reistratoroffice-grafana-1` konteyneri ham 3000-portni band qilib turgan edi (monitoring stack). Frontend ishga tushishi uchun konteyner to'xtatildi (`docker stop reistratoroffice-grafana-1`).
3. **`.env`** yaratildi (`.gitignore`ga ham `.env`/`.env.*` qo'shildi, faqat `.env.example` git'da qoladi) — `VITE_API_BASE_URL=http://172.22.0.57:8002`.

**Backend bilan tasdiqlangan javob formati (`curl` orqali sinaldi):**
```
POST /api/v1/auth/login/  { hemis_id, password }
→ 200 { access, refresh, user: { id, hemis_id, full_name, role, role_display, ... } }
POST /api/v1/auth/token/refresh/  { refresh }
→ 200 { access, refresh }   ← refresh ham yangilanadi (rotation yoqilgan)
POST /api/v1/auth/logout/  { refresh }  (Authorization: Bearer <access> bilan)
→ 200 { detail: "Muvaffaqiyatli chiqildi." }
```

**O'zgartirilgan/yaratilgan fayllar:**
- [`src/services/tokenStore.ts`](src/services/tokenStore.ts) — **yangi**. `localStorage`dagi sessiyadan token o'qish/yozish uchun kichik yordamchi modul (Pinia store'ga bog'lanmagan, `http.ts` interceptor'lari uchun).
- [`src/services/http.ts`](src/services/http.ts) — har bir so'rovga `Authorization: Bearer <token>` avtomatik qo'shiladi (request interceptor); `401` kelsa, bir marta avtomatik `token/refresh` qilib, so'rovni qayta yuboradi (response interceptor); refresh ham muvaffaqiyatsiz bo'lsa — sessiya tozalanib, `/`ga (login) qaytariladi. `withCredentials: true` olib tashlandi (Bearer token cookie talab qilmaydi).
- [`src/stores/auth.ts`](src/stores/auth.ts)
  - `UserSession`ga `refreshToken` maydoni qo'shildi.
  - `DEMO_ACCOUNTS` va ularga asoslangan tekshiruv butunlay olib tashlandi.
  - `loginWithPassword` endi haqiqiy `POST /api/v1/auth/login/` chaqiradi, backend javobidagi `user` obyektini (`toSession()` orqali) ilova sessiyasiga map qiladi (`kind`: `role === 'student' ? 'student' : 'staff'`).
  - `logout()` endi lokal sessiyani darhol tozalaydi (route guard to'siq bo'lmasin uchun), so'ng fonda (natijasini kutmasdan) `POST /api/v1/auth/logout/` chaqirib, refresh tokenni backendda blacklist qiladi.
- [`src/views/login.vue`](src/views/login.vue) — endi noto'g'ri bo'lgan "demo hisoblar" eslatmasi (`admin/admin123` va h.k.) olib tashlandi.
- [`vite.config.ts`](vite.config.ts) — `server: { port: 3000, strictPort: true }`.
- [`.claude/launch.json`](.claude/launch.json) — port `5173` → `3000`.
- [`.env`](.env) — **yangi** (git'ga tushmaydi), real backend manzili bilan.
- [`.gitignore`](.gitignore) — `.env` / `.env.*` qo'shildi (`.env.example` bundan mustasno).

**Sinov:** Brauzerda `admin` / (haqiqiy parol) bilan kirilib, `/statistics`ga muvaffaqiyatli o'tilgani, `localStorage`da haqiqiy `accessToken`/`refreshToken`/`SuperAdmin` roli saqlangani, noto'g'ri parolda backend `400` qaytarib to'g'ri xato xabari chiqqani va "Chiqish" tugmasi sessiyani tozalab login sahifasiga qaytargani tasdiqlandi.

**Keyingi qadam (bugun qilinmadi):** OAuth2/HEMIS va talaba login oqimi (`/api/v1/hemis/oauth/*`, `/api/v1/hemis/student/oauth/*`) hali mock holatda — backend endpointlari mavjud, lekin `client_id`/`redirect_uri` kabi provayder sozlamalari hali `.env`da bo'sh.

---

### 7. "Sozlamalar" bo'limi to'liq ishlaydigan holatga keltirildi
Chap menyudagi "Sozlamalar" havolasi avval `href="#"` — bosilganda hech narsa qilmaydigan o'lik havola edi. Endi to'liq sahifa: profil ma'lumotlarini tahrirlash va parolni o'zgartirish, ikkalasi ham haqiqiy backendga ulangan.

**Backend bilan tasdiqlangan (`curl` orqali):**
```
GET   /api/v1/auth/me/                    → to'liq profil (email, phone, gender, language, department_name, ...)
PATCH /api/v1/auth/me/                    → { full_name?, email?, phone?, gender?, language? } qabul qiladi, yangilangan profilni qaytaradi
POST  /api/v1/auth/me/change-password/    → { old_password, new_password } shart; noto'g'ri joriy parolda/maydon bo'sh bo'lsa 400
```

**O'zgartirilgan/yaratilgan fayllar:**
- [`src/views/settings.vue`](src/views/settings.vue) — **yangi**. Ikki forma: (1) Profil — `full_name`, `email`, `phone`, `gender` tahrirlanadi, `hemis_id`/rol/bo'lim faqat o'qish uchun ko'rsatiladi; (2) Parolni o'zgartirish — `old_password`/`new_password`/tasdiqlash, yangi parollar mos kelmasa API'ga yubormasdan lokal xato ko'rsatiladi.
- [`src/router/index.ts`](src/router/index.ts) — `/settings` route qo'shildi (`requiresAuth: true`, ikkala rol uchun ham ochiq).
- [`src/components/DashboardLayout.vue`](src/components/DashboardLayout.vue) — "Sozlamalar" endi o'lik `<a href="#">` emas, `<router-link to="/settings">`.
- [`src/stores/auth.ts`](src/stores/auth.ts) — `UserProfile`/`BackendUser`/`BackendRole` tiplari eksport qilindi (settings sahifasi shundan foydalanadi); yangi `syncProfile()` metodi — profil PATCH qilingach, lokal sessiyadagi ism/rolni ham darhol yangilaydi (header'dagi ism-familiya qayta login qilmasdan yangilanishi uchun).
- [`src/i18n/messages.ts`](src/i18n/messages.ts) — uchala tilga (`uz`/`ru`/`en`) `settings.*` matn kalitlari qo'shildi.

**Diqqat (aniqlangan, lekin kod xatosi emas):** test paytida Browser avtomatlashtirish vositasining "koordinata bo'yicha click" usuli ba'zan noto'g'ri joyga bosib, forma submit bo'lmay qolishi mumkin edi — bu vositaning cheklovi, ilova kodida muammo yo'q. To'g'ridan-to'g'ri elementga (`ref` yoki DOM orqali) bosilganda hamma narsa to'g'ri ishladi.

**Sinov:** Profilga email/telefon kiritib saqlandi va backendda (`curl /auth/me/`) haqiqatan saqlangani tasdiqlandi; parolni o'zgartirish formasida mos kelmagan parollar kiritilganda API chaqirilmasdan to'g'ri xato xabari chiqishi tasdiqlandi (haqiqiy admin paroli xavfsizlik uchun testda o'zgartirilmadi).

---

## Qoida
Bundan keyingi har bir o'zgarishda ushbu faylga yangi sana ostida: nima qilingani, sababi va o'zgartirilgan fayllar ro'yxati qo'shiladi.
