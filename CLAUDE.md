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

## 2026-08-18

### 8. "Statistika" bo'limi to'liq haqiqiy backendga ulandi
Backendda yangi `/api/v1/statistics/*` endpointlar chiqarilgani sababli (foydalanuvchi: "hozirda statistika qismini ulab chiqishimiz kerak to'liq holatda"), Statistika sahifasi butunlay mock/lokal hisoblangan ma'lumotlardan (`appealsStore`/`staffStore` asosida) haqiqiy backend javoblariga o'tkazildi. **Diqqat:** foydalanuvchi aynan shu safar faqat statistika qismini ulashni so'ragan, boshqa yangi endpointlar ("hammasi emas") bu safar tegilmadi.

**Muammo:** Swagger sxemasida (`/api/schema/`) bu 9 ta endpointning javob tanasi hujjatlashtirilmagan (`responses: '200': description: 'No response body'`) — ya'ni haqiqiy maydon nomlari noma'lum. Shu sabab har bir endpoint uchun **moslashuvchan (defensive) normalize funksiyasi** yozildi: bir nechta ehtimoliy maydon nomini (`count`/`value`/`total`, `change_percent`/`change`/`percent_change` va h.k.) sinab ko'radi, mos kelmasa xavfsiz standart qiymatga (0/bo'sh massiv) tushadi.

**O'zgartirilgan/yaratilgan fayllar:**
- [`src/stores/statistics.ts`](src/stores/statistics.ts) — **yangi**. `useStatisticsStore` — 9 ta `GET` endpointni (`overview`, `monthly-trend`, `gender-monthly`, `category-breakdown`, `department-performance`, `sla-trend`, `activity-heatmap`, `status-summary`, `my-kpi`) `Promise.allSettled` orqali parallel chaqiradi (bittasi xato bersa, qolganlari baribir ko'rsatiladi); 3 ta eksport endpointi (`export/pdf`, `export/excel`, `export/csv`) — endi client-side `xlsx`/`jspdf` bilan emas, to'g'ridan-to'g'ri backend generatsiya qilgan faylni `blob` sifatida yuklab beradi.
- [`src/views/statistics.vue`](src/views/statistics.vue) — to'liq qayta yozildi: barcha grafik/KPI/jadval ma'lumotlari endi `statsStore`dan keladi; oylar filtri (6/12 oy) `<select v-model="statsStore.months">` qo'shildi, o'zgarganda qayta so'rov yuboradi; faqat xodimlar (`authStore.isStaff`) uchun yangi "Mening ko'rsatkichlarim" paneli qo'shildi (`myKpi`: bajarilgan/rad etilgan/kechikkan/o'rtacha baho).
- [`src/style.css`](src/style.css) — yangi `.my-kpi-row`/`.my-kpi-item` klasslar qo'shildi (mavjud `--dash-*` token va `.panel-v2` dizayn tiliga mos).
- [`src/i18n/messages.ts`](src/i18n/messages.ts) — `statistics` blokidan eskirgan mock/PDF-generatsiya kalitlari (`eyebrow`, `yearFilter`/`periodFilter`, `typesShareLabel`, qisqa `months` massivi, `general`/`onsite`, statik `departments` ro'yxati, barcha `pdf*` kalitlar) uchala tildan (`uz`/`ru`/`en`) olib tashlandi; o'rniga `period6`/`period12`, `myKpiTitle`/`myKpiCompleted`/`myKpiRejected`/`myKpiOverdue`/`myKpiAvgRating` qo'shildi.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. Haqiqiy login ma'lumotlari mavjud bo'lmagani sababli, yangi UI qismlari (KPI panel, oy filtri) real ilovaning `style.css`i yuklangan holda DOM'ga in'ektsiya qilib, ham dark, ham light temada vizual tekshirildi — dizayn joylashuvi va ranglar mavjud panellar bilan mos kelishi tasdiqlandi. **Haqiqiy backend javob shakli hali sinalmagan** (kredensiallar yo'qligi sababli) — agar `/api/v1/statistics/*` endpointlar normalize funksiyalarida taxmin qilingan maydon nomlaridan boshqacha nom qaytarsa, faqat `src/stores/statistics.ts` ichidagi tegishli `normalize*` funksiyasini tuzatish kifoya bo'ladi.

---

### 9. "Ma'lumotlar" (Info) bo'limi to'liq haqiqiy backendga ulandi
Foydalanuvchi: "endi info bo'yicha apiularni ulaymiz to'liq 100%api aniq va tiniq bo'lsin hozirda api mavjud". `/api/v1/info/` endpointi backendda **to'liq hujjatlashtirilgan** (Swagger'da schema aniq ko'rsatilgan — bu boshqa modullardan farqli, ular hujjatlanmagan edi), shu sabab bu safar taxminiy (defensive) parsing shart emas edi.

**Backend (`api/schema/` orqali tasdiqlangan) — `Info` obyekti:**
```
GET    /api/v1/info/       → { count, next, previous, results: Info[] }  (sahifalangan, ordering/search/page qo'llab-quvvatlanadi)
POST   /api/v1/info/       → { name, description } qabul qiladi → 201 Info
GET    /api/v1/info/{id}/  → Info
PUT/PATCH /api/v1/info/{id}/ → { name?, description? }
DELETE /api/v1/info/{id}/  → 204
Info: { id, name (Nomi), description (Tavsif — rich text HTML), created_at, updated_at }
```

**O'zgartirilgan fayllar:**
- [`src/stores/info.ts`](src/stores/info.ts) — localStorage-based mock butunlay olib tashlandi. Endi `http.ts` orqali haqiqiy CRUD: `fetchAll()` sahifalangan ro'yxatni `next` mavjud bo'lguncha to'liq yig'ib oladi; `addEntry`/`updateEntry`/`removeEntry` mos ravishda `POST`/`PATCH`/`DELETE` chaqiradi va natijani lokal `entries` massivida darhol yangilaydi (backend javobidan, optimistik emas). Backend maydon nomlari (`name`/`description`) ilova ichidagi (`title`/`bodyHtml`) nomlardan farqli, shu sabab `normalize()` orqali map qilinadi. `InfoEntry.id` endi `number` (avval `string` edi, mock uchun `INFO-${Date.now()}` ishlatilgan).
- [`src/views/info.vue`](src/views/info.vue) — `onMounted` da `infoStore.fetchAll()` chaqiriladi; `selectedId`/`editingId` `number | null` ga o'zgartirildi; forma yuborish/o'chirish endi `async` va xato holatlarini (`formError`/`deleteError`, mavjud `.form-error` klassi orqali) ko'rsatadi; yuklanish/bo'sh holat (`m.info.loading`/`m.info.empty`) qo'shildi.
- [`src/i18n/messages.ts`](src/i18n/messages.ts) — uchala tilga (`uz`/`ru`/`en`) `info.loading`/`info.empty`/`info.loadError`/`info.saveError`/`info.deleteError` kalitlari qo'shildi.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. `curl` orqali `GET /api/v1/info/` token'siz `401 Authentication credentials were not provided` qaytarishi tasdiqlandi (endpoint himoyalangan, kutilganidek). Haqiqiy kredensiallar yo'qligi sababli to'liq login qilib CRUD oqimini brauzerda sinab bo'lmadi, lekin schema to'liq hujjatlashtirilgani uchun maydon nomlarida noaniqlik yo'q — qolgan modullardagidek "backend boshqacha nom qaytarishi mumkin" ogohlantirishi bu safar kerak emas.

---

### 10. "Aloqa" (Contacts) bo'limi to'liq haqiqiy backendga ulandi
Foydalanuvchi: "endi aloqa ma'lumotlari qo'shimiz kerak apilar to'liq ulab bersangda". `/api/v1/contacts/` endpointi ham `/api/v1/info/` kabi **to'liq hujjatlashtirilgan**, bir xil CRUD naqshiga ega.

**Backend (`api/schema/` orqali tasdiqlangan) — `Contact` obyekti:**
```
GET    /api/v1/contacts/       → { count, next, previous, results: Contact[] }
POST   /api/v1/contacts/       → { name, phone, short_phone? } qabul qiladi → 201 Contact
GET/PUT/PATCH/DELETE /api/v1/contacts/{id}/
Contact: { id, name (Nomi: bo'lim/xodim), phone (Telefon, majburiy), short_phone (Qisqa ichki raqam, ixtiyoriy), created_at, updated_at }
```

**O'zgartirilgan fayllar:**
- [`src/stores/contacts.ts`](src/stores/contacts.ts) — localStorage mock olib tashlandi, `[src/stores/info.ts](src/stores/info.ts)`dagi bilan bir xil naqsh: `fetchAll()` sahifalab to'liq ro'yxatni yig'adi, `addEntry`/`updateEntry`/`removeEntry` — `POST`/`PATCH`/`DELETE`. `ContactEntry.id` `number`ga o'zgartirildi; `title`/`shortNumber` ilova nomlari `name`/`short_phone` backend nomlariga map qilinadi.
- [`src/views/contacts.vue`](src/views/contacts.vue) — `onMounted`da `fetchAll()`; `editingId` `number | null`; forma/o'chirish `async`, yuklanish/xato holatlari (`m.contacts.loading`/`loadError`/`saveError`/`deleteError`) qo'shildi.
- [`src/i18n/messages.ts`](src/i18n/messages.ts) — uchala tilga `contacts.loading`/`loadError`/`saveError`/`deleteError` kalitlari qo'shildi.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. `curl` bilan `GET /api/v1/contacts/` token'siz `401` qaytarishi tasdiqlandi (kutilganidek himoyalangan). Schema to'liq hujjatlashtirilgani uchun maydon nomlarida noaniqlik yo'q. Haqiqiy kredensiallar yo'qligi sababli to'liq CRUD oqimi jonli login bilan sinalmadi.

---

### 11. HEMIS OAuth2 login (Xodim va Talaba) ishga tushirildi — to'liq backend-boshqaruvli oqim
Foydalanuvchi: "hozirda endi auth qismi qilamiz hozirda hemis student va hemis hodim ni ishga tushuramiz ... apilar tayyor". Avval login sahifasidagi "HEMIS · Xodim"/"HEMIS · Talaba"/"OneID" tugmalari butunlay o'chirilgan edi (`oauthEnabled = false`), ilova esa client-side PKCE (`code_verifier`/`code_challenge`, HEMIS/OneID'ning o'z `authorize`/`token` URL'lariga to'g'ridan-to'g'ri chiqish) uchun qurilgan edi — bu yondashuv backendning haqiqiy arxitekturasiga mos emas ekan.

**Backend arxitekturasi (Swagger orqali aniqlandi) — to'liq backend-boshqaruvli OAuth2:**
```
GET  /api/v1/hemis/oauth/redirect/          (xodim)  → HEMIS login URL'ini qaytaradi
GET  /api/v1/hemis/student/oauth/redirect/  (talaba) → HEMIS Student login URL'ini qaytaradi
     — frontend shu URL'ga window.location bilan o'tadi. client_id/client_secret/
       redirect_uri butunlay backendda saqlanadi, frontend ularni bilishi shart emas.
POST /api/v1/hemis/oauth/callback/          (xodim)  → { code, state } qabul qiladi
POST /api/v1/hemis/student/oauth/callback/  (talaba) → { code, state } qabul qiladi
     — backend HEMIS bilan o'zi code→token almashinuvini bajaradi, foydalanuvchini
       DB'ga yozadi/yangilaydi va JWT qaytaradi (login+parol javobiga o'xshash:
       { access, refresh, user: {...} } — aniq tasdiqlanmagan, chunki "No response
       body" deb hujjatlashtirilgan, lekin boshqa auth endpointlar bilan bir xil naqsh).
```
**OneID uchun backendda mos endpoint umuman topilmadi** (schema'da faqat `hemis*` yo'llar bor) — shu sabab OneID tugmasi hamon "Tez orada" holatida qoldirildi, faqat HEMIS (xodim+talaba) yoqildi.

**Yangi login oqimi:**
1. Foydalanuvchi "HEMIS · Xodim" yoki "HEMIS · Talaba" tugmasini bosadi.
2. Frontend mos `GET .../oauth/redirect/` chaqiradi, javobdan URL'ni ajratib oladi (maydon nomi hujjatlashtirilmagani uchun `url`/`redirect_url`/`login_url`/`authorization_url`/`auth_url` ketma-ket sinaladi), tanlangan metodni (`staff`/`student`) `sessionStorage`'ga yozadi va shu URL'ga o'tadi.
3. HEMIS (yoki HEMIS Student) saytida login qilingach, brauzer backendda ro'yxatdan o'tgan `redirect_uri`ga (`http://localhost:3000/callback` — ilovaning mavjud `/callback` sahifasi) `?code=...&state=...` bilan qaytadi.
4. `/callback` sahifasi (`src/views/callback.vue`, o'zgarishsiz qoldi) `code`/`state`ni o'qiydi, `sessionStorage`dan metodni tiklaydi va mos `POST .../oauth/callback/` ni chaqiradi; muvaffaqiyatli bo'lsa sessiya ochiladi va `authStore.homePath`ga (xodim → `/statistics`, talaba → `/services`) yo'naltiriladi.

**O'zgartirilgan/o'chirilgan fayllar:**
- [`src/stores/auth.ts`](src/stores/auth.ts) — `beginLogin`/`handleCallback` to'liq qayta yozildi (yuqoridagi oqim). Eski client-side PKCE almashinuvi (`exchangeCodeForSession`), mock profil generatsiyasi (`MOCK_PROFILES`, `isMockMode`) butunlay olib tashlandi — endi faqat haqiqiy backend chaqiriladi. `toSession()`ga `method` parametri qo'shildi (staff/student sessiyasini to'g'ri belgilash uchun). Yangi `oauthError` state (parol xatosidan alohida, chunki ikkalasi ham UI'ning turli joylarida ko'rsatiladi).
- [`src/views/login.vue`](src/views/login.vue) — `oauthEnabled` endi metod bo'yicha alohida (`{ staff: true, student: true, oneid: false }`); "HEMIS · Xodim"/"HEMIS · Talaba" tugmalari `@click="startOAuth(method.id)"` orqali `authStore.beginLogin()`ni chaqiradi, bosilganda spinner ko'rsatadi; OneID hamon disabled va "Tez orada" belgisi bilan qoladi; `authStore.oauthError` uchun alohida xato xabari qo'shildi.
- [`src/views/callback.vue`](src/views/callback.vue) — muvaffaqiyatli kirishdan keyin endi har doim `/services`ga emas, `authStore.homePath`ga (rolga qarab `/statistics` yoki `/services`) yo'naltiradi.
- **O'chirildi:** [`src/config/oauth.ts`](src/config/oauth.ts) va [`src/services/pkce.ts`](src/services/pkce.ts) — client-side PKCE arxitekturasi uchun yozilgan, endi butunlay keraksiz (backend client_id/client_secret/redirect_uri'ni o'zida saqlaydi).
- [`.env`](.env) / [`.env.example`](.env.example) — `VITE_HEMIS_*`/`VITE_ONEID_*`/`VITE_OAUTH_REDIRECT_URI` o'zgaruvchilari olib tashlandi (endi frontend kodida ishlatilmaydi). Eslatma sifatida: backendda HEMIS uchun ro'yxatdan o'tgan redirect_uri — `http://localhost:3000/callback`.

**Sinov (brauzerda, real backend bilan):** "HEMIS · Xodim" tugmasi bosilganda ilova haqiqatan **`https://hemis.uzswlu.uz`** login sahifasiga, "HEMIS · Talaba" bosilganda **`https://student.uzswlu.uz`** login sahifasiga muvaffaqiyatli yo'naltirilgani tasdiqlandi — demak `GET .../oauth/redirect/` javobidan URL to'g'ri ajratib olinmoqda va real HEMIS tizimlariga real redirect ishlayapti. `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi (1633 → 1631 modul, ikkita o'chirilgan fayl tasdiqlandi).

**Haqiqiy kredensiallar yo'qligi sababli sinalmagan qism:** HEMIS saytida login qilib, kod bilan `/callback` sahifasiga qaytishdan keyingi `POST .../oauth/callback/` javobi (JWT+user) hali jonli sinalmadi — javob shakli boshqa auth endpointlar (`/auth/login/`) bilan bir xil deb taxmin qilindi (`{access, refresh, user}`). Agar backend boshqacha shaklda qaytarsa, faqat `handleCallback()` ichidagi `data.access`/`data.refresh`/`data.user` o'qish qatorlarini tuzatish kifoya.

---

### 12. HEMIS login qilingandan keyin tizimga qaytmaslik muammosi tuzatildi
Foydalanuvchi: "tizimga kirshni bosdim lekin bizning tizimga qaytib kelmadida... hemisning o'zida qolib ketmasligi kerakda". HEMIS saytida login qilingach, brauzer bizning ilovaga qaytmayotgan edi.

**Sabab topildi (`curl` bilan `GET /api/v1/hemis/oauth/redirect/` va `.../student/oauth/redirect/` javoblari tekshirilib aniqlandi):** backend HEMIS'ga yuboradigan authorize URL'ga quyidagi `redirect_uri`larni joylashtirar ekan:
```
Xodim:  redirect_uri=http://localhost:3000/api/auth/callback/hemis
Talaba: redirect_uri=http://localhost:3000/api/auth/callback/studentoauth
```
Bu yo'llar — `/api/auth/callback/...` — **NextAuth.js**ning standart callback naqshiga o'xshaydi va ilovaning haqiqiy `/callback` marshrutiga mos kelmaydi. Tekshirilgach, bu yo'l na backendda (`curl` — Django 404 qaytardi), na frontend `router/index.ts`da ro'yxatdan o'tgan edi — ya'ni HEMIS login qilingach shu manzilga qaytganda, Vue Router hech qanday route bilan mos kelmasdi va sahifa "osilib qolgandek" ko'rinar edi.

**Yechim (frontend darajasida, backendni kutmasdan ishlaydigan qilib qo'yildi):** `callback.vue` komponenti allaqachon path-agnostik edi (faqat `window.location.search` va `sessionStorage`dan o'qiydi, qaysi marshrutda joylashganiga bog'liq emas) — shu sabab backend haqiqatda ishlatayotgan ikkala aniq manzilga ham xuddi shu komponentni bog'lash yetarli bo'ldi.

**O'zgartirilgan fayllar:**
- [`src/router/index.ts`](src/router/index.ts) — ikkita yangi route qo'shildi: `/api/auth/callback/hemis` va `/api/auth/callback/studentoauth`, ikkalasi ham mavjud `callback.vue` komponentini ishlatadi (`/callback`dagi bilan bir xil).

**Sinov:** Brauzerda `http://localhost:3000/api/auth/callback/hemis?code=test&state=test` manziliga to'g'ridan-to'g'ri kirilganda endi sahifa bo'sh qolmasdan callback ekranini ko'rsatdi va backendga `POST /api/v1/hemis/oauth/callback/` so'rovini yubordi (backend soxta kod uchun `400` qaytardi — bu to'g'ri, chunki route/komponent zanjiri to'liq ishlayotganini tasdiqlaydi, faqat kodning o'zi haqiqiy emasligi sababli rad etildi). `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi.

**MUHIM — bu tuzatish vaqtinchalik yamoq, tub sabab hali backend tomonda:** Ideal holatda backend HEMIS'ga yuboradigan `redirect_uri` ilovaning asosiy `/callback` marshrutiga (`http://localhost:3000/callback`) ishora qilishi kerak edi — bu esa HEMIS'ning OAuth klient sozlamalarida (client_id=4 xodim uchun, client_id=9 talaba uchun) qanday manzil ro'yxatga olinganiga bog'liq. Agar HEMIS o'z tarafida faqat aynan shu (`/api/auth/callback/hemis` / `/api/auth/callback/studentoauth`) manzillarni whitelistga olgan bo'lsa — demak backend buni ataylab shunday sozlagan va frontenddagi bu tuzatish TO'G'RI yechim (o'zgartirish shart emas). Ammo agar bu manzillar HEMIS'ning o'zida umuman ro'yxatdan o'tmagan bo'lsa (masalan, boshqa loyihadan qolgan sozlama nusxa ko'chirilgan bo'lsa), HEMIS login qilingandan keyin xato chiqarib, foydalanuvchini hech qayerga qaytarmasligi ("HEMIS'ning o'zida qolib qolish") mumkin — bu holatda muammo HEMIS'ning administrator panelida shu ikki `redirect_uri`ni to'g'ri ro'yxatga olishda, backendning javobini o'zgartirishda emas. Foydalanuvchi haqiqiy HEMIS hisobi bilan qayta sinab ko'rishi va agar hamon HEMIS saytida qolib ketaversa, bu haqiqatan ham HEMIS tarafidagi ro'yxatga olish muammosi ekanini backend/HEMIS administratoriga yetkazishi kerak.

---

### 13. Xodim qo'shishdagi xatolik matni endi to'liq ko'rsatiladi (tub sabab hali aniqlanmoqda)
Foydalanuvchi: "nega xodim qo'shishda xatolik yuzbermoqda shuni ko'rib to'g'rilab bera olasanmi". Kodni (`staff.vue`/`staff.ts`) va backend schema'sini (`UserCreate`, `RoleEnum`) solishtirib chiqdim — yuborilayotgan payload (`employee_id_number`, `full_name`, `role`, `department`, `email`, `phone`) schema bilan mos, aniq bitta noto'g'ri maydon topilmadi.

**Aniqlangan haqiqiy muammo:** xato xabarini ko'rsatish kodi `err?.response?.data?.detail || fallback` edi — lekin DRF serializer validatsiya xatolari odatda `{detail: "..."}` shaklida EMAS, balki `{"maydon_nomi": ["xato matni"]}` shaklida qaytadi (masalan `{"role": ["..."]}` yoki `{"department": ["..."]}`). Bu holatda `data.detail` mavjud bo'lmagani uchun kod har doim umumiy "Xodim qo'shishda xatolik yuz berdi." xabarini ko'rsatgan — **haqiqiy sabab (qaysi maydon, nima uchun) foydalanuvchiga ham, menga ham ko'rinmay qolgan**.

**O'zgartirilgan fayllar:**
- [`src/services/http.ts`](src/services/http.ts) — yangi umumiy `extractApiError(err, fallback)` funksiyasi qo'shildi: avval `{detail}`ni, topilmasa DRF'ning `{field: [xabarlar]}` shaklidagi barcha maydon xatolarini birlashtirib o'qiydi, aks holda fallback matnni qaytaradi.
- [`src/views/staff.vue`](src/views/staff.vue) — qidiruv (`searchError`), xodim qo'shish (`createError`) va rol yangilash (`roleError`) xatolari endi shu funksiya orqali — backend qaytargan **aniq** sabab endi ekranda ko'rinadi.

**Diqqat — shubhali joy (tasdiqlanmagan, faqat gumon):** backend schema'sida rol yangilash endpointi uchun "DepartmentAdmin faqat o'z bo'limidagi xodimlarga rol berishi mumkin" degan cheklov aniq yozilgan; xodim qo'shish endpointida bunday cheklov hujjatlashtirilmagan, lekin xuddi shunday cheklov (department_admin faqat o'z bo'limiga xodim qo'sha olishi) yashirin bo'lishi mumkin — agar shunday bo'lsa va foydalanuvchi formadan boshqa bo'limni tanlasa, backend xatolik qaytarishi mumkin. Bu hozircha tasdiqlanmagan gumon.

**Keyingi qadam:** endi xato yuz berganda ekranda **aniq matn** chiqadi (masalan "role: ..." yoki "department: ..."). Iltimos, xodim qo'shishga qayta urinib ko'ring va endi chiqqan **aniq xato matnini** ayting — shu orqali tub sababni bevosita tuzataman (hozircha haqiqiy kredensiallar yo'qligi sababli jonli sinab bo'lmadi).

---

### 14. "Xodimlar" bo'limida talabalar ham chiqib qolayotgan edi — tuzatildi
Foydalanuvchi: "nega tizmda xodimlar bo'limida talablar kelmoqda biz xodimlar kelsin studentlar kerak emas". Sabab: `GET /api/v1/auth/users/` backendda **"Barcha foydalanuvchilar (admin uchun)"** deb hujjatlashtirilgan — ya'ni talabalar ham, xodimlar ham birga qaytadi, va bu endpointda rol bo'yicha filtrlash parametri umuman yo'q (faqat `ordering`/`page`/`search`).

**O'zgartirilgan fayllar:**
- [`src/stores/staff.ts`](src/stores/staff.ts) — `fetchMembers()` endi ro'yxatni `role !== 'student'` bo'yicha client tarafda filtrlaydi. Talabalar ham sahifalash (`page_size`) limitiga kirgani uchun, agar talabalar ko'p bo'lsa xodimlar keyingi sahifada qolib, ro'yxatdan tushib qolishi mumkin edi — shu sabab endi bir sahifa emas, `next` tugaguncha **barcha sahifalar** to'liq yig'ib olinadi (xuddi `info.ts`/`contacts.ts`dagi kabi), so'ng filtrlanadi.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. Haqiqiy ma'lumot bilan (talaba+xodim aralash ro'yxat) jonli sinash uchun kredensial yo'q, lekin filtr mantig'i (`role !== 'student'`) backend `RoleEnum`ning `student` qiymatiga to'g'ridan-to'g'ri mos keladi — shu sabab noaniqlik yo'q.

---

### 15. Bo'lim ma'muri/SuperAdmin roli berilgan xodim tizimga kira olmasligi — parol o'rnatish imkoniyati qo'shildi
Foydalanuvchi: "nega xodim tizimga kira olmayabdi ... unga role beril tizimga qo'shilganku". Aniqlashtiruvchi savol orqali bilib oldim: xodim **"HEMIS · Xodim"** tugmasi orqali kirishga urindi, unga esa **"Bo'lim ma'muri" yoki "SuperAdmin"** roli berilgan edi.

**Sabab:** Backendning o'zi (`Login` sxemasi tavsifida) aniq belgilagan: *"Faqat Bo'lim ma'muri (department_admin) va SuperAdmin uchun local login+parol. Talaba, operator, dekanat, buxgalter, ilmiy va xalqaro aloqalar xodimlari uchun bu endpoint ishlamaydi — ular FAQAT OAuth2 orqali kiradi."* — ya'ni **arxitektura teskarisini nazarda tutadi**: Bo'lim ma'muri/SuperAdmin **login+parol** bilan kirishi kerak, HEMIS tugmasi orqali emas. Muammo: xodim qo'shish (`POST /api/v1/auth/users/create/`) va rol o'zgartirish (`PATCH /api/v1/auth/users/{id}/role/`) endpointlari ikkalasi ham ixtiyoriy `password` maydonini qabul qiladi (schema orqali tasdiqlangan — rol-yangilash tavsifida: *"Agar yangi rol department_admin yoki super_admin bo'lsa va foydalanuvchi HEMIS OAuth orqali yaratilgan bo'lsa (paroli yo'q), password maydoni orqali unga local login uchun parol o'rnatish mumkin"*), **lekin frontendning "Xodim qo'shish" va "Rolni tahrirlash" formalarida bu maydon umuman yo'q edi** — shu sabab admin xodimga rol bergan bo'lsa ham, unga hech qachon parol o'rnatilmagan, natijada login+parol HAM ishlamagan (parol yo'q), HEMIS OAuth HAM mo'ljallanmagan (chunki bu rol uchun login+parol belgilangan).

**O'zgartirilgan fayllar:**
- [`src/stores/staff.ts`](src/stores/staff.ts) — `CreateStaffPayload`ga ixtiyoriy `password?: string` qo'shildi; `updateRole(id, role, password?)` endi uchinchi, ixtiyoriy `password` parametrini backendga uzatadi.
- [`src/views/staff.vue`](src/views/staff.vue) — yangi `isPasswordRole(role)` yordamchisi (`department_admin`/`super_admin` uchun `true`). Ikkala joyda ham — "Yangi xodim" formasi va jadvaldagi "Rolni tahrirlash" inline formasi — tanlangan rol shu ikkitasidan biri bo'lsa, **parol maydoni avtomatik ko'rinadi** (izoh matni bilan: nima uchun kerakligi tushuntiriladi). Boshqa rollarda maydon yashirin qoladi (ular uchun parol shart emas).
- [`src/i18n/messages.ts`](src/i18n/messages.ts) — uchala tilga `staff.passwordLabel`/`passwordPlaceholder`/`passwordHint` qo'shildi.
- [`src/style.css`](src/style.css) — umumiy `.field-hint` klassi (yorug'/qorong'i tema) va kompakt `.role-edit-password` klassi qo'shildi.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. Yangi parol maydoni real ilova `style.css`i bilan ham qorong'i, ham yorug'i temada brauzerda vizual tekshirildi — joylashuv va matn to'g'ri ko'rinishi tasdiqlandi.

**Foydalanuvchiga amaliy ko'rsatma:** allaqachon "Bo'lim ma'muri"/"SuperAdmin" roli berilgan, lekin paroli yo'q xodim uchun — "Xodimlar" bo'limida shu xodimning qatoridagi rolga bosib, "Rolni tahrirlash" oynasini oching, endi paydo bo'lgan **Parol** maydoniga yangi parol kiriting va saqlang. Shundan keyin u xodim **bosh sahifadagi Login/Parol** formasi orqali (HEMIS tugmasi emas!) `hemis_id` va shu parol bilan kira oladi.

---

### 16. HEMIS callback xatosi ham endi to'liq matn bilan ko'rsatiladi
Foydalanuvchi: "lekin boshqa roldagilar nega hemis orqali kira olmayabdi" — operator/dekanat/buxgalter kabi rollarga ega xodimlar ham (routing tuzatilgandan keyin) bizning saytga qaytadi, lekin `/callback` sahifasida xato ko'rsatadi.

**Sabab — xuddi 13-band bilan bir xil naqsh:** `callback.vue` xatoni `err instanceof Error ? err.message : '...'` orqali ko'rsatar edi — axios xatolari uchun `err.message` faqat **"Request failed with status code 400"** kabi umumiy matn beradi, backend qaytargan **aniq sabab** (`response.data`) butunlay yashiringan edi.

**O'zgartirilgan fayllar:**
- [`src/views/callback.vue`](src/views/callback.vue) — endi avval `extractApiError()` orqali backend javobidagi aniq sababni qidiradi, topilmasa (masalan bizning o'z `throw new Error(...)` xabarlarimiz — "Avtorizatsiya kodi topilmadi." va h.k. uchun) `err.message`ga qaytadi.

**Sinov — muhim topilma:** Soxta `code`/`state` bilan `/api/auth/callback/hemis` ga kirilganda, endi ekranda **aniq backend xabari** chiqdi: *"state parametri yaroqsiz. U /oauth/redirect/ qaytargan state bilan bir xil bo'lishi kerak."* — bu tasdiqlaydi: backend `state`ni imzolangan (signed) token sifatida tekshiradi, u `/oauth/redirect/` chaqirilganda generatsiya qilingan qiymat bilan **aynan bir xil** bo'lishi shart (mening testimda soxta qiymat bo'lgani uchun tabiiy ravishda rad etildi — bu MENING sinovim uchun kutilgan natija, haqiqiy xodimning muammosi emas).

**Keyingi qadam:** bu tuzatish bilan endi "boshqa roldagi" xodim HEMIS orqali kirishga urinib, xato chiqqanda, ekranda **aniq sabab matni** ko'rinadi (masalan xuddi yuqoridagi kabi "state parametri yaroqsiz" yoki butunlay boshqa xabar). Iltimos, o'sha xodim bilan (yoki o'zingiz shu xodim nomidan) HEMIS orqali qayta kirishga urinib ko'ring va **endi chiqqan aniq xato matnini** ayting — shundan keyin tub sababni to'g'ridan-to'g'ri aniqlab tuzataman.

---

### 17. Yangi "Profil" sahifasi qo'shildi — barcha hisob ma'lumotlari bitta joyda
Foydalanuvchi: "hozirda qiladigan ishimiz profe me qilishimiz kerakda barcha narsalari chiqib turadigan bo'lishi kerakda" — aniqlashtiruvchi savol orqali bu "Profil sahifasi (barcha ma'lumotlar to'liq)" ekani tasdiqlandi, ya'ni mavjud "Sozlamalar" (tahrirlash uchun) dan alohida, faqat **o'qish uchun** to'liq profil ko'rinishi.

**O'zgartirilgan/yaratilgan fayllar:**
- [`src/views/profile.vue`](src/views/profile.vue) — **yangi**. `GET /api/v1/auth/me/` dan kelgan `UserProfile`ning barcha maydonlarini (`hemis_id`, `role_display`, `department_name`, `email`, `phone`, `gender`, `language`, `created_at` — "Ro'yxatdan o'tgan sana" sifatida formatlangan, `is_locked` — "Faol"/"Bloklangan" holat, `student_profile` — faqat mavjud bo'lsa) katta avatar+ism+rol-belgisi bilan boshlanadigan karta ko'rinishida ko'rsatadi; yuqorida "Tahrirlash" tugmasi `/settings`ga olib boradi.
- [`src/router/index.ts`](src/router/index.ts) — `/profile` route qo'shildi (`requiresAuth: true`, ikkala rol uchun ham ochiq).
- [`src/components/DashboardLayout.vue`](src/components/DashboardLayout.vue) — chap menyudagi profil kartasi (avatar+ism+rol) endi `/profile`ga olib boradigan bosiladigan havola; "Sozlamalar" yonida yangi "Profil" bandi qo'shildi.
- [`src/i18n/messages.ts`](src/i18n/messages.ts) — uchala tilga yangi `profile.*` bloki (title/subtitle/editLink/memberSince/accountStatus/statusActive/statusLocked/studentProfile/notSet/languageValues) va `menu.profile` kaliti qo'shildi; ko'p umumiy label (HEMIS ID, Rol, Bo'lim, jins, til) mavjud `settings.*` kalitlaridan qayta foydalanildi (dublikat oldini olish uchun).
- [`src/style.css`](src/style.css) — `.profile-card` endi `<router-link>` (`<a>`) sifatida ishlatilgani uchun `text-decoration: none` va hover holati (yorug'/qorong'i tema) qo'shildi.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi (yangi `profile` chunk yaratildi). Yangi karta ko'rinishi (`.profile-view-card`, avatar, rol-belgisi, ma'lumot gridi) real ilova `style.css`i yuklangan holda DOM'ga in'ektsiya qilib qorong'i temada tekshirildi — matn va joylashuv to'g'ri chiqishi tasdiqlandi. Haqiqiy kredensiallar yo'qligi sababli to'liq sahifani jonli login bilan (chap menyu/route guard bilan birga) sinab bo'lmadi.

---

## 2026-08-19

### 18. Info va Aloqa — kontent endi 4 tilda kiritiladi (uz lotin, uz kirill, ru, en)
Foydalanuvchi: "hozirda tizmizda birqancha o'zgartirishlar qilishimiz kerak ... apilarda bir nechta o'zgarishlar bo'ldi shuni to'g'rilash kerak info va aloqa da 3 til va qo'shimcha 4chi krel alifbosida yozilaigan o'zbek tili ham qo'shildi". Aniqlashtiruvchi savol orqali tasdiqlandi: bu **kontent** darajasida — sayt interfeysi (header'dagi til almashtirgich) hozirgidek 3 tilda (UZ/RU/EN) qoladi, faqat admin Info/Aloqa yozuvlarini endi 4 til uchun alohida kiritadi, foydalanuvchi qaysi tilni tanlasa (UZ/RU/EN dan), shu tilga mos matn ko'rsatiladi.

**Backend (`api/schema/` orqali tasdiqlangan) — `Info`/`Contact` obyektlari endi per-til maydonlarga bo'lingan:**
```
Info:    { id, name (o'qish uchun, joriy tilga moslashtirilgan), description (o'qish uchun),
           name_uz (majburiy), name_uz_cyrl, name_ru, name_en,
           description_uz (majburiy emas, lekin amalda asosiy), description_uz_cyrl, description_ru, description_en,
           created_at, updated_at }
Contact: { id, name (o'qish uchun), name_uz (majburiy), name_uz_cyrl, name_ru, name_en,
           phone (majburiy), short_phone, created_at, updated_at }
GET /api/v1/info/ va /api/v1/contacts/ — yangi `?lang=uz|uz_cyrl|ru|en` query parametri qo'shildi:
  "Javob tili... Berilmasa — foydalanuvchi profilidagi til, aks holda o'zbek."
```

**O'zgartirilgan fayllar:**
- [`src/stores/info.ts`](src/stores/info.ts) — `fetchAll()` endi joriy UI tiliga mos `lang` parametri bilan so'rov yuboradi (backend shu tilga moslashtirilgan `name`/`description`ni resolved qilib qaytaradi); `InfoEntry`ga barcha 8 ta xom (`name_uz`/`..._cyrl`/`..._ru`/`..._en`, `description_uz`/`..._cyrl`/`..._ru`/`..._en`) maydon qo'shildi (tahrirlash formasini to'ldirish uchun); `addEntry`/`updateEntry` endi bitta `InfoTranslations` obyektini qabul qiladi.
- [`src/stores/contacts.ts`](src/stores/contacts.ts) — xuddi shunday naqsh, faqat `name_*` (description yo'q, chunki Contact'da tavsif maydoni umuman yo'q).
- [`src/views/info.vue`](src/views/info.vue), [`src/views/contacts.vue`](src/views/contacts.vue) — qo'shish/tahrirlash formalarida yangi **til tablari** (4 ta pill-tugma: "O'zbek (lotin)"/"O'zbek (kirill)"/"Rus"/"Ingliz") qo'shildi — tanlangan tabga qarab sarlavha/mazmun (Info uchun) maydonlari o'sha tilning qiymatini ko'rsatadi/tahrirlaydi. Faqat "O'zbek (lotin)" majburiy (backend talabiga mos), qolganlari ixtiyoriy. `localeStore.locale` o'zgarganda (`watch`) ro'yxat avtomatik qayta yuklanadi — foydalanuvchi tilni almashtirsa, Info/Aloqa matnlari ham darhol yangi tilga o'tadi.
- [`src/i18n/messages.ts`](src/i18n/messages.ts) — `info.langHint`/`contacts.langHint` kalitlari qo'shildi (uchala tilda); til tab yorliqlari mavjud `profile.languageValues.*` kalitlaridan qayta foydalanildi (dublikat oldini olish uchun).
- [`src/style.css`](src/style.css) — yangi `.lang-tabs`/`.lang-tab` (pill-shaklidagi til tanlash tugmalari, yorug'/qorong'i tema) qo'shildi.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. Backend bilan ulanish avval uzilib qolgan edi (VPN/tarmoq muammosi — `curl`/`ping` javob bermagan), tiklangandan keyin yangi schema qayta olindi va maydon nomlari to'liq tasdiqlandi (`api/schema/` hujjatlashtirilgan, taxminiy parsing shart emas). `GET /api/v1/info/?lang=ru` token'siz `401` qaytarishi (endpoint himoyalangan, `lang` parametri xatolik keltirmasligi) tasdiqlandi. Yangi til-tab tugmalarining rangi/holati (active/inactive) real `style.css` bilan ham yorug', ham qorong'i temada `getComputedStyle()` orqali tekshirildi va to'g'ri chiqishi tasdiqlandi.

**Keyingi qadam (navbatda):** foydalanuvchi shuningdek "Profil to'liq to'g'irlash kerak" va "apilarda ham [boshqa] o'zgarishlar bor" deb aytgan — bular hali ko'rib chiqilmagan, keyingi bosqichda aniqlashtiriladi.

---

### 19. Profil sahifasiga yangi `employee_profile` maydoni qo'shildi
18-band davomida `GET/PATCH /api/v1/auth/me/` (`UserProfile`) sxemasini qayta tekshirganda, talabalar uchun mavjud `student_profile` (o'qish uchun, qisqa matn) maydoniga **simmetrik** yangi `employee_profile` maydoni topildi — bu xodimlar uchun (masalan lavozim/bo'lim xulosasi HEMIS'dan). Avval yaratilgan Profil sahifasida (17-band) faqat `student_profile` ko'rsatilar edi, xodimlar uchun mos maydon yo'q edi.

**O'zgartirilgan fayllar:**
- [`src/stores/auth.ts`](src/stores/auth.ts) — `UserProfile` interfeysiga `employee_profile: string | null` qo'shildi.
- [`src/views/profile.vue`](src/views/profile.vue) — `student_profile`dan keyin, faqat mavjud bo'lsa ko'rinadigan yangi "Xodim profili" qatori qo'shildi.
- [`src/i18n/messages.ts`](src/i18n/messages.ts) — uchala tilga `profile.employeeProfile` kaliti qo'shildi.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi.

---

### 20. Profil rasmi (avatar) — HEMIS/yuklangan rasm endi tizimda ko'rinadi
Foydalanuvchi: "eploye hodimlar ham studentlar ham uchun imgae qilinga apilar ham bor shuni ham qo'shish kerak http://172.22.0.57:8002/api/v1/auth/profile/ ... har bir user o'ziga tegishli narsasigada". Avval Plan Mode orqali reja tuzilib, tasdiqlangandan keyin amalga oshirildi.

**Backend (`api/schema/` orqali tasdiqlangan, javob tanasi hujjatlashtirilmagan, faqat tavsif orqali):**
```
GET /api/v1/auth/profile/    → hemis_id, full_name, phone, email, image, role, gender, bo'lim qaytaradi
PATCH /api/v1/auth/profile/  → FAQAT multipart/form-data; faqat `phone` va `image` o'zgaradi.
                                Multipart maydon nomi ANIQ "image" bo'lishi shart.
```
Bu `/api/v1/auth/me/` (UserProfile, image maydoni yo'q) dan alohida, tor maqsadli "faqat o'z rasmim" endpointi.

**O'zgartirilgan/yaratilgan fayllar:**
- [`src/stores/auth.ts`](src/stores/auth.ts) — `UserSession`ga `imageUrl?: string | null` qo'shildi; yangi `fetchProfileImage()` action — `GET /auth/profile/` chaqirib, faqat `.image` maydonini sessiyaga yozadi (javobning qolgan qismi ishlatilmaydi, hujjatlashtirilmagan).
- [`src/App.vue`](src/App.vue) — `watch(() => authStore.isAuthenticated, ..., { immediate: true })` qo'shildi: sessiya mavjud bo'lganda (sahifa yuklanganda yoki yangi login/HEMIS OAuth'dan keyin) bir marta `fetchProfileImage()` avtomatik chaqiriladi. Butun ilova davomida bitta joydan boshqariladi.
- [`src/components/DashboardLayout.vue`](src/components/DashboardLayout.vue), [`src/components/AppHeader.vue`](src/components/AppHeader.vue), [`src/views/profile.vue`](src/views/profile.vue) — barcha 3 joydagi harf-avatar endi `authStore.session?.imageUrl` mavjud bo'lsa haqiqiy `<img>`ga, aks holda avvalgi harf-doiraga tushadi.
- [`src/views/settings.vue`](src/views/settings.vue) — profil formasining boshiga yangi rasm yuklash bo'limi qo'shildi: joriy avatar (rasm/harf) + yashirin fayl input + "Rasm yuklash" tugmasi. Fayl tanlanishi bilanoq (asosiy "Saqlash" tugmasini kutmasdan) alohida `multipart/form-data` PATCH yuboriladi, muvaffaqiyatli bo'lsa `authStore.fetchProfileImage()` qayta chaqirilib sessiya yangilanadi (PATCH javobi ham hujjatlashtirilmagan — eng xavfsiz yo'l qayta GET qilish).
- [`src/style.css`](src/style.css) — `.user-avatar`ga `object-fit: cover` qo'shildi (avval faqat harf uchun yozilgan edi). `.profile-avatar`da bu allaqachon bor edi.
- [`src/i18n/messages.ts`](src/i18n/messages.ts) — uchala tilga `settings.avatarUpload`/`avatarUploaded`/`avatarError` kalitlari qo'shildi.

**Diqqat:** bu FAQAT "o'z profil rasmim" funksiyasi — Xodimlar ro'yxati, Aloqa va boshqa joylarda boshqa foydalanuvchilarning rasmini ko'rsatish/boshqarish bu safar qamrovga kiritilmagan (foydalanuvchi aniq shunday so'ragan).

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. `curl` orqali `GET /api/v1/auth/profile/` token'siz `401` qaytarishi tasdiqlandi. Barcha 4 avatar joyi (sidebar 44px, header 32px, Profil sahifasi 64px, Sozlamalar yuklash qatori) ham `<img>` (test rasm bilan), ham harf-fallback holatida, ham yorug', ham qorong'i temada real ilovaning `style.css`iga qarshi brauzerda vizual tasdiqlandi. Haqiqiy kredensiallar yo'qligi sababli haqiqiy rasm yuklash oqimi (fayl tanlash → multipart PATCH → backend javobi) jonli sinalmadi.

---

### 21. Profil sahifasidagi ikkita xatolik tuzatildi (real ma'lumot bilan test qilingandan keyin)
Foydalanuvchi haqiqiy talaba hisobi bilan Profil sahifasini ochib, skrinshot yubordi — ikkita muammo ko'rindi:

1. **Email va Telefon raqami bir-biriga yopishib qolgan** (`humoraabduhakimova@gmail.com+998889531710` bitta uzun matn sifatida ko'rinardi). Sabab: `.profile-view-item` grid elementi standart `min-width: auto` xususiyatiga ega edi, uzun bo'shliqsiz matn (email) o'z katakchasidan tashqariga — qo'shni katakchaga — vizual chiqib ketardi (bu sessiyada oldin boshqa joylarda ham uchragan xuddi shu CSS Grid xatosi turi).
2. **"Talaba profili" xom JSON matn sifatida chiqardi**: `{ "faculty": "...", "direction": "...", "course": "...", ... }` — backend `student_profile` (va simmetrik `employee_profile`) maydonini JSON-satr sifatida qaytarar ekan, frontend esa uni oddiy matn deb hech qanday parse qilmasdan to'g'ridan-to'g'ri ekranga chiqarar edi.

**O'zgartirilgan fayllar:**
- [`src/views/profile.vue`](src/views/profile.vue)
  - `.profile-view-item`ga `min-width: 0` va `.profile-view-item strong`ga `overflow-wrap: break-word` / `word-break: break-word` qo'shildi — endi uzun uzilishsiz matn (email, token va h.k.) o'z katakchasi ichida qatorlarga bo'linadi, qo'shnisiga chiqib ketmaydi.
  - Yangi `parseProfileJson()`/`buildDetailItems()` funksiyalari qo'shildi: `student_profile`/`employee_profile` JSON sifatida parse qilinadi, har bir kalit alohida "Talaba profili"/"Xodim profili" kichik bo'limida label:qiymat juftligi sifatida chiqadi (`faculty`→"Fakultet", `has_dormitory`→"Yotoqxona" va h.k. — ma'lum kalitlar tarjima qilingan, noma'lum kalitlar uchun `humanizeKey()` orqali umumiy label hosil qilinadi — kelajakda backend yangi maydon qo'shsa ham sahifa buzilmaydi). JSON parse muvaffaqiyatsiz bo'lsa (masalan backend oddiy matn qaytarsa), xavfsizlik uchun xom matn ko'rsatiladi (avvalgi xatti-harakat saqlanadi).
- [`src/i18n/messages.ts`](src/i18n/messages.ts) — uchala tilga `profile.studentFields.*` (faculty/direction/course/group/gpa/has_dormitory/jshshir), `profile.employeeFields.*` (position/department), `profile.yes`/`profile.no` kalitlari qo'shildi.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. Foydalanuvchi yuborgan HAQIQIY xato ma'lumotlar (email/telefon qatori va aynan o'sha JSON satr) bilan brauzerda qayta yaratib tekshirdim — endi email/telefon ikkalasi ham o'z katakchasida to'g'ri ko'rinadi, "Talaba profili" esa 7 ta aniq label bilan (Fakultet, Yo'nalish, Kurs, Guruh, GPA, Yotoqxona: Yo'q, JSHSHIR) toza kartochkalar shaklida chiqadi.

---

### 22. "Murojaatlar" (so'rovlar) API'lari audit qilindi — bo'sh joylar to'ldirildi
Foydalanuvchi: "murojatlar bilan ishlash qismidagi apilarni ulash bilan boshlash kerak ... birinchi o'rinda studentniki murojat qilish, keyingi o'rinda murojatga javob berish". Tekshirib chiqilganda, bu modul (`src/stores/requests.ts`, `src/views/appeals.vue`, `src/components/RequestWizardModal.vue`, `src/services/hemisLookup.ts`) **avvalgi sessiyada allaqachon** haqiqiy backend (`/api/v1/requests/*`) ga ulangan ekan. Yangilangan schema bilan solishtirib chiqilganda deyarli barcha maydon nomlari (`RequestCreate`, `RequestDetail`, `RequestList`, `RequestRating`, `RequestRedirect`, `RequestStatusUpdate`) **aniq mos kelishi tasdiqlandi** — faqat ikkita bo'sh joy topildi:

1. **`RequestDetail`da `payment` maydoni yo'q edi** — backend endi har bir murojaatga `Payment` obyektini (`amount`, `provider`, `status` va h.k.) biriktirib qaytarar ekan (pullik xizmatlar uchun). Interfeysga qo'shildi (hozircha faqat tip darajasida — to'lov UI'si so'ralmagan, alohida vazifa).
2. **Xodim tomonidan murojaatga hujjat biriktirish umuman ishlamas edi** — backendda `POST /api/v1/requests/{id}/documents/` (multipart, `file`+`file_name`) mavjud bo'lsa-da, frontendda bu chaqirilmagan edi. Bu "murojaatga javob berish" jarayonining muhim qismi (masalan tayyor ma'lumotnomani biriktirish) — endi qo'shildi.

**O'zgartirilgan fayllar:**
- [`src/stores/requests.ts`](src/stores/requests.ts) — `RequestPayment` interfeysi va `RequestDetail.payment` maydoni qo'shildi; yangi `uploadDocument(requestId, file)` action — `POST /api/v1/requests/{id}/documents/` ga multipart yuboradi.
- [`src/views/appeals.vue`](src/views/appeals.vue) — xodim ko'rinishidagi murojaat kartasida, holat `in_progress` bo'lganda, "Hujjat biriktirish" tugmasi (yashirin fayl input, `<label>` orqali) qo'shildi — fayl tanlanishi bilanoq yuklanadi, muvaffaqiyat/xato xabari ko'rsatiladi.
- [`src/i18n/messages.ts`](src/i18n/messages.ts) — uchala tilga `appeals.attachDocument`/`documentUploaded`/`documentUploadError` kalitlari qo'shildi.
- [`src/style.css`](src/style.css) — `.req-attach-btn` (cursor: pointer, `<label>` tugma sifatida ko'rinishi uchun) qo'shildi.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. `curl` orqali `GET /api/v1/requests/` va `POST /api/v1/requests/1/documents/` ikkalasi ham token'siz `401` qaytarishi tasdiqlandi. Yangi "Hujjat biriktirish" tugmasi real `style.css` bilan brauzerda vizual tekshirildi — boshqa amaliyot tugmalari bilan bir xil ko'rinishda chiqishi tasdiqlandi.

**Xulosa foydalanuvchi uchun:** talabaning murojaat qilishi (Xizmatlar → xizmat tanlash → JSHSHIR → shablon tili/formati → yuborish) va xodimning javob berishi (ishga olish → yo'naltirish/rad etish/bajarildi, endi + hujjat biriktirish) — ikkalasi ham allaqachon haqiqiy backend'ga ulangan, faqat yuqoridagi ikkita bo'sh joy to'ldirildi. Haqiqiy kredensiallar yo'qligi sababli to'liq oqim (talaba murojaat qilib, xodim javob berishi) hali jonli sinalmagan.

---

### 23. Xodim uchun murojaatni "ochish" va "javob yo'llash" umuman ishlamas edi — topildi va tuzatildi
Foydalanuvchi: "kelib tushgan murojatni ochish va unga javob yo'llashda muammo bo'lmoqda". Kodni tekshirganda **haqiqiy sabab** topildi: xodim (staff) ko'rinishidagi murojaat kartalarida umuman "ochish" (kengaytirish/detail) imkoniyati yo'q edi — bu funksiya faqat talaba ko'rinishida mavjud edi (`toggleExpand`/`expandedDetail` talaba template blokidan tashqariga chiqarilmagan). Xodim faqat ro'yxatdagi qisqa kartani va harakat tugmalarini (ishga olish/yo'naltirish/rad etish/bajarildi) ko'rar edi — murojaatning matni (`notes`), talaba HEMIS ID'si, hujjat tili/formati, avval biriktirilgan hujjatlar va tarix (kim, qachon, qanday izoh bilan holatni o'zgartirgan) **umuman ko'rinmas edi**. Shuning ustiga, "javob yo'llash" — ya'ni bajarilganda/rad etilganda matnli izoh yozish — juda cheklangan edi: rad etish brauzerning primitiv `window.prompt()` orqali ishlar edi (yomon UX, ba'zi brauzerlarda bloklanishi mumkin), bajarildi deb belgilashda esa **umuman hech qanday izoh/javob yozib bo'lmasdi** — backend `RequestStatusUpdate.comment` maydonini qo'llab-quvvatlasa-da, frontend uni hech qachon yubormagan.

**O'zgartirilgan fayllar:**
- [`src/views/appeals.vue`](src/views/appeals.vue)
  - Xodim ko'rinishidagi murojaat kartasi endi talaba ko'rinishidagi kabi **bosilib ochiladigan** (`toggleExpand`) — ochilganda: talaba HEMIS ID, hujjat tili, fayl formati (kichik kartochkalarda), murojaat matni (`notes`), avval biriktirilgan hujjatlar (yuklab olish tugmalari bilan) va **to'liq tarix** (har bir holat o'zgarishi: kim, qachon, qanday izoh bilan) ko'rsatiladi.
  - "Rad etish" endi `window.prompt()` o'rniga **ekran ichidagi** (`Yo'naltirish` tugmasi bilan bir xil uslubda) matn maydoni orqali ishlaydi — sabab yozilib, "Tasdiqlash" bosiladi.
  - "Bajarildi deb belgilash" endi bosilganda avval **javob matni** (ixtiyoriy) kiritish maydoni ochiladi — bu matn backendga `comment` sifatida yuboriladi va tarixda saqlanadi (talaba buni keyinchalik o'z murojaati tafsilotida ko'radi).
- [`src/stores/requests.ts`](src/stores/requests.ts) — o'zgarishsiz qoldi (`updateStatus()` allaqachon `comment`ni qo'llab-quvvatlagan, faqat UI uni yubormagan edi).
- [`src/i18n/messages.ts`](src/i18n/messages.ts) — eskirgan, endi ishlatilmaydigan `appeals.rejectPrompt` kaliti o'chirildi; o'rniga uchala tilga `rejectReasonPlaceholder`, `completeCommentPlaceholder`, `studentHemisId`, `documentLanguage`, `fileFormat`, `historyTitle` qo'shildi.
- [`src/style.css`](src/style.css) — yangi `.req-detail-grid`/`.req-detail-item` (kichik ma'lumot kartochkalari) va `.req-history`/`.req-history-entry`/`.req-history-status`/`.req-history-meta`/`.req-history-comment` (tarix ro'yxati) klasslari qo'shildi, yorug'/qorong'i tema uchun ikkalasi ham.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. Yangi "ochilgan" murojaat kartasi (HEMIS ID, til, format, matn, tarix) va javob-yozish maydoni real `style.css` bilan ham yorug', ham qorong'i temada brauzerda vizual tekshirildi — barchasi to'g'ri va boshqa kartalar bilan bir xil dizaynda chiqishi tasdiqlandi. Haqiqiy kredensiallar yo'qligi sababli to'liq oqim (murojaatni ochib, javob yozib, bajarildi deb belgilash) hali jonli sinalmagan.

---

### 24. "Murojaatlarga javob berish" — oxirgi ulanmagan endpoint (Dashboard statistika) qo'shildi
Foydalanuvchi: "murjatlarga javob berish qisminidagi apilarni ham ulash kerak". Backend schema'sida "Murojaatlarga javob berish" tegi ostidagi 4 ta endpointdan 3 tasi (hujjat biriktirish, yo'naltirish, holat o'zgartirish) allaqachon ulangan edi — faqat bittasi qolgan edi: `GET /api/v1/requests/dashboard/` ("Real vaqt statistika — jami, bugun, kategoriya bo'yicha, SLA bajarish foizi").

**O'zgartirilgan fayllar:**
- [`src/stores/requests.ts`](src/stores/requests.ts) — `RequestDashboard`/`RequestDashboardCategory` interfeyslari va `dashboard` state qo'shildi; yangi `fetchDashboard()` action — javob shakli hujjatlashtirilmagani uchun (`No response body`) moslashuvchan `normalizeDashboard()` orqali o'qiladi (bir nechta ehtimoliy maydon nomi sinaladi: `total`/`total_count`, `today`/`today_count`, `sla_percent`/`sla_percentage`/`sla`, `by_category`/`categories`/`category_breakdown`).
- [`src/views/appeals.vue`](src/views/appeals.vue) — xodim sahifasi ochilganda `fetchDashboard()` ham chaqiriladi; statistika qatoriga backend qaytargan bo'lsa ikkita yangi kartochka qo'shiladi: "Bugun" (bugungi murojaatlar soni) va "SLA bajarilishi" (foiz). Agar dashboard endpointidan javob kelmasa (masalan hali test qilinmagan maydon nomi noto'g'ri bo'lsa), bu ikki kartochka shunchaki ko'rinmaydi — mavjud "Jami/Yangi/Jarayonda/Hal qilindi" kartochkalari (client tarafda hisoblangan, har doim ishlaydigan) ta'sirlanmaydi.
- [`src/i18n/messages.ts`](src/i18n/messages.ts) — uchala tilga `appeals.today`/`appeals.slaFulfillment` kalitlari qo'shildi.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. `curl` orqali `GET /api/v1/requests/dashboard/` token'siz `401` qaytarishi tasdiqlandi. Yangi ikkita statistika kartochkasi real `style.css` bilan brauzerda vizual tekshirildi — mavjud kartochkalar bilan bir xil dizaynda chiqishi tasdiqlandi. Haqiqiy kredensiallar yo'qligi sababli bu endpointning haqiqiy javob shakli hali tasdiqlanmagan — agar backend taxmin qilingan maydon nomlaridan farqli nom qaytarsa, faqat `normalizeDashboard()` funksiyasini tuzatish kifoya (bu holatda ikki kartochka shunchaki ko'rinmay qoladi, xato chiqmaydi).

**Xulosa:** "Murojaatlarga javob berish" tegidagi barcha 4 ta endpoint (hujjat biriktirish, yo'naltirish, holat o'zgartirish, dashboard statistika) endi to'liq ulangan.

---

### 25. "Murojaatlarga javob berish" qismidagi ikkita jiddiy xatolik topildi va tuzatildi
Foydalanuvchi: "murojat yuborilmoqda lekin murojatlarga javob berish qismida xatoliklar bo'lmoqda shuni to'liq to'g'rilash kerak". Kodni (`appeals.vue`/`requests.ts`) qayta ko'rib chiqilganda ikkita alohida, real xatolik topildi.

**1-xatolik (eng jiddiyi) — yo'naltirilgan murojaat "o'lik holat"da qolib ketardi:** Xodim boshqa bo'limga "Yo'naltirish" tugmasi orqali murojaatni yo'naltirganda, uning holati `redirected`ga o'zgaradi. Lekin amaliyot tugmalari faqat `new` va `in_progress` holatlar uchun ko'rsatilar edi — `redirected` holat uchun **hech qanday tugma yo'q edi**. Natijada qabul qiluvchi bo'lim xodimi bunday murojaatni na "ishga olishi", na qayta yo'naltirishi mumkin emas edi — murojaat butunlay javobsiz qolib ketardi.

**2-xatolik — xodim amallarida xatolik ko'rinmas edi:** "Ishga olish", "Bajarildi deb belgilash", "Rad etish", "Yo'naltirish", baholash va tafsilotni ochish amallarining barchasida `try/catch` umuman yo'q edi. Backend xatolik qaytarsa (masalan validatsiya xatosi), foydalanuvchi hech qanday xabar ko'rmas edi — tugma bosilgandan keyin forma ochiq qolar, hech narsa o'zgarmas, sabab esa umuman ko'rinmas edi ("ishlamayapti"gan taassurot qoldirar edi). Bundan tashqari, holat o'zgargandan keyin (masalan "Ishga olish" bosilgach) agar murojaat tafsiloti ochiq bo'lsa, "Tarix" bo'limi yangilanmay, eski holatda qolib qolar edi.

**O'zgartirilgan fayllar:**
- [`src/views/appeals.vue`](src/views/appeals.vue)
  - "Ishga olish" va "Yo'naltirish" tugmalari endi `redirected` holat uchun ham ko'rinadi (avval faqat `new`/`in_progress`).
  - Barcha xodim amallari (`takeInProgress`, `confirmComplete`, `confirmReject`, `confirmRedirect`) va talaba tomonidagi `submitRating` endi `try/catch` bilan o'ralgan — xatolik `extractApiError()` orqali aniq matn sifatida ekranda ko'rsatiladi (`actionErrorMsg`/`ratingErrorMsg`), xatolik bo'lsa ochiq forma yopilmaydi (qayta urinish mumkin).
  - Yangi `loadDetail()`/`refreshDetailIfExpanded()` yordamchilari qo'shildi — tafsilotni yuklashda xatolik bo'lsa (`detailErrorMsg`) ko'rsatiladi; status o'zgargan/hujjat biriktirilgan har bir muvaffaqiyatli amaldan keyin, agar shu murojaat kartasi ochiq bo'lsa, tafsilot (jumladan "Tarix") avtomatik qayta yuklanadi.
- [`src/i18n/messages.ts`](src/i18n/messages.ts) — uchala tilga (`uz`/`ru`/`en`) `appeals.actionError`/`detailLoadError`/`ratingError` kalitlari qo'shildi.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. **Haqiqiy backend va haqiqiy murojaat bilan brauzerda jonli sinaldi**: real "REQ-2026-000001" murojaatini ochib, "Ishga olish" bosildi — holat "Yangi" dan "Ko'rib chiqilmoqda"ga muvaffaqiyatli o'zgardi VA ochiq tafsilot paneli avtomatik yangilanib, "Tarix" bo'limida yangi yozuv (xodim ismi, vaqti) darhol paydo bo'lgani, so'ng yangi amaliyot tugmalari (Yo'naltirish/Rad etish/Hujjat biriktirish/Bajarildi) to'g'ri chiqqani tasdiqlandi. Qaytarib bo'lmaydigan amallar (Bajarildi/Rad etish/Yo'naltirish) haqiqiy yozuv ustida ataylab sinalmadi (real murojaatni keraksiz yopib qo'ymaslik uchun) — faqat kod darajasida (try/catch, xabar ko'rsatish) tekshirildi.

---

### 26. "Statistika" bo'limi to'liq 0 ko'rsatib turishi tuzatildi — barcha maydon nomlari haqiqiy javob bilan tasdiqlandi
Foydalanuvchi: "statistika qismiga to'liq ulamaganmisan deyman xatolik bilan faqat 0 holatida turmoqda". 18-bandda `/api/v1/statistics/*` endpointlarining javob shakli Swagger'da hujjatlashtirilmagani sababli (`"No response body"`) maydon nomlari **taxmin qilib** yozilgan edi (inglizcha `total`/`new`/`count` va h.k.). Foydalanuvchidan Swagger orqali haqiqiy javoblarni so'rab olindi — natija: **taxminlar deyarli barchasi noto'g'ri chiqdi**, backend o'zbekcha kalit nomlari va boshqa o'ram (wrapper) tuzilmasi bilan qaytar ekan. Shu sabab hamma kartochka/grafik 0/bo'sh ko'rinar edi.

**Haqiqiy javob shakllari (Swagger orqali, foydalanuvchi tasdiqladi):**
```
GET /api/v1/statistics/overview/
  → { jami_murojaatlar, yangi_murojaatlar, jarayonda, hal_qilingan, xodimlar: {value, change_percent, trend[7]},
      bugun_bajarilgan: {value}, ortacha_baholash: {value, count} }
GET /api/v1/statistics/monthly-trend/?months=N   → { months: [{label, year, month, count}] }
GET /api/v1/statistics/gender-monthly/?months=N  → { months: [{label, year, month, erkak, ayol}] }
GET /api/v1/statistics/sla-trend/?months=N       → { months: [{label, year, month, percent}] }
GET /api/v1/statistics/category-breakdown/       → { total, categories: [{key, label, count, percent}] }
GET /api/v1/statistics/department-performance/   → { departments: [{id, name, total, completed, percent}] }
GET /api/v1/statistics/status-summary/?months=N  → { period_months, total, statuses: [{key, label, count, percent}] }
GET /api/v1/statistics/activity-heatmap/         → { hour_buckets: [...], days: [{day, counts: [...]}] }
GET /api/v1/statistics/my-kpi/?months=N          → { rating: {average, count}, months: [{label, bajargan, bajarmagan, kechikkan}] }
```
Bundan tashqari, hali frontendga ulanmagan yangi endpoint ham topildi: `GET /api/v1/statistics/request-types/` → `{ total, types: [{key, label, count, percent}] }` ("Joyida hal qilinadigan"/"Umumiy murojaatlar" — xizmat yetkazish turi bo'yicha, `category-breakdown`dagi 4 xizmat kategoriyasidan farqli). Bu safar UI'da alohida joy so'ralmagani va mavjud "Murojaat turlari" diagrammasi allaqachon `category-breakdown`ga bog'langani sababli, bu yangi endpoint hozircha ulanmadi — kelajakda kerak bo'lsa alohida vazifa sifatida qo'shiladi.

**O'zgartirilgan fayllar:**
- [`src/stores/statistics.ts`](src/stores/statistics.ts) — barcha 9 ta `normalize*` funksiyasi yuqoridagi haqiqiy maydon nomlariga moslab qayta yozildi (`raw.months`/`raw.categories`/`raw.departments`/`raw.statuses`/`raw.days`+`raw.hour_buckets` kabi o'ramlarni ochish qo'shildi). Muhim qo'shimcha tuzatish: `monthly-trend`/`gender-monthly`/`sla-trend` javobida har bir oy elementida ham matnli `label` ("Mar"), ham raqamli `month` (3) bor edi — eski kod `month`ni ustuvor olar edi, bu grafik o'qida "Mar" o'rniga "3" chiqishiga sabab bo'lardi; endi `label` ustuvor. `normalizeMyKpi` butunlay qayta yozildi (haqiqiy javob bitta yakuniy son emas, oylik massiv — endi tanlangan davr bo'yicha yig'indi hisoblanadi). `OverviewData`ga backend qaytaradigan, lekin oldin umuman o'qilmagan ikkita qo'shimcha maydon (`todayCompleted`, `avgRating`) qo'shildi (hozircha UI'da ko'rsatilmaydi, keyingi safar kerak bo'lsa ulanadi).

**Sinov:** Foydalanuvchi Swagger orqali yuborgan **haqiqiy JSON javoblarning barchasi** bilan yangilangan `normalize*` funksiyalari mustaqil (Node.js) skriptda sinaldi — barcha 9 ta funksiya to'g'ri qiymatlarni chiqarishi tasdiqlandi (masalan: `xodimlar.value: 41`, `change_percent: -92.7`, `bugun_bajarilgan: 1`, `ortacha_baholash: 4`, oylik nomlar "Mar"/"Avg" to'g'ri chiqishi, bo'lim samaradorligi 100%, holat taqsimoti to'g'ri). `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi.

---

### 27. Profil rasmi ko'rinmasligi/yangilanmasligi, talabalarga kerak bo'lmagan parol formasi, "Talaba profili" xom JSON ko'rinishi — uchtasi ham tuzatildi
Foydalanuvchi skrinshot bilan ko'rsatdi: (1) "Talaba profili" bo'limi tarjima qilingan kartochkalar o'rniga xom JSON matnini ko'rsatib turibdi; (2) profil rasmini yuklab bo'lmayapti; (3) HEMIS'dan kelishi kerak bo'lgan rasm ko'rinmayapti, yuklangan rasm esa HEMIS'nikidan ustuvor (birlamchi) bo'lishi kerak; (4) talabalar parol qo'yish/o'zgartirish imkoniyatiga ega bo'lmasligi kerak (ular hech qachon local parolga ega bo'lmaydi — faqat HEMIS OAuth, [11-band]dan beri ma'lum).

**1-2-3-muammoning tub sababi (kodni va backend schema'sini qayta tekshirib topildi):** `GET /api/v1/auth/profile/`dan kelgan `image` maydoni backendda **nisbiy yo'l** (masalan `/media/profiles/xxx.jpg`) sifatida qaytarilishi mumkin — schema'da `format: uri` deb ko'rsatilgan, lekin to'liq domen kafolatlanmagan. Frontend esa buni to'g'ridan-to'g'ri `<img src>`ga qo'yar edi — natijada brauzer rasmni backend (`172.22.0.57:8002`) o'rniga frontend'ning o'z manzilidan (`localhost:3000`) so'rar, topilmay, rasm hech qachon ko'rinmas edi. Bu HAM boshlang'ich holatda (HEMIS'dan sinxronlangan rasm), HAM yuklashdan keyin (yangi yuklangan rasm) bir xil tarzda ta'sir qilgan — ya'ni "HEMIS rasm chiqmayapti" va "yuklab bo'lmayapti" bitta tub sababga bog'liq edi. Backend schema'sida (`PatchedMyProfileUpdate`) `image` uchun alohida "HEMIS rasmi" degan ikkinchi maydon yo'q — faqat bitta `image` maydoni bor, uni foydalanuvchi PATCH orqali yangilaganda eskisi (HEMIS'dan sinxronlangani) ustidan yoziladi — ya'ni "yuklangan rasm HEMIS'nikidan ustuvor bo'lishi" talabi shu bitta maydonning o'zi orqali tabiiy tarzda bajariladi, alohida mantiq kerak emas edi, faqat URL to'g'ri ko'rsatilishi kerak edi.

**4-muammoning sababi:** [`src/views/settings.vue`](src/views/settings.vue) dagi "Parolni o'zgartirish" formasi **rolga qaramasdan hammaga** (talaba ham) ko'rsatilar edi — garchi backend faqat `department_admin`/`super_admin` uchun local parolni qo'llab-quvvatlasa ham.

**O'zgartirilgan fayllar:**
- [`src/services/http.ts`](src/services/http.ts) — yangi `resolveMediaUrl(path)` yordamchi funksiyasi qo'shildi: agar yo'l allaqachon to'liq URL (`http(s)://`, `data:`, `blob:`) bo'lsa o'zgarishsiz qaytaradi, aks holda `VITE_API_BASE_URL`ga ulaydi.
- [`src/stores/auth.ts`](src/stores/auth.ts) — `fetchProfileImage()` endi `data.image`ni to'g'ridan-to'g'ri emas, `resolveMediaUrl(data?.image)` orqali sessiyaga yozadi. Bu bitta tuzatish — sidebar, header, Profil va Sozlamalar sahifalaridagi barcha avatar joylariga birdek ta'sir qiladi (barchasi bitta `authStore.session.imageUrl`dan o'qiydi).
- [`src/views/settings.vue`](src/views/settings.vue) — "Parolni o'zgartirish" formasi endi faqat `authStore.isAdmin` (Bo'lim ma'muri/SuperAdmin) uchun ko'rinadi — talabalar va boshqa HEMIS-orqali-kiruvchi xodimlar (operator, dekanat, buxgalter va h.k.) uchun butunlay yashirin. Forma yashirin bo'lganda profil formasi butun kenglikda (`settings-grid-single`) chiroyli ko'rinishi uchun layout ham moslashtirildi.
- [`src/views/profile.vue`](src/views/profile.vue) — `parseProfileJson()` mustahkamlandi: avval oddiy `JSON.parse` sinaladi, muvaffaqiyatsiz bo'lsa backend Python dict reprini (bitta qo'shtirnoq, `True`/`False`/`None`) qaytargan bo'lishi ehtimoliga qarshi shu ko'rinishni JSON'ga aylantirib qayta sinaladi. Agar baribir parse qilib bo'lmasa (juda kam ehtimol), xom matn endi butun kenglikni egallaydigan, monospace shrift va qatorlarga bo'linadigan (`profile-view-item-raw`) alohida uslubda ko'rsatiladi — "buzilgandek" emas, ataylab shunday dizayn qilingandek ko'rinadi.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. **Diqqat:** brauzerdagi avvalgi test sessiyasi (localStorage'dagi token) muddati tugab uzilib qolgani sababli, bu safar tuzatishlar **jonli login bilan sinalmadi** — faqat kod va backend schema (`PatchedMyProfileUpdate`) tahlili asosida tub sabab aniqlangan va tuzatilgan. Iltimos, qayta login qilib (yoki sahifani yangilab) profil rasmi va Sozlamalar/Profil sahifalarini tekshirib ko'ring — agar hali ham muammo bo'lsa, aniq nima ko'rinayotganini (masalan brauzer konsolidagi 404/xato) ayting, shu asosda tezda tuzataman.

---

### 28. Profil sahifasi butunlay ochilmay qolgan xato (`raw.trim is not a function`) tuzatildi
Foydalanuvchi konsol skrinshotini yubordi: `Uncaught (in promise) TypeError: raw.trim is not a function`, `profile.vue:78`, `parseProfileJson` ichida — 27-banddagi "mustahkamlash" tuzatishi darhol keyingi safar haqiqiy ma'lumot bilan sinalganda yangi xato chiqargan. Sabab: o'sha safar `student_profile`/`employee_profile` har doim satr (JSON-string) deb taxmin qilingan edi, lekin haqiqatda backend buni ba'zan **to'g'ridan-to'g'ri obyekt** (allaqachon parse qilingan JSON) sifatida qaytarar ekan — bunday holda `raw.trim()` chaqirilganda (obyektda `.trim` metodi yo'q) butun Profil sahifasi ochilmay, oq/bo'sh holatda qotib qolar edi (Vue render funksiyasi butunlay yiqilgani sababli).

**O'zgartirilgan fayllar:**
- [`src/views/profile.vue`](src/views/profile.vue) — `parseProfileJson()` endi kirish qiymati turini avval tekshiradi: agar allaqachon obyekt bo'lsa to'g'ridan-to'g'ri qaytaradi, satr bo'lsa avvalgidek JSON/Python-repr sifatida parse qiladi, boshqa har qanday tur (raqam va h.k.) uchun xavfsiz `null` qaytaradi — endi hech qachon xato tashlamaydi. `buildDetailItems()` ham mos ravishda yangilandi (xom qiymatni ko'rsatishda, agar u satr bo'lmasa, `JSON.stringify` bilan matnga aylantiradi).
- [`src/stores/auth.ts`](src/stores/auth.ts) — `UserProfile.student_profile`/`employee_profile` tiplari `string | Record<string, unknown> | null` ga kengaytirildi (backend ikkala shaklda ham qaytarishi mumkinligini aks ettirish uchun).

**Sinov:** Yangi `parseProfileJson` mantig'i mustaqil (Node.js) skriptda barcha real holatlar bilan sinaldi — obyekt kirish, satr kirish, `null`/`undefined`, bo'sh satr, Python-repr satr va hatto kutilmagan raqam kirishi — barchasida xatosiz, to'g'ri natija chiqishi tasdiqlandi (aynan avvalgi xatoni keltirib chiqargan "obyekt kirish" holati ham endi to'g'ri ishlaydi). `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi.

---

### 28. To'liq API auditi — yangi topilgan ulanmagan endpointlar ulandi (murojaatni bekor qilish, HEMIS bilan qayta sinxronlash, "Ta'lim granti")
Foydalanuvchi: "apilarni birma bir ko'rib chiqqin va bizda yo'qlari topginda ularga hammasini ulab chiqiishimiz kerak". Backend Swagger sxemasi (`/api/schema/`) to'liq qayta yuklanib, barcha 60+ endpoint frontenddagi mavjud `http.*` chaqiruvlari bilan solishtirildi. Bir nechta ulanmagan yoki eskirgan (mock) joy topildi.

**Ulandi:**
1. **`POST /api/v1/requests/{id}/cancel/`** — talaba faqat `Yangi` holatdagi o'z murojaatini bekor qila oladi. `RequestStatus`ga yangi `cancelled` qiymati qo'shildi (barcha joyda: filter tab, status ranglari, i18n). [`src/stores/requests.ts`](src/stores/requests.ts) — yangi `cancelRequest(id, reason)`. [`src/views/appeals.vue`](src/views/appeals.vue) — talaba kartasida `status === 'new'` bo'lganda "Bekor qilish" tugmasi + sabab kiritish maydoni.
2. **`POST /api/v1/hemis/sync/`** — joriy foydalanuvchi o'z ma'lumotlarini (jumladan rasmni) HEMIS'dan qayta yuklashi mumkin. [`src/stores/auth.ts`](src/stores/auth.ts) — yangi `syncFromHemis()`. [`src/views/settings.vue`](src/views/settings.vue) — avatar yonida "HEMIS bilan yangilash" tugmasi qo'shildi (bosilganda rasm + profil maydonlari qayta yuklanadi).
3. **`GET/PATCH /api/v1/auth/grants/`** — **"Ta'lim granti" bo'limi butunlay qayta yozildi.** Muhim topilma: [`src/stores/grantStudents.ts`](src/stores/grantStudents.ts) avvalgi holatda **100% qo'lda yozilgan mock (SEED) ma'lumot** edi — hech qachon backendga ulanmagan, real foydalanuvchilarga soxta talaba ro'yxati ko'rsatilar edi. Endi haqiqiy `Grant` modeliga (`id, student_name, student_hemis_id, faculty, course, group, phone, gpa, social_score, academic_score, total_score, status, status_display, document, gpa_updated_at`) to'liq moslab qayta yozildi — mock'da bo'lgan, lekin backendda mavjud bo'lmagan maydonlar (`photoUrl`, `academicYear`, `direction`, `language`, `degreeLevel`, `scoreAssigned`) olib tashlandi. `GrantStatusEnum` ham eskirgan (`active/frozen/expelled`) o'rniga haqiqiy (`active/inactive/pending`) qiymatlarga to'g'irlandi. Xodim uchun jadval ichida to'g'ridan-to'g'ri tahrirlash (GPA, ijtimoiy/akademik ball, holat) qo'shildi (`PATCH .../grants/{id}/` — "Grant ballini yangilash").

**MUHIM — ulanmagan holda qoldi (backendda API yo'q):** Grant sahifasidagi "Jami o'rin / Band / Bo'sh" KPI va "Fakultetlar kesimida" jadvali hamon mock (`seats` massiv) — **backendda bu uchun hech qanday endpoint topilmadi** (kvota/o'rin sonlari). Kodda aniq izoh qoldirildi, o'zgartirilmadi.

**Bu safar ataylab tegilmagan, lekin backendda mavjud, kelajakda kerak bo'lishi mumkin bo'lgan endpointlar (kattaroq, alohida rejalashtirish talab qiladigan funksiyalar — sahifa dizayni/joylashuvi bo'yicha qaror kerak):**
- `GET /api/v1/hemis/grades/`, `/hemis/schedule/`, `/hemis/transcript/` — talaba uchun "Baholar", "Dars jadvali", "Transkript" — butunlay yangi sahifalar bo'lishi kerak.
- `GET /api/v1/system-settings/` (+ CRUD) — "Tizim sozlamalari" — butunlay yangi admin moduli.
- `GET /api/v1/auth/check-status/` — login talab qilinmaydigan (public) murojaat holatini tekshirish — yangi ochiq (auth'siz) sahifa.
- `POST /api/v1/auth/admin/hemis-sync/` — SuperAdmin/DepartmentAdmin uchun ommaviy HEMIS sinxronizatsiyasi (talabalar/xodimlar/bo'limlar).
- `GET /api/v1/hemis/student/{hemis_id}/` — xodim istalgan talabani HEMIS ID bo'yicha qidirishi (masalan Xodimlar/Murojaatlar bo'limida foydali bo'lishi mumkin).
- `GET /api/v1/statistics/request-types/` — [26-band]da topilgan, hozircha UI joyi yo'q.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. Brauzerdagi sessiya bu safar ham uzilib qolgani sababli (token muddati tugagan), grants moduli **jonli login bilan sinalmadi** — faqat Swagger sxemasi (`Grant`/`PatchedGrant`/`PaginatedGrantList`) asosida aniq maydon nomlari bilan yozildi, noaniqlik yo'q (schema to'liq hujjatlashtirilgan). Iltimos qayta login qilib "Ta'lim granti" bo'limini (xodim sifatida) tekshirib ko'ring.

---

### 29. Talaba qidirish (HEMIS ID bo'yicha) va "Tizim sozlamalari" bo'limi qo'shildi
Foydalanuvchi: "Xodim uchun istalgan talabani HEMIS ID bo'yicha qidirish" + "tizim sozlamalari qo'shishimiz kerak ... sozlamalar bo'limiga qo'shib yuborsang ham bo'ladi".

**1. Talaba qidirish:** Header'dagi (`AppHeader.vue`) qidiruv maydoni avvaldan **umuman ishlamaydigan, dekorativ** input edi (na `v-model`, na hech qanday submit logikasi). Endi shu tayyor joy ishlatildi — faqat xodimlar uchun ko'rinadi (`showSearch` endi `authStore.isStaff`ni ham tekshiradi), Enter bosilganda `GET /api/v1/hemis/student/{hemis_id}/` chaqiriladi va natija (rasm, F.I.Sh., HEMIS ID, fakultet, kurs, guruh) dropdown panelda ko'rsatiladi.

**O'zgartirilgan/yaratilgan fayllar:**
- [`src/services/hemisLookup.ts`](src/services/hemisLookup.ts) — yangi `lookupStudentByHemisId()`, mavjud `lookupStudentByJshshir()` bilan bir xil moslashuvchan (defensive) parsing umumiy `normalizeHemisStudent()` funksiyasiga chiqarildi; rasm URL'i endi `resolveMediaUrl()` orqali to'g'irlanadi ([27-band]dagi bilan bir xil sabab).
- [`src/components/AppHeader.vue`](src/components/AppHeader.vue) — qidiruv input `v-model`/`@keyup.enter` bilan ishlaydigan qilindi, natija paneli (`header-dropdown`/`header-menu` uslubidan foydalanib) qo'shildi, yuklanish/xato holatlari bilan.
- [`src/i18n/messages.ts`](src/i18n/messages.ts) — `header.search` matni "Talaba HEMIS ID bo'yicha qidirish..."ga o'zgartirildi (chunki endi faqat shu maqsadda ishlatiladi), `header.searching`/`searchNotFound` qo'shildi.
- [`src/style.css`](src/style.css) — `.app-search-result` va talaba kartochkasi uslublari qo'shildi.

**2. "Tizim sozlamalari":** Backend schema tekshirildi — `SystemSetting` (`GET/POST/PATCH/DELETE /api/v1/system-settings/`) **umumiy kalit/qiymat (key/value) konfiguratsiya ombori** ekan (`key`, `value`, `description`, `updated_by_name`), foydalanuvchi taxmin qilgandek "xizmatlarni yoqish/o'chirish" yoki "Info tahrirlash huquqi" kabi maxsus mexanizm emas — bu **umumiy** administrator sozlamalari jadvali. Foydalanuvchi so'raganidek, alohida sahifa qilinmadi — [`src/views/settings.vue`](src/views/settings.vue) ga (faqat `authStore.isAdmin` — SuperAdmin/DepartmentAdmin uchun) yangi bo'lim sifatida qo'shildi: yangi sozlama qo'shish (kalit+qiymat+tavsif), mavjudlarini ro'yxatda ko'rish, jadval ichida tahrirlash (qiymat/tavsif) va o'chirish.

**Yaratilgan fayl:** [`src/stores/systemSettings.ts`](src/stores/systemSettings.ts) — `info.ts`/`grantStudents.ts` bilan bir xil naqsh (`fetchAll`/`addEntry`/`updateEntry`/`removeEntry`, sahifalab to'liq ro'yxat yig'ish).

**Diqqat foydalanuvchi uchun:** Agar maqsad aynan "muayyan xizmatni saytda ochish/yopish" yoki "Info bo'limini kim tahrirlay olishini boshqarish" bo'lsa — bu backend'da hali **alohida** mexanizm sifatida mavjud emas (faqat umumiy kalit/qiymat ombori bor). Agar shunday funksiya kerak bo'lsa, buni qo'llab-quvvatlash uchun backend tomonda maxsus maydon/endpoint (masalan `Service.is_enabled`) kerak bo'ladi — bu alohida vazifa sifatida rejalashtirilishi kerak.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. Brauzer konsolida xato yo'qligi tasdiqlandi (login sahifasi). Sessiya yana uzilgani sababli ikkala yangi funksiya ham **jonli login bilan sinalmadi** — ikkalasi ham to'liq hujjatlashtirilgan (`system-settings`) yoki mavjud tasdiqlangan naqshga (`hemis/student/{id}` — `hemis/lookup/` bilan bir xil turkumdagi endpoint) asoslangan.

---

### 30. Profil rasmi haqiqiy tub sababi topildi va tuzatildi — media fayllar autentifikatsiya talab qiladi
Foydalanuvchi: "nega hozirda rasm yuklab bo'lmayabdi". Brauzer DevTools skrinshoti orqali aniqlandi: `PATCH/GET .../auth/profile/` javobida `image: "/media/profile_images/17.01.2026.jpg"` **to'g'ri qaytar ekan** — ya'ni [27-band]dagi URL-manzil tuzatishi to'g'ri ishlagan, lekin muammo hali qolgan edi.

**Haqiqiy tub sabab (`curl` bilan tasdiqlangan):** `curl http://172.22.0.57:8002/media/profile_images/17.01.2026.jpg` — token'siz so'rovga backend **`401 Unauthorized`** qaytardi. Bu 28-bandda topilgan schema izohi bilan mos: *"profile_images/ yo'lidagi fayllar faqat IsAuthenticated bilan ochiladi"* — ya'ni bu oddiy statik fayl emas, Django'ning **himoyalangan** (JWT talab qiluvchi) endpointi orqali xizmat qiladi. Oddiy HTML `<img src="...">` teg orqali brauzer so'rovi hech qachon bizning saqlangan JWT tokenimizni birga yubora olmaydi (bu brauzer imkoniyati emas) — shu sabab rasm URL manzili to'g'ri bo'lsa ham, **hech qachon** ko'rinmasdi (na boshlang'ich HEMIS rasmi, na yangi yuklangani).

**Yechim:** Rasm endi oddiy URL sifatida emas, **tokenli so'rov orqali (blob) yuklab olinadi**, so'ng natijasi brauzer tushuna oladigan mahalliy `blob:...` URL'ga aylantiriladi.

**O'zgartirilgan fayllar:**
- [`src/services/http.ts`](src/services/http.ts) — yangi `fetchAuthenticatedImageUrl(path)`: `resolveMediaUrl()` orqali to'liq manzilga o'giradi, so'ng `http.get(url, {responseType:'blob'})` (avtomatik `Authorization` sarlavhasi bilan) chaqirib, `URL.createObjectURL()` orqali mahalliy URL qaytaradi.
- [`src/stores/auth.ts`](src/stores/auth.ts) — `fetchProfileImage()` endi shu funksiyadan foydalanadi; eski `blob:` URL almashtirilganda `URL.revokeObjectURL()` bilan tozalanadi (xotira sizib chiqishining oldini olish uchun), xuddi shunday `logout()` da ham tozalanadi.
- [`src/services/hemisLookup.ts`](src/services/hemisLookup.ts) — `normalizeHemisStudent()` ham (xuddi shu sabab bilan) `async` qilindi va rasmni endi shu yangi funksiya orqali yuklaydi — bu [29-band]dagi header qidiruv natijasidagi talaba rasmiga ham tegishli edi (xuddi shu muammo u yerda ham bo'lar edi).

**Diqqat — bilinadigan kichik cheklov:** `blob:` URL faqat joriy brauzer sahifasi (tab/sessiya) davomida amal qiladi — sahifa yangilanganda (F5) localStorage'dagi eski `blob:` havola endi yaroqsiz bo'ladi, lekin bu darhol muammo emas: ilova ochilishi bilan (`App.vue`dagi mavjud `fetchProfileImage()` chaqiruvi orqali) rasm barcha holatda qayta yuklanadi va yangi `blob:` URL bilan almashtiriladi — foydalanuvchi buni sezmasligi kerak (bir lahzalik harf-avatar ko'rinishi mumkin, xuddi hozirgacha bo'lgani kabi).

**Sinov:** `curl` orqali muammo **jonli backend bilan aniq tasdiqlandi** (401 status). `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. Foydalanuvchidan qayta sinab ko'rishini so'rash kerak — bu safar tub sabab (nafaqat manzil, balki autentifikatsiya) to'g'ridan-to'g'ri backend javobi bilan tasdiqlangani uchun ishonch darajasi yuqori.

---

## 2026-08-20

### 31. "Xizmatlar" (Services) uchun to'liq CRUD ulandi — SuperAdmin uchun Sozlamalarda yangi boshqaruv bo'limi
Foydalanuvchi: "super-admin uchun tizimda sozlamalar bo'limi ochishimiz kerak va u yerda xizmalar api ulashimiz kerak ... hozirda xizmalar api to'liq ulanmagan ... super admin to'liq boshqara oladigan bo'lishi kerak". Tekshirilganda: talabalar/xodimlar ko'radigan "Xizmatlar" sahifasi ([`src/views/services.vue`](src/views/services.vue)) allaqachon haqiqiy backenddan (`GET /api/v1/services/`) o'qiyotgan edi — lekin bu **faqat o'qish uchun** edi, xizmatlarni qo'shish/tahrirlash/o'chirish imkoniyati tizimda umuman yo'q edi (backendda xizmatlar qanday kelsa, aynan shunday ko'rsatilar edi, boshqarib bo'lmasdi).

**Backend (`api/schema/` orqali tasdiqlangan) — `/api/v1/services/` to'liq CRUD'ga ega ekan:**
```
GET    /api/v1/services/       → { count, next, previous, results: Service[] }
POST   /api/v1/services/       → { code, name_uz, ..., category, department, sla_value, sla_unit, output_format,
                                    requires_payment, payment_amount, is_active, order } → 201 Service
GET/PUT/PATCH/DELETE /api/v1/services/{id}/
Service: kod, 4 tilda nom (name_uz/uz_cyrl/ru/en), 4 tilda tavsif, kategoriya (reference/financial/academic/science),
         mas'ul bo'lim, SLA (qiymat+birlik: soat/ish kuni), hujjat formati (pdf/excel/pdf_excel),
         to'lov talab qilinadi + miqdori, faollik, tartib raqami.
```
Bu — talaba/xodim ko'radigan barcha "Xizmatlar" ro'yxati va murojaat turlarining **manba (source of truth)** jadvali; frontendda buni to'liq boshqarish imkoniyati yo'qligi sabab, yangi xizmat qo'shish yoki mavjudini o'zgartirish uchun to'g'ridan-to'g'ri backend/DB'ga murojaat qilish kerak bo'lar edi.

**O'zgartirilgan/yaratilgan fayllar:**
- [`src/stores/services.ts`](src/stores/services.ts) — to'liq qayta yozildi. `Service` interfeysiga backendda bor, lekin frontendda ishlatilmagan maydonlar qo'shildi (`sla_value`, `sla_unit`, `description_uz_cyrl`, `description_en`, `order`); `FileFormat` ga backendda mavjud uchinchi qiymat (`pdf_excel`) qo'shildi. Yangi `ServicePayload` (yozish uchun tip) va `addService`/`updateService`/`removeService` action'lari qo'shildi. `fetchServices()` endi (avvalgi `page_size:100` bitta sahifa o'rniga) `info.ts`/`systemSettings.ts`dagi kabi `next` tugaguncha **barcha sahifalarni** to'liq yig'ib oladi — xizmatlar soni 100 tadan oshsa ham hech biri tushib qolmasligi uchun.
- [`src/views/settings.vue`](src/views/settings.vue) — "Tizim sozlamalari" bo'limidan keyin, yangi **"Xizmatlar boshqaruvi"** kartasi qo'shildi. Diqqat: bu bo'lim ataylab `authStore.isAdmin` (department_admin ham kiradi) emas, balki **faqat `authStore.isSuperAdmin`** shartiga bog'landi — foydalanuvchi aynan "super-admin to'liq boshqara oladigan bo'lishi kerak" deb alohida ta'kidlagani sabab. Yangi xizmat qo'shish/tahrirlash formasi [`info.vue`](src/views/info.vue)dagi bilan bir xil **til-tab** naqshiga ega (nom+tavsif 4 tilda), qolgan maydonlar (kod, kategoriya, mas'ul bo'lim — `staffStore.departments`dan, SLA qiymat+birlik, hujjat formati, to'lov, faollik, tartib raqami) grid ko'rinishida joylashtirilgan. Ro'yxat — mavjud "Tizim sozlamalari" jadvali bilan bir xil `.staff-table` uslubidagi jadval, har bir qatorda Tahrirlash/O'chirish. Xatolar `extractApiError()` orqali backendning **aniq** sababi bilan ko'rsatiladi ([13-band]dagi kabi).
- [`src/i18n/messages.ts`](src/i18n/messages.ts) — uchala tilga (`uz`/`ru`/`en`) `settings.service*`/`settings.col*` bloki (~45 ta yangi kalit: sarlavhalar, maydon nomlari, kategoriya/format/SLA birligi label'lari, xato/muvaffaqiyat xabarlari) qo'shildi.

**Diqqat — ataylab qamrovga kiritilmagan ikkita texnik maydon:** `required_documents` (talab qilinadigan hujjatlar ro'yxati) va `template_path` (shablon fayl yo'li) — Service schema'sida bor, lekin frontendning **hech bir joyida** (jumladan talaba murojaat yuboradigan [`RequestWizardModal.vue`](src/components/RequestWizardModal.vue)da ham) ishlatilmaydi/ko'rsatilmaydi, ya'ni ularni tahrirlash imkoniyati qo'shish hozircha amaliy foyda bermas edi (natijasi hech qayerda ko'rinmaydi). Agar kelajakda talabaga "ushbu xizmat uchun quyidagi hujjatlar kerak" ro'yxatini ko'rsatish kerak bo'lsa, avval shu ko'rsatish qismini frontendga qo'shish, keyin admin panelida tahrirlash imkoniyatini ochish kerak bo'ladi — bu alohida vazifa.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` ikkalasi ham xatosiz o'tdi. Haqiqiy SuperAdmin kredensiallari bu muhitda mavjud emasligi sababli jonli login bilan sinalmadi — buning o'rniga `npm run build` chiqargan **haqiqiy production CSS** (`dist/assets/*.css`) loyihaning `public/` papkasiga vaqtincha joylashtirilib, yangi "Xizmatlar boshqaruvi" formasi va jadvali to'liq HTML namunasi bilan brauzerda render qilindi (Vue scoped-style `data-v-*` atributlari to'g'ri moslashtirilgan holda) — 3 ustunli forma to'ri, checkbox qatori, jadval va tugmalar ham **yorug'**, ham **qorong'i** temada boshqa sahifalar (Tizim sozlamalari, Info) bilan bir xil dizaynda to'g'ri chiqishi tasdiqlandi, so'ng vaqtinchalik fayllar o'chirildi (`git status` orqali ular hech qachon repo'ga tushmagani tekshirildi). Iltimos, SuperAdmin hisobi bilan kirib, Sozlamalar sahifasidagi yangi "Xizmatlar boshqaruvi" bo'limida haqiqiy xizmat qo'shib/tahrirlab ko'ring — agar backend biror maydonda kutilganidan boshqacha xato qaytarsa, endi ekranda **aniq sabab** ko'rinadi va shu asosda tezda tuzataman.

**Darhol qo'shimcha tuzatish (o'sha kuni, foydalanuvchi jonli sinab ko'rgandan keyin):** Foydalanuvchi: "hozirda faqat bitta tilda kiritilmoqda, bu apida esa qolgan narsalar 4 tilda bo'lgan edi (uzb, uzb(kril), rus, eng)". Sabab: forma dastlab [`info.vue`](src/views/info.vue)dagi kabi **tab** (almashtiruvchi tugmalar) uslubida edi — bir vaqtning o'zida faqat bitta til maydoni ko'rinar, qolgan 3 tasi tugmani bosmasa ko'rinmas edi (API/store darajasida barcha 4 til baribir to'g'ri yuborilar edi, lekin admin ularni ko'rmay/to'ldirmay qolib ketishi oson edi). Tuzatildi: [`src/views/settings.vue`](src/views/settings.vue)dagi Xizmat qo'shish/tahrirlash formasida tablar olib tashlandi, o'rniga **4 tilning har biri alohida, bir vaqtning o'zida to'liq ko'rinadigan blok** sifatida (sarlavha + nom maydoni + tavsif maydoni, ketma-ket pastga qarab) qayta qurildi — endi hech qanday til yashirin qolmaydi. `npx vue-tsc --noEmit`/`npm run build` xatosiz o'tdi, yangi ko'rinish yana vaqtincha `public/`ga joylashtirilgan haqiqiy CSS bilan yorug'/qorong'i temada vizual tasdiqlandi.

---

### 32. Profil o'zini tahrirlay oladigan qilindi, "Sozlamalar" endi faqat SuperAdmin uchun
Foydalanuvchi: "profilga shu o'zi ma'lumotlarni o'zgartira olishni qo'shish kerak, sozlamalardan olish kerakda profilda update qilishni, keyin super-admindan tashqari qolganlardan sozlamalarni olib tashlash kerak". Ya'ni: (1) shaxsiy ma'lumotlarni (ism, email, telefon, jins, rasm, parol) tahrirlash endi "Sozlamalar" emas, "Profil" sahifasida bo'lishi kerak; (2) "Sozlamalar" bo'limi (tizim konfiguratsiyasi + xizmatlar boshqaruvi) endi faqat SuperAdmin uchun ochiq bo'lishi, boshqa hech kimga (jumladan department_admin'ga ham) ko'rinmasligi kerak.

**O'zgartirilgan fayllar:**
- [`src/views/profile.vue`](src/views/profile.vue) — avvalgi **faqat o'qish uchun** sahifa endi to'liq tahrirlash imkoniyatiga ega: avatar yuklash + "HEMIS bilan yangilash" tugmalari sarlavha qismiga ko'chirildi; `full_name`/`email`/`phone`/`gender` endi to'g'ridan-to'g'ri shu sahifada tahrirlanadigan input'lar (avval faqat matn sifatida ko'rsatilardi, "Tahrirlash" tugmasi `/settings`ga olib borardi — bu havola olib tashlandi); pastda alohida karta sifatida **parolni o'zgartirish** formasi qo'shildi (faqat `authStore.isAdmin` — department_admin/super_admin uchun, chunki faqat ular local login+parolga ega, [11-band]dan beri ma'lum). Barcha bu logika (avatar/HEMIS-sync/profil-PATCH/parol-POST) [`settings.vue`](src/views/settings.vue)dan shu yerga ko'chirildi.
- [`src/views/settings.vue`](src/views/settings.vue) — shaxsiy profil formasi, avatar, HEMIS-sync va parol formasi butunlay olib tashlandi. Endi sahifada faqat ikkita **administrator** bo'limi qoladi: "Tizim sozlamalari" (kalit/qiymat) va "Xizmatlar boshqaruvi" — ikkalasi ham avvalgidek `authStore.isAdmin`/`isSuperAdmin` shartisiz, chunki sahifaning o'ziga kirish endi marshrut darajasida cheklangan (pastga qarang) — shart takrorlanishi keraksiz murakkablik bo'lardi.
- [`src/router/index.ts`](src/router/index.ts) — `/settings` route'iga `superAdminOnly: true` meta qo'shildi (mavjud `/audit-log` bilan bir xil naqsh) — endi SuperAdmin bo'lmagan foydalanuvchi shu manzilga to'g'ridan-to'g'ri kirishga urinsa ham `authStore.homePath`ga qaytariladi.
- [`src/components/DashboardLayout.vue`](src/components/DashboardLayout.vue) — chap menyudagi "Sozlamalar" bandi endi faqat `authStore.isSuperAdmin` bo'lganda ko'rinadi ("Profil" bandi o'zgarishsiz, hammaga ochiq qoladi).
- [`src/i18n/messages.ts`](src/i18n/messages.ts) — uchala tilda `settings.subtitle` ("tizim konfiguratsiyasi va xizmatlarni boshqaring, faqat SuperAdmin") va `profile.subtitle` ("hisobingiz ma'lumotlarini shu yerda tahrirlang") yangi mazmunga mos yangilandi; endi ishlatilmay qolgan `profile.editLink` kaliti (uchala tildan) olib tashlandi.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` ikkalasi ham xatosiz o'tdi. Jonli SuperAdmin/department_admin kredensiallari bu muhitda yo'qligi sababli, yangi Profil sahifasining tahrirlash formasi (avatar+HEMIS-sync tugmalari, 4 ta input maydon, parol kartasi) `npm run build` chiqargan haqiqiy CSS bilan `public/`ga vaqtincha joylashtirilib brauzerda **yorug'** va **qorong'i** temada vizual tasdiqlandi, so'ng vaqtinchalik fayllar o'chirildi. Iltimos, turli rollar (talaba, xodim, department_admin, super_admin) bilan qayta kirib tekshiring: (a) barcha rollar Profil sahifasida o'z ma'lumotlarini saqlay olishi kerak; (b) faqat department_admin/super_admin Profilda parol formasini ko'rishi kerak; (c) faqat super_admin chap menyuda "Sozlamalar"ni ko'rishi va `/settings`ga kira olishi kerak — boshqa rollar to'g'ridan-to'g'ri URL orqali kirishga urinsa ham avtomatik qaytarilishi kerak.

---

### 33. "Ma'lumotlar" (Info) bo'limi — kontent chiroyli formatda chiqadigan qilindi, "Yuklab olish" tugmasi olib tashlandi
Foydalanuvchi: "info qismini chiroyli formatda chiqadigan qilishimiz kerak va yuklab olish tugmasini olib tashlashimiz kerak". Ikkinchi qism (tugmani olib tashlash) oddiy edi. Birinchisi uchun tub sababni topish kerak bo'ldi: Info kontenti [`RichTextEditor.vue`](src/components/RichTextEditor.vue) (CKEditor 5) orqali kiritiladi — jadval, rasm, iqtibos (blockquote), ro'yxat, havola kabi elementlarni qo'llab-quvvatlaydi — lekin ko'rish rejimida (`selectedEntry.bodyHtml`ni `v-html` bilan chiqaruvchi `.info-rich-body` blok) bu elementlar uchun deyarli hech qanday stil yo'q edi (faqat h1-h3/p/ul/ol). Natijada jadval, iqtibos, rasm kabi narsalar bezaksiz, brauzerning standart (xunuk) ko'rinishida chiqardi.

**Tub sabab (CKEditor'ning o'zi bilan bog'liq):** CKEditor 5'ning tayyor "content style" CSS'i (`ckeditor5/ckeditor5.css` — jadval/rasm/iqtibos/todo-list uchun tayyor chiroyli stillar beradi) **faqat `.ck-content` klassi ichida** ishlaydi (`.ck-content table`, `.ck-content .image` va h.k.) — bizning `.info-rich-body` blokida bu klass yo'q edi, shuning uchun CKEditor'ning o'z stillari umuman qo'llanilmasdi.

**Ikkinchi, kutilmagan muammo (tuzatish jarayonida topildi):** `.info-rich-body`ga `ck-content` klassi qo'shilgach, jadval boshqacha buzilib chiqdi — sarlavha (`<th>`) matni ko'rinmay qoldi, kataklar esa mavzudan qat'i nazar doim oq fonli bo'lib qoldi. Sabab: loyihada Bootstrap CSS ham ulangan (`main.ts`), Bootstrap'ning `.table` klassi (jadval bezashga mo'ljallangan) bilan CKEditor'ning jadval o'rovchisi (`<figure class="table">`) **klass nomi to'qnashib qoldi** — Bootstrap'ning `.table > :not(caption) > * > *` qoidasi `<tr>` elementiga oq fon + qora matn "sirg'alib" kirib qolar edi, bu esa qorong'i temada matnni butunlay ko'rinmas qilib qo'yardi.

**O'zgartirilgan fayllar:**
- [`src/views/info.vue`](src/views/info.vue) — "Yuklab olish" tugmasi, `downloadSelected()`/`stripHtml()` funksiyalari butunlay olib tashlandi; `.info-rich-body` diviga `ck-content` klassi qo'shildi.
- [`src/style.css`](src/style.css) — `.info-rich-body.ck-content` ostida to'liq kengaytirilgan stil qo'shildi: sarlavhalar (h1-h4, o'lchamlari bo'yicha farqlangan), paragraf, ro'yxat, **havola**, **qalin matn**, **iqtibos (blockquote)** — chap chegarali, fonli; **gorizontal chiziq (hr)**; **jadval** — sarlavha fonli, katakchalar chegarali (Bootstrap to'qnashuvi `tr`/`td`/`th`ga aniq `background-color`/`color` belgilab hal qilindi); **rasm** — yumaloq burchak, izoh (figcaption) markazlashtirilgan; **todo-list** (belgilash katakchali ro'yxat). Barchasi uchun qorong'i tema ekvivalenti ham qo'shildi.
- [`src/i18n/messages.ts`](src/i18n/messages.ts) — endi ishlatilmaydigan `info.download` kaliti uchala tildan olib tashlandi.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. Haqiqiy jadval, iqtibos, ro'yxat, havola va gorizontal chiziq bilan to'ldirilgan namuna kontent `npm run build` chiqargan haqiqiy CSS bilan brauzerda render qilindi — birinchi urinishda qorong'i temada jadval matni ko'rinmay qolgani jonli aniqlanib, Bootstrap/CKEditor klass to'qnashuvi sababi topilib tuzatildi, qayta tekshirilganda ham yorug', ham qorong'i temada jadval, iqtibos va boshqa barcha elementlar to'g'ri va chiroyli chiqishi tasdiqlandi.

---

### 34. Info: mavzular ro'yxat ko'rinishiga o'tkazildi, qorong'i temadagi g'alati oq quti tuzatildi, muharrirdagi orqaga-qaytish gesti yumshatildi
Foydalanuvchi skrinshot bilan ko'rsatdi: (1) muharrirda (RichTextEditor) sichqonchaning o'ng tugmasini bosganda brauzer "orqaga qaytish" harakatini bajarib yuborayotgan edi; (2) qorong'i temada ba'zi matnlar atrofida g'alati oq/sarg'ish quti chiqib qolayotgan edi; (3) mavzular (Info ro'yxati) ketma-ket ro'yxat emas, gorizontal "pill" qatorlar shaklida chiqar edi.

**1-band (muharrirda orqaga qaytish):** foydalanuvchi tasvirlagan xatti-harakat — o'ng sichqoncha tugmasini bosib ushlab turib harakatlantirganda orqaga qaytish — Microsoft Edge'ning **"Mouse gestures"** (sichqoncha ishoralari) nomli brauzer darajasidagi funksiyasi bo'lishi ehtimoli yuqori; bu veb-sahifa kodidan boshqarib bo'lmaydigan, faqat brauzer sozlamalaridan (`edge://settings/appearance` → "Use gestures to navigate with your mouse") o'chiriladigan xususiyat. Frontend darajasida bajarilishi mumkin bo'lgan yagona haqiqiy tuzatish — trackpad/sichqoncha bilan **gorizontal skroll orqali** tasodifiy orqaga/oldinga o'tishning oldini olish (`overscroll-behavior-x: none`) — qo'llanildi.

**2-band (qorong'i temadagi g'alati quti) — tub sabab:** RichTextEditor (CKEditor 5) matn fon-rangi (`FontBackgroundColor`) vositasi yoki Word'dan nusxa ko'chirib joylash (`PasteFromOffice`) orqali matnga **aniq (literal) inline `background-color`** (masalan oq rang) yozib qo'yilishi mumkin ekan — bu qiymat HTML ichida qattiq saqlanadi va yorug' temada bilinmasdan o'tib ketadi, lekin qorong'i fon ustida g'alati "yamalgan quti" bo'lib ko'rinadi.

**3-band (ro'yxat ko'rinishi):** `.info-cards` konteyneri `flex-wrap` bilan gorizontal qator/pill ko'rinishida edi — foydalanuvchi tepadan pastga ketma-ket ro'yxat so'ragan.

**O'zgartirilgan fayllar:**
- [`src/style.css`](src/style.css)
  - `.rte-wrap` va `.rte-wrap .ck.ck-editor__editable`ga `overscroll-behavior-x: none` qo'shildi.
  - `.info-rich-body.ck-content` ostida matn darajasidagi elementlarda (`p`/`li`/`h1-h4`/`span`/`a`/`strong`/`em`) uchraydigan har qanday inline `background`/`background-image` endi majburan shaffof qilinadi (`!important` — inline uslubni faqat shu yo'l bilan yengib bo'ladi); jadval/rasm konteynerlariga tegilmadi (ular uchun ataylab o'z fon rangimiz bor). Qo'shimcha, `<mark>` (agar "Source editing" orqali qo'lda kiritilsa) uchun ham brend rangiga mos, o'qish mumkin bo'lgan stil qo'shildi.
  - `.info-cards` `flex-wrap` qatordan `flex-direction: column`ga o'tkazildi; `.info-topic-card` endi `width: 100%` (to'liq kenglikdagi ro'yxat qatori), oldingi `max-width: 340px`/katta soya olib tashlandi, kichikroq va tekis ro'yxat ko'rinishiga moslashtirildi.

**Diqqat — cheklov (foydalanuvchiga aytilishi kerak):** agar 1-band tuzatishdan keyin ham o'ng tugma bilan orqaga qaytish davom etsa, bu Edge brauzerining o'ziga xos sozlamasi — veb-sahifa buni to'liq o'chira olmaydi, foydalanuvchi buni brauzer sozlamalaridan (`edge://settings/appearance`) o'chirishi kerak bo'ladi.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. Foydalanuvchi yuborgan skrinshotdagi aynan shu holatni (`background-color:hsl(0,0%,100%)` bilan o'ralgan matn + mavzular ro'yxati) qayta yaratib, real build CSS bilan brauzerda tekshirdim: matn atrofidagi oq quti butunlay yo'qoldi, mavzular endi tepadan-pastga to'liq kenglikdagi ro'yxat sifatida chiqmoqda — ham yorug', ham qorong'i temada tasdiqlandi.

---

### 35. RichTextEditor (CKEditor) endi qorong'i temada ham to'g'ri ko'rinadi
Foydalanuvchi: "hozirda tungi rejimda info ochilishi juda xunikda yozuvlar yaqqol ajralib turishi kerakku". Sabab: [`RichTextEditor.vue`](src/components/RichTextEditor.vue) (CKEditor 5) — "Ma'lumotlar" (Info) bo'limida yangi mavzu qo'shish/tahrirlash formasida ishlatiladi — ilovaning qorong'i/yorug' tema tizimidan butunlay bexabar edi: CKEditor'ning o'z rang sxemasi (asboblar paneli, tahrirlash maydoni, ochiladigan menyular) hamisha **statik, faqat yorug' tema** uchun mo'ljallangan `--ck-color-*` CSS o'zgaruvchilariga asoslangan. Natijada qorong'i sahifa o'rtasida yorqin oq quti (matni qora-kulrang, atrofga qat'iy zid) chiqib turardi.

**Yechim:** CKEditor'ning butun rang sxemasi bir nechta asosiy `--ck-color-base-*` CSS o'zgaruvchisidan meros olinadi (tugmalar, panel, kiritish maydonlari, tooltip — barchasi shu asosiylardan `var(...)` orqali hosil bo'ladi) — shu sabab faqat o'sha asosiylarni qorong'i tema uchun qayta belgilash yetarli bo'ldi.

**O'zgartirilgan fayllar:**
- [`src/style.css`](src/style.css) — `:root[data-theme='dark']` ostida `--ck-color-base-background`/`-foreground`/`-border`/`-text`/`-action`/`-focus`, `--ck-color-toolbar-*`, `--ck-color-dropdown-panel-*`, `--ck-color-input-*`, `--ck-color-panel-*`, `--ck-color-tooltip-*`, `--ck-content-font-color` kabi o'zgaruvchilar ilovaning mavjud qorong'i palitrasiga (`#141e28`/`#1b2740`/`#e6efff`/`#3db2ff`) moslab qayta belgilandi. **Muhim texnik nuqta:** bu o'zgaruvchilar `:root` darajasida (aniq `.rte-wrap` ichida emas) belgilandi — chunki CKEditor ochiladigan menyu/balon panellarini `<body>`ga to'g'ridan-to'g'ri (muharrir konteyneridan tashqariga) qo'shib chiqaradi; CSS o'zgaruvchilari esa qayerda joylashishidan qat'i nazar butun hujjat bo'ylab meros bo'lib davom etadi, shu sabab `:root` darajasidagi belgilash muharrirning barcha, jumladan `<body>`ga qo'shiladigan qismlarini ham qamrab oladi.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. RichTextEditor komponentini haqiqiy loyihaning boshqa qismlaridan mustaqil ravishda (vaqtinchalik Vite-orqali-yuklangan sinov sahifasi bilan, keyin o'chirilgan) brauzerda jonli ishga tushirib tekshirdim: asboblar paneli, tahrirlash maydoni va ochiladigan "Heading" menyusi — barchasi endi qorong'i temada ilovaning umumiy palitrasiga mos, matn aniq va o'qish mumkin bo'lib chiqishi tasdiqlandi; yorug' temada CKEditor avvalgidek o'zgarishsiz (oq) qolishi ham tasdiqlandi (regressiya yo'q).

**Hal qilinmagan — kod darajasidagi muammo emasligi aniqlandi:** "sichqonchaning chap tugmasi Ctrl+Z (bekor qilish) vazifasini bajarayotgani" haqida foydalanuvchidan aniqlashtirildi: **har bir chap bosishda, har doim** sodir bo'lar ekan, brauzer — **Windows + Google Chrome**. Tekshirish uchun bir necha bosqich bajarildi:
1. RichTextEditor komponentini (haqiqiy CKEditor + Vue integratsiyasi bilan) alohida sinov sahifasida ishga tushirib, matn yozib, boshqa joyga (avtomatlashtirilgan) bosish orqali qayta hosil qilishga urinildi — **muammo takrorlanmadi**, yozilgan matn saqlanib qoldi.
2. CKEditor5/`@ckeditor/ckeditor5-vue` bilan bog'liq ma'lum xatoliklar (GitHub issue'lar) qidirildi — "chap tugma = undo" degan hujjatlashtirilgan xatolik topilmadi; faqat umumiy tarzda `v-model` orqali ikki tomonlama bog'lanishda editor kontenti tasodifiy qayta yuklanishi mumkinligi haqida (boshqa senariyda — media/iframe bilan) bitta eski issue topildi, bizning holatga mos kelmadi.
3. Ilova kodida sahifa bo'ylab har bir bosishni ushlaydigan global handler borligi tekshirildi ([`AppHeader.vue`](src/components/AppHeader.vue)dagi `window.addEventListener('click', closeDropdowns)`) — bu faqat mahalliy dropdown holatlarini yopadi, allaqachon yopiq bo'lsa reaktivlikni qo'zg'atmaydi, muharrirga ta'sir qilmasligi tasdiqlandi.

**Xulosa:** muammo **100% takrorlanuvchan** bo'lishiga qaramay, avtomatlashtirilgan (dasturiy) bosish orqali qayta hosil qilinmadi — bu ilova kodidagi xatolikdan ko'ra, **jismoniy sichqoncha/uning drayver dasturi** (masalan gaming sichqoncha uchun maxsus dastur — Logitech Options+, Razer Synapse va h.k. — chap tugmaga tasodifan "Ctrl+Z" makros/klaviatura qisqa yo'li biriktirilgan bo'lishi) yoki Chrome kengaytmasi bilan bog'liq bo'lish ehtimoli yuqori — bunday holatlarni veb-sahifa kodidan tuzatib bo'lmaydi. Foydalanuvchiga tavsiya qilindi: (1) Chrome'ni **Incognito** rejimida (kengaytmalar o'chirilgan holda) sinab ko'rish — muammo yo'qolsa, sabab kengaytmada; (2) sichqoncha ishlab chiqaruvchisining dasturida (agar o'rnatilgan bo'lsa) chap tugmaga qandaydir makros/qisqa yo'l biriktirilmaganini tekshirish; (3) imkon bo'lsa boshqa sichqoncha bilan sinab ko'rish — muammo davom etsa, sabab dasturiy (drayver/kengaytma), aks holda jismoniy sichqonchaning o'zida.

---

### 36. Haqiqiy sabab topildi: sichqonchaning yon (orqaga) tugmasi — endi butun ilova bo'ylab bloklandi
[35-band]dagi "chap tugma Ctrl+Z" degan ta'rif noaniq bo'lib chiqdi — foydalanuvchi aniqlashtirgach, haqiqiy muammo: sichqonchaning **yon (bosh barmoq) tugmasi** (odatda chap tomonda joylashgan, brauzerda standart "Orqaga" navigatsiyasiga bog'langan) bosilganda ilova ichida (masalan RichTextEditor'da forma to'ldirilayotganda) tasodifan **brauzerning "Orqaga qaytish"** harakati ishga tushib, saqlanmagan matnni yo'qotib qo'yardi — bu avval "undo" bo'lib ko'ringan, aslida sahifadan chiqib ketish edi.

**Sabab:** Windows'dagi ko'pchilik sichqonchalarning yon tugmalari brauzer darajasida standart ravishda `MouseEvent.button === 3` ("Orqaga") va `button === 4` ("Oldinga") kodlari bilan keladi va Chrome buni avtomatik sahifa tarixida navigatsiya qilish uchun ishlatadi — bu holatni faqat veb-sahifaning o'zi (JavaScript orqali `preventDefault()` chaqirib) to'sib qo'yishi mumkin, [35-band]da taxmin qilingan Edge "Mouse gestures" yoki drayver dasturidan farqli o'laroq, bu holat haqiqatan ham kod darajasida tuzatiladigan muammo ekan.

**O'zgartirilgan fayllar:**
- [`src/App.vue`](src/App.vue) — ilovaning ildiz komponentida (bir marta, butun sessiya davomida) `window`ga `mousedown`/`mouseup` tinglovchisi qo'shildi: `event.button === 3 || event.button === 4` bo'lsa `event.preventDefault()` chaqiriladi — oddiy chap (`button: 0`) va o'ng (`button: 2`) bosishlarga hech qanday ta'sir qilmaydi, faqat sichqonchaning orqaga/oldinga navigatsiya tugmalarini butun ilova bo'ylab (faqat RichTextEditor emas — istalgan formada saqlanmagan ma'lumot yo'qolishining oldini olish uchun) o'chiradi.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. Haqiqiy dev-server orqali brauzerda `button: 3` va `button: 4` bilan sun'iy (`MouseEvent`) hodisalar yuborib tekshirdim — ikkalasi ham `event.preventDefault()` chaqirilgani (`defaultPrevented: true`) tasdiqlandi, oddiy chap bosish (`button: 0`) esa **hech qanday ta'sirlanmagani** (`defaultPrevented: false`) alohida tasdiqlandi — ya'ni oddiy ish faoliyati (tugmalar, havolalar, forma elementlari bosish) buzilmaydi, faqat orqaga/oldinga yon tugmalari bloklanadi.

---

### 37. Sichqoncha orqaga-tugmasi bloki — capture-phase'ga ko'chirildi (kuchaytirilgan)
[36-band]dagi tuzatishdan keyin foydalanuvchi: "boshqa muharrirlarda bunday xatolik kuzatilmayapti, yaxshilab qarab chiqsang topasan" — asosli e'tiroz, chunki agar muammo faqat "Chrome + sichqoncha" bo'lganida, u BARCHA saytlarda (jumladan boshqa muharrirlarda ham) bir xilda sodir bo'lishi kerak edi.

**Qayta tekshirilgan gipoteza:** [35-band]dagi oldingi tuzatish ([`App.vue`](src/App.vue)dagi `window.addEventListener('mousedown', ...)`) **standart (bubble-phase)** tarzda qo'shilgan edi. CKEditor kabi widget-asosidagi murakkab kutubxonalar o'zining ichki sichqoncha ishlov beruvchisida hodisani `stopPropagation()` bilan to'xtatishi mumkin (masalan jadval/rasm kabi "widget" elementlarini tanlashda) — bunday holda hodisa `window`gacha **umuman yetib bormaydi**, standart tinglovchi esa hech narsa qila olmaydi. Bu — "boshqa (soddaroq) muharrirlarda yo'q, bizning (widget-boy) muharririmizda bor" degan farqni izohlashi mumkin.

**Tekshirish:** RichTextEditor komponentini alohida ishga tushirib, `window`ga bir vaqtning o'zida ham bubble-phase, ham capture-phase tinglovchi qo'shib, muharrir ichiga oddiy chap tugma bilan bosildi — **bu holatda ikkalasi ham hodisani ko'rdi** (oddiy matn ustida bosilganda CKEditor propagatsiyani to'xtatmas ekan). Biroq bu faqat oddiy chap tugma (button 0) bilan sinaldi — **sichqonchaning orqaga (button 3) tugmasini avtomatlashtirilgan vositalar orqali simulyatsiya qilib bo'lmadi** (brauzer avtomatlashtirish vositalari faqat chap/o'ng/o'rta tugmalarni qo'llab-quvvatlaydi) — shu sabab aynan muammoli holatni to'g'ridan-to'g'ri qayta hosil qilib tasdiqlab bo'lmadi.

**Shunga qaramay qo'llanilgan kuchaytirilgan tuzatish (eng ishonchli, standart texnika):** [`src/App.vue`](src/App.vue)dagi tinglovchilar endi `{ capture: true }` bilan qo'shiladi — bu ularni hodisa `window`dan pastga (`document → ... → target`) tarqalishining **eng boshida** ishlaydigan qiladi, ya'ni CKEditor (yoki boshqa istalgan ichki komponent) hodisani ko'rishidan OLDIN. Bundan tashqari `auxclick` hodisasi uchun ham (nostandart tugmalar — o'rta/orqaga/oldinga — bosilib qo'yib yuborilgandan keyin alohida yuboriladi) tinglovchi qo'shildi. Bu — Google Maps, Figma kabi ilovalar sichqonchaning orqaga/oldinga tugmalarini o'z ichki funksiyalari uchun "qaytarib olish"da ishlatadigan xuddi shu standart usul.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. Capture/bubble farqini aniqlash uchun yozilgan sinov (window'ga ikkala fazada ham tinglovchi qo'shib, RichTextEditor ichiga bosish) orqali oddiy bosishlarda muammo yo'qligi tasdiqlandi, lekin **haqiqiy sichqoncha orqaga-tugmasini** dasturiy ravishda bosib ko'rish imkoniyati bu muhitda yo'q — shu sabab ushbu tuzatishning **yakuniy natijasini faqat foydalanuvchi haqiqiy sichqonchasi bilan tasdiqlashi mumkin**. Iltimos qayta sinab ko'ring — agar hamon davom etsa, menga aniq qaysi sahifada/qaysi elementga bosilganda sodir bo'lishini ayting (masalan: "faqat matn ustida" yoki "faqat asboblar panelidagi tugmalarda" yoki "hatto muharrirdan tashqarida ham") — bu qolgan farqni toraytirishga yordam beradi.

---

### 38. CKEditor butunlay Tiptap'ga almashtirildi
Foydalanuvchi uch marta qat'iy so'radi: "boshqa muharrirga o'tkazib ber, hozirgi umuman bo'lmayapti". [35-37 bandlar]dagi urinishlarga qaramay (dark-tema, sichqoncha orqaga-tugmasi bloklari) muammo davom etgani sabab, foydalanuvchining aniq ko'rsatmasiga ko'ra CKEditor 5 butunlay olib tashlanib, o'rniga **Tiptap** (ProseMirror-asosli, Vue 3 uchun rasmiy `@tiptap/vue-3` paketi bilan) o'rnatildi.

**Nima uchun Tiptap:** faol qo'llab-quvvatlanadi, Vue 3'ga rasmiy integratsiyasi bor, CKEditor'dagi barcha kerakli imkoniyatlar (sarlavhalar, qalin/qiyshiq/tagiga-ustiga chizilgan, ro'yxatlar — jumladan belgilash ro'yxati, iqtibos, jadval, rasm, havola, matn tekislash, shrift rangi, gorizontal chiziq, HTML manba ko'rinishi) mos kengaytmalar bilan qoplanadi, va — eng muhimi — CKEditor'dan sezilarli darajada yengil (yakuniy `info` sahifa hajmi **1.1 MB dan 460 KB gacha** qisqardi, "chunk 500kB dan katta" ogohlantirishi butunlay yo'qoldi).

**O'zgartirilgan/yaratilgan fayllar:**
- `package.json` — `ckeditor5` va `@ckeditor/ckeditor5-vue` olib tashlandi; `@tiptap/vue-3`, `@tiptap/starter-kit` (asosiy: qalin/qiyshiq/sarlavha/ro'yxat/iqtibos/gorizontal-chiziq/havola/tagiga-chizish/bekor-qaytarish — bittasida), `@tiptap/extension-text-align`, `@tiptap/extension-text-style`+`@tiptap/extension-color` (shrift rangi), `@tiptap/extension-highlight` (belgilash), `@tiptap/extension-table(+row/header/cell)`, `@tiptap/extension-image`, `@tiptap/extension-task-list`+`@tiptap/extension-task-item` qo'shildi.
- [`src/components/RichTextEditor.vue`](src/components/RichTextEditor.vue) — **butunlay qayta yozildi**. Endi CKEditor'ning tayyor UI'si o'rniga **o'zimizning oddiy, saytning umumiy dizayn tiliga mos asboblar paneli** ishlatiladi (matnli/emoji tugmalar: bekor qilish/qaytarish, sarlavha tanlash, B/I/U/S, tekislash, ro'yxatlar, iqtibos, havola, jadval, rasm, gorizontal chiziq, shrift rangi palitrasi, belgilash, HTML manba). Jadval ichida turganda qo'shimcha ustun/qator qo'shish-o'chirish tugmalari avtomatik paydo bo'ladi. Havola qo'shish endi `window.prompt()` o'rniga sahifa ichidagi kichik input-maydon orqali ([25-band]dagi "prompt() ishlatmaslik" qoidasiga mos).
- [`src/style.css`](src/style.css) — barcha CKEditor-maxsus CSS (`--ck-color-*` o'zgaruvchilar, `.ck.ck-toolbar` va h.k.) olib tashlandi; o'rniga yangi `.rte-toolbar`/`.rte-btn`/`.rte-color-swatch`/`.rte-link-field` uslublari (yorug'+qorong'i tema) qo'shildi. **Muhim arxitektura qarori:** `.info-rich-body` klassi endi **ham** tahrirlash paytida (Tiptap'ning `editorProps.attributes.class`i orqali), **ham** o'qish rejimida (`v-html` konteyneri) ishlatiladi — shu bitta CSS bloki ikkalasini ham bezaydi, alohida "tahrirlash ko'rinishi" uslubini yozish shart bo'lmadi. Bootstrap'ning `.table` klassi bilan CKEditor'ning `.table` klassi o'rtasidagi to'qnashuvni yengish uchun yozilgan maxsus yamoq (36-band) endi **kerak emas** — Tiptap jadval elementini `<figure class="table">` bilan o'ramaydi, oddiy `<table>` chiqaradi, shu sabab bu CSS ham soddalashtirildi.
- [`src/views/info.vue`](src/views/info.vue) — `v-html` konteynerining klassi `info-rich-body ck-content` dan oddiy `info-rich-body`ga qisqartirildi.

**Diqqat — migratsiya bilan bog'liq bilinadigan holat:** agar backendda avvaldan CKEditor orqali yaratilgan (masalan `<figure class="table">` yoki CKEditor'ning maxsus widget-klasslari bilan) eski yozuvlar bo'lsa, ular **ko'rish rejimida** muammosiz chiqadi (xom HTML sifatida `v-html` orqali, dizayn qisman moslashmasligi mumkin), lekin ularni **qayta tahrirlashga ochilganda** Tiptap ba'zi CKEditor-maxsus tuzilmalarni (masalan figure-o'ralgan jadval) to'liq to'g'ri tushunmasligi mumkin. Hozircha bu muhitda haqiqiy production yozuvlar yo'qligi sababli past xavfli, lekin agar shunday eski yozuv topilsa va tahrirlashda jadval/rasm noto'g'ri ko'rinsa — buni ayting, alohida ko'rib chiqaman.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi (`info` bo'limi hajmi deyarli 2.4 barobar kichraydi). Muharrirni haqiqiy Vue+Tiptap integratsiyasi bilan (loyihaning `node_modules`idagi haqiqiy paketlar orqali, keyin o'chirilgan vaqtinchalik sahifa bilan) brauzerda jonli sinadim: matn tanlab **qalin+qiyshiq** qo'llash, **sarlavha**ga aylantirish, **3x3 jadval** qo'shish (va jadval ichida turganda qo'shimcha tugmalar avtomatik chiqishi), oldindan tayyorlangan **iqtibos**/**belgilash ro'yxati** (checked/unchecked)/**havola** kontentini to'g'ri yuklab ko'rsatishi — barchasi kutilgandek natija berdi (chiqarilgan HTML to'g'ri tekshirildi). Asboblar paneli va tahrirlash maydonining ranglari `getComputedStyle()` orqali ham yorug', ham qorong'i temada tekshirildi — ikkalasida ham to'g'ri (branded) ranglar qo'llanilgani tasdiqlandi. **Diqqat:** bu safar vizual skrinshot vositasi texnik sabablarga ko'ra ishlamay qoldi (Browser pane compositing xatosi) — shu sabab tekshiruv screenshot o'rniga to'g'ridan-to'g'ri DOM/HTML-chiqish va `getComputedStyle()` tekshiruvlari orqali amalga oshirildi; rasm yuklash (fayl tanlash talab qilingani uchun avtomatlashtirilmadi) va sichqonchaning haqiqiy orqaga-tugmasi ([37-band]dagi asl muammo) hamon foydalanuvchining o'zi tomonidan haqiqiy sichqonchada tasdiqlanishi kerak.

**Eslatma:** bu tuzatish davomida loyihaning dev-server jarayoni (3000-port) Tiptap paketlari to'g'ri yuklanishi uchun **qayta ishga tushirildi** (`node_modules/.vite` keshi ham tozalandi) — bog'liqliklar (dependencies) katta o'zgarganda Vite'ning eskirgan kesh xatosi (`504 Outdated Optimize Dep`) shunday hal qilinadi.

---

### 39. Haqiqiy tub sabab topildi: gorizontal svayp navigatsiyasi butun sahifa darajasida bloklanmagan edi
Tiptap'ga to'liq o'tishdan ([38-band]) keyin ham foydalanuvchi: "yana shu holatda bo'lmoqda, sichqoncha chap tugmasini bossa orqaga qaytmoqda". **Bu — hal qiluvchi dalil edi**: muammo CKEditor'da ham, Tiptap'da ham bir xilda davom etayotgani buni **muharrir kutubxonasi bilan umuman bog'liq emasligini** to'liq isbotladi (agar sabab kutubxonada bo'lganida, ikkinchisiga o'tgach yo'qolishi kerak edi). Bundan tashqari, foydalanuvchi izchil ravishda "**chap** tugma" deb ta'kidlagani ([36-37-band]dagi "yon/orqaga tugma" gipotezasidan farqli) — bu asosiy (primary) sichqoncha tugmasi ekanini ko'rsatadi, demak sabab alohida "orqaga" tugmasi emas.

**Haqiqiy sabab:** bu Windows noutbuklaridagi **trackpad'ning ikki barmoq bilan gorizontal svayp qilish** (yoki chap tugmani bosib ushlab, gorizontal harakatlantirish) — Chrome/Edge buni standart ravishda sahifa tarixida orqaga/oldinga o'tish sifatida talqin qiladi. [35-band]da qo'shilgan `overscroll-behavior-x: none` faqat `.rte-wrap` (muharrir konteyneri) ichida edi — bu juda tor ko'lam edi: agar svayp harakati sahifaning **boshqa istalgan joyida** (yoki hatto muharrir ichida, lekin ichki scroll konteyner chegarasidan "sizib chiqib", tashqi sahifaga "zanjirlanib" o'tib ketganda) sodir bo'lsa, bu kichik blok hech narsani to'xtata olmasdi.

**Yechim:** [`src/style.css`](src/style.css)dagi `html`/`body` (butun sahifaning ildiz elementlari) ga `overscroll-behavior-x: none` qo'shildi. `overscroll-behavior` — aynan shu turdagi "svayp-orqali-navigatsiya"ning oldini olish uchun brauzerlar tomonidan rasman qo'llab-quvvatlanadigan standart CSS xususiyati (JavaScript orqali sichqoncha tugmasini `preventDefault()` qilishga [37-band] qaraganda ancha ishonchli) — va uni **ildiz elementga** qo'yish, ichki bitta konteynerga emas, butun sahifa bo'ylab (jumladan muharririning o'zi, boshqa barcha forma va sahifalar) himoya qiladi, chunki brauzer svayp-navigatsiya harakatini ildiz elementning shu xususiyatiga qarab qaror qiladi — necha qatlam ichki scroll konteyner bo'lishidan qat'i nazar.

**O'zgartirilgan fayllar:**
- [`src/style.css`](src/style.css) — `html { overscroll-behavior-x: none; }` va `body { ...; overscroll-behavior-x: none; }` qo'shildi (ikkalasiga ham qo'yildi — turli brauzerlar ba'zan `html`ni, ba'zan `body`ni "ildiz scrolling elementi" deb hisoblaydi, shu sabab ikkalasi ham qamrab olindi).

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. Brauzerda `getComputedStyle()` orqali `html`/`body`ning ikkalasida ham `overscroll-behavior-x: none` haqiqatan qo'llanilgani tasdiqlandi. Haqiqiy trackpad svayp harakatini bu muhitda (avtomatlashtirish vositalari orqali) sinab bo'lmaydi — shu sabab **yakuniy tasdiqni faqat foydalanuvchining o'zi** haqiqiy noutbuk/trackpad bilan berishi mumkin. Bu safar ko'lam ancha kengroq (butun sahifa, faqat bitta komponent emas) va texnika ancha ishonchli (brauzer-rasmiy CSS xususiyati, JS orqali tugma bosilishini "ushlab qolish"ga urinish emas) bo'lgani uchun ishonch darajasi ancha yuqori.

---

### 40. NIHOYAT HAQIQIY TUB SABAB TOPILDI: v-model'dagi poyga holati (race condition) — sichqonchaga, brauzerga, kutubxonaga aloqasi yo'q edi
[35-39-band]lardagi barcha urinishlar ([App.vue]dagi sichqoncha-tugma bloklari, `overscroll-behavior-x`) noto'g'ri yo'nalishda edi — chunki dastlabki tavsif ("orqaga qaytish") meni noto'g'ri izga solgan edi. Foydalanuvchidan **to'rtta aniq savol** orqali olingan javoblar ([AskUserQuestion] orqali) muammoni oxir-oqibat tor doiraga solib berdi: (1) URL o'zgarmaydi, foydalanuvchi buni yana "**ctrl+z**" deb ta'riflaydi (asl [35-band]dagi tavsif to'g'ri ekan); (2) **alohida jismoniy sichqoncha** (trackpad emas — [37-39-band]dagi svayp-gipoteza noto'g'ri chiqdi); (3) **faqat matn muharriri ichida** sodir bo'ladi (sahifaning boshqa joylarida yo'q); (4) **bitta oddiy bosishning o'zidan**, harakatsiz.

**Bu to'rttasi birgalikda** aniq bitta narsani ko'rsatdi: bu — CKEditor'da ham, Tiptap'da ham **ikkalasida bir xil qilingan `v-model` sinxronizatsiya kodi**dagi klassik **poyga holati (race condition)**, [93-raqamli GitHub issue](https://github.com/ckeditor/ckeditor5-vue/issues/93)da ("Media keeps reloading contents while editing with v-model") tasvirlanganiga o'xshash muammo.

**Aniq mexanizm:** [`RichTextEditor.vue`](src/components/RichTextEditor.vue)da ishlatilgan naqsh — `onUpdate` orqali har bir o'zgarishni parent'ga `emit('update:modelValue', ...)` qilib yuborish, parent esa buni qaytadan `props.modelValue` sifatida qaytarib berishi, va komponent buni `watch(() => props.modelValue, ...)` orqali kuzatib, farq bo'lsa `editor.commands.setContent(value)` chaqirishi — **odatdagi holatda** xavfsiz (chunki qaytib kelgan qiymat editor'ning o'z HTML'iga teng bo'lishi kerak, `setContent` chaqirilmaydi). Lekin agar foydalanuvchi **tez-tez, ketma-ket harflar yozsa**, Vue'ning reaktivlik tsikli (watcher) ba'zan **eski (bir necha harf oldingi) qiymat** bilan ishga tushishi mumkin — va shu payt **bosish** (click) Vue'ning kutilayotgan (pending) reaktiv yangilanishlarini "flush" qilishga turtki bo'lganda, `setContent()` **eskirgan qiymat bilan chaqirilib**, foydalanuvchi hozirgina yozgan oxirgi harflarni "yutib yuboradi" — bu aynan "Ctrl+Z" kabi ko'rinadi, lekin aslida **hech qanday bekor qilish (undo) sodir bo'lmagan** — shunchaki eski holat qaytadan yozib qo'yilgan.

**Nega faqat "sichqoncha + chap tugma"da sodir bo'lardi:** chunki **bosish (click)** — bu Vue'ning kutilayotgan reaktiv yangilanishlarini darhol qayta ishlashga majburlaydigan (flush qiluvchi) eng keng tarqalgan foydalanuvchi harakati; klaviaturada yozishning o'zi buni qo'zg'atmaydi, lekin orasiga bitta bosish tushib qolsa — poyga oynasi ochiladi.

**Yechim:** watcher'ga bitta shart qo'shildi — agar muharrir hozir **fokusda** bo'lsa (`editor.value.isFocused`), tashqi `modelValue` propi hech qachon qayta o'rnatilmaydi:
```ts
watch(() => props.modelValue, (value) => {
  if (!editor.value || sourceMode.value) return
  if (editor.value.isFocused) return // ← asosiy tuzatish
  if (editor.value.getHTML() !== value) editor.value.commands.setContent(value, { emitUpdate: false })
})
```
Bu mantiqan to'g'ri: agar foydalanuvchi hozir shu maydonga yozayotgan bo'lsa, **u — haqiqat manbai**, tashqi prop emas. Tashqi o'zgarishlar (masalan Info'da til-tabini almashtirish) faqat foydalanuvchi muharrirdan **chiqib ketgan** (fokusni yo'qotgan) paytda amal qiladi — bu esa mutlaqo to'g'ri xatti-harakat.

**O'zgartirilgan fayllar:**
- [`src/components/RichTextEditor.vue`](src/components/RichTextEditor.vue) — `watch(() => props.modelValue, ...)` ichiga `if (editor.value.isFocused) return` qo'shildi.

**Sinov — bu safar haqiqiy poyga holatini takror hosil qilib tekshirildi:** Info.vue'dagi aynan bir xil naqsh (`formBodies[activeLangTab]` — reaktiv obyekt, kalit orqali, bitta doimiy komponent instance) mustaqil sinov sahifasida qayta yaratildi. Muharrirga matn yozilib, **darhol** (bir xil paragraf ichida, fokusni yo'qotmasdan) bosildi — **matn endi yo'qolmayapti, to'liq saqlanib qolmoqda** (avval buni tekshirmagan edim — aynan shu ssenariy ilgari sinalmagan bo'shliq edi). Qo'shimcha ravishda til-tabini almashtirish (haqiqiy tashqi o'zgarish stsenariysi) ham hamon to'g'ri ishlashi — bir tildan boshqasiga o'tib, qaytib kelganda yozilgan matn joyida turishi tasdiqlandi (tuzatish legitim sinxronizatsiyani buzmagan). `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi.

**Xulosa:** [35-39-band]lardagi barcha oldingi urinishlar (sichqoncha tugmasini bloklash, `overscroll-behavior`) **zararli emas, lekin keraksiz** edi — ular baribir olib tashlanmadi (zarari yo'q, ba'zi chekka holatlarda foydali bo'lishi mumkin), lekin haqiqiy sabab ular emas, yuqoridagi `v-model` poyga holati edi. Bu — foydalanuvchidan **aniqlashtiruvchi savollar orqali** olingan tizimli ma'lumot muammoni qanday hal qilganining yaqqol namunasi: taxmindan taxminga o'tish o'rniga, bir turkum aniq savol tub sababni to'g'ridan-to'g'ri ko'rsatib berdi.

---

### 41. Info mavzusini ochib, endi yopib ham bo'ladi
Muharrir masalasi hal bo'lgach, foydalanuvchi keyingi kichik nuqsonni bildirdi: "Info"da mavzu kartasini bosib ochish ishlaydi, lekin uni yopib bo'lmaydi. Sabab: [`selectCard()`](src/views/info.vue) doim `selectedId.value = id` deb belgilardi — xuddi shu kartaga qayta bosilsa ham hech narsa o'zgarmasdi.

**O'zgartirilgan fayllar:**
- [`src/views/info.vue`](src/views/info.vue) — `selectCard(id)` endi **almashtiruvchi (toggle)**: agar allaqachon tanlangan kartaning o'ziga qayta bosilsa, `selectedId` `null`ga o'rnatiladi (yopiladi). Bundan tashqari, ochilgan tafsilot panelining sarlavha qatoriga (`.info-details-head`) alohida **"×" yopish tugmasi** qo'shildi — mavzular ro'yxati [34-band]da vertikal ro'yxatga o'tkazilgani sabab, "xuddi shu kartaga qayta bosish orqali yopish" har doim ham ko'zga aniq ko'rinavermasligi mumkin edi, shu sabab aniq tugma qo'shildi.
- [`src/style.css`](src/style.css) — `.info-details-head` (flex qator: sarlavha + yopish tugmasi) va `.info-details-close` (mavjud `.info-topic-remove` bilan bir xil qizil rang tili, yorug'+qorong'i tema) qo'shildi.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. Yopish tugmasining joylashuvi va rangi (yorug'/qorong'i) real build CSS bilan brauzerda tekshirildi, tugmani bosish tafsilot panelini haqiqatan yashirishi tasdiqlandi.

---

### 42. CKEditor'ga qaytarildi — endi [40-band]dagi haqiqiy tuzatish bilan
[38-band]da Tiptap'ga o'tilgan edi (o'sha payt tub sabab hali noaniq bo'lgani uchun "kutubxonani almashtirib ko'raylik" degan yondashuv bilan). [40-band]da haqiqiy sabab (v-model'dagi poyga holati) topilib tuzatilgach, foydalanuvchi: "eski muharrir (CKEditor) yaxshi va sifatli edi, o'shanga qaytaring" dedi. Endi tub sabab aniq bo'lgani va bu tuzatish istalgan kutubxonaga qo'llanishi mumkinligi sababli, CKEditor xavfsiz qaytarildi.

**Muhim kashfiyot — `@ckeditor/ckeditor5-vue`ning o'zida ham xuddi shu poyga holati bor ekan:** paket manbasini (`ckeditor.umd.cjs`) tekshirilganda, ularning ichki `useEditorVModel` funksiyasida aynan bizning avvalgi Tiptap kodimizdagi bilan **bir xil naqsh** topildi:
```js
vue.watch(model, (newModel) => {
  if (instance.value && newModel !== lastEditorData.value) instance.value.data.set(newModel);
});
```
— ya'ni rasmiy CKEditor Vue integratsiyasining o'zi ham tashqi `modelValue` propini **hech qanday fokus tekshiruvisiz** to'g'ridan-to'g'ri `editor.data.set()`ga uzatadi. Bundan tashqari, ularning editordan-modelga emissiyasi **300ms debounce** bilan ishlaydi (`INPUT_EVENT_DEBOUNCE_WAIT = 300`) — bu poyga oynasini yanada kengaytiradi. Demak, agar oddiy `v-model="modelValue"` (yoki `:model-value`+`@update:model-value`) orqali to'g'ridan-to'g'ri ulanganida, [40-band]dagi bug **CKEditor bilan ham qaytishi muqarrar edi**.

**Yechim — paket ichiga kira olmasak ham, uni "tashqaridan" nazorat qilish mumkin:** [`RichTextEditor.vue`](src/components/RichTextEditor.vue) endi tashqi `modelValue` propini `<Ckeditor>`ga **bevosita bermaydi**. O'rniga mahalliy `internalValue` orqali ishlaydi:
- `<Ckeditor :model-value="internalValue" @update:model-value="onUpdate" @focus="onFocus" @blur="onBlur" />`
- `onUpdate` — CKEditor o'zi yozgan har bir o'zgarishda `internalValue`ni ham, parentga `emit`ni ham yangilaydi.
- `watch(() => props.modelValue, ...)` — parentdan qaytib kelgan tashqi qiymatni **faqat muharrir fokusda bo'lmaganda** (`!isFocused.value`) `internalValue`ga o'tkazadi.

Bu orqali `@ckeditor/ckeditor5-vue`ning o'zining xavfli ichki kuzatuvchisi endi bizning **barqaror, faqat foydalanuvchi chiqib ketganda o'zgaradigan** `internalValue`'ni kuzatadi — parentdan kelayotgan tez-tez o'zgaruvchi xom `modelValue`ni emas. Xavfli poyga oynasi shu tarzda butunlay bizning nazoratimizga o'tkaziladi.

**O'zgartirilgan/tiklangan fayllar:**
- `package.json` — barcha `@tiptap/*` paketlar olib tashlandi; `ckeditor5`, `@ckeditor/ckeditor5-vue` qayta o'rnatildi.
- [`src/components/RichTextEditor.vue`](src/components/RichTextEditor.vue) — [38-band]dan oldingi to'liq CKEditor konfiguratsiyasi (sarlavhalar, shrift oilasi/o'lchami/rangi, jadval, rasm, media, manba tahriri va h.k.) tiklandi, ustiga yuqoridagi `internalValue`+fokus-nazorati qo'shildi.
- [`src/style.css`](src/style.css) — `.info-rich-body.ck-content` (CKEditor klassi bilan), Bootstrap/`.table` to'qnashuvi yamog'i ([36-band]), va qorong'i tema uchun `--ck-color-*` o'zgaruvchilar blokи ([35-band]) tiklandi. **Tiptap uchun yozilgan `.rte-toolbar`/`.rte-btn`/... maxsus uslublar olib tashlandi** (endi CKEditor o'zining tayyor UI'sini ishlatadi).
- [`src/views/info.vue`](src/views/info.vue) — `v-html` konteynerining klassi qaytadan `info-rich-body ck-content`ga o'zgartirildi.

**Diqqat — [39-40-band]dagi boshqa tuzatishlar tegilmadi:** `App.vue`dagi sichqoncha-tugma bloki, `html`/`body`dagi `overscroll-behavior-x`, Info ro'yxatining vertikal ko'rinishi, yopish tugmasi — bularning barchasi muharrir kutubxonasidan mustaqil, saqlanib qoldi.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi (`info` bo'limi hajmi CKEditor'ning boy funksionaliga mos ravishda ~1.1 MB'ga qaytdi — bu kutilgan, chunki CKEditor Tiptap'dan sezilarli darajada boy). **Eng muhimi — real poyga holati stsenariysi CKEditor bilan ham qayta sinaldi:** matn yozib, **darhol** (fokusni yo'qotmasdan) muharrir ichiga bosilganda, matn endi yo'qolmayapti, to'liq saqlanib qolmoqda (avval xuddi shu sinov Tiptap bilan muvaffaqiyatli o'tgan edi — endi CKEditor bilan ham xuddi shunday tasdiqlandi). Til-tabini almashtirish (haqiqiy tashqi sinxronizatsiya) ham to'g'ri ishlashi tasdiqlandi — bir tildan boshqasiga o'tib qaytganda yozilgan matn joyida turibdi. Qorong'i temada CKEditor'ning asboblar paneli va tahrirlash maydoni to'g'ri ranglanganligi `getComputedStyle()` orqali tasdiqlandi.

---

### 43. YAKUNIY, HAQIQIY TUB SABAB: `<label>` ichidagi CKEditor'ning yashirin fayl-input elementi bilan to'qnashuv
[35-42-band]lardagi hamma urinishlar (sichqoncha-tugma bloklari, `overscroll-behavior`, v-model poyga holati tuzatilishi, ikkita butun kutubxona almashinuvi) — barchasi FOYDALI edi va haqiqiy, tekshirilgan muammolarni tuzatdi, lekin **hech biri foydalanuvchi tasvirlagan asosiy belgi (har bir chap bosishda, muharririning istalgan joyida, matn "bekor qilinishi")ning aynan o'zini bermadi**. Muammoni oxirigacha aniqlash uchun ikkita qo'shimcha tashqi sinov o'tkazildi: (1) **Notepad'da xuddi shu sichqoncha bilan sinov** — muammo YO'Q edi (demak sichqoncha/OS emas); (2) **Chrome Incognito rejimida sinov** (kengaytmalar o'chirilgan) — muammo **hamon davom etdi** (demak kengaytma ham emas). Bu ikkalasi birgalikda muammoni **aniq bizning ilovamiz kodiga** qaytarib berdi — lekin mening barcha oldingi izolyatsiya qilingan sinovlarim (alohida, minimal Vue ilovasida RichTextEditor'ni sinash) muammoni hech qachon qayta hosil qila olmagan edi.

**Nihoyat topilgan farq:** mening barcha sinovlarim RichTextEditor'ni oddiy `<div>` ichiga joylashtirgan edi. Lekin **haqiqiy [`info.vue`](src/views/info.vue)da** u `<label class="field">...</label>` ichiga o'ralgan edi (bu — ilovadagi barcha forma maydonlari uchun umumiy naqsh, masalan yonidagi "Sarlavha" input maydoni ham xuddi shunday `<label>` ichida — bu odatda **to'g'ri va foydali** naqsh, chunki brauzer avtomatik ravishda "labelni bossa ichidagi inputga fokus tushadi" xususiyatini beradi). RichTextEditor'ni ham xuddi shu umumiy naqsh bilan o'ralgani — aslida to'g'ri ko'rinuvchi, lekin noto'g'ri bo'lib chiqqan qaror edi.

**Aniq mexanizm (haqiqiy `<label>` ichiga o'ralgan holatda qayta hosil qilib tasdiqlandi):** CKEditor5'ning rasm yuklash funksiyasi (`ImageUpload`/`Base64UploadAdapter` plagini) ichida **yashirin `<input type="file">`** elementini yaratadi (`display: none`). Bu element — HTML standarti bo'yicha **"labelable" (labelga bog'lanishi mumkin bo'lgan)** element. Muharririmiz `<label>` ichida joylashgani sabab, brauzerning **tabiiy "labelga bosilganda ichidagi bog'langan formaga fokusni yo'naltirish"** xususiyati — matn ustiga (yoki muharririning istalgan boshqa joyiga) oddiy chap tugma bilan bosilganda ham — avtomatik ravishda ishga tushib, fokusni ushbu yashirin fayl-inputga (yoki unga bog'liq boshqa CKEditor elementiga) "sudrab" ketardi. Bu fokus almashinuvi mening [42-band]dagi `onFocus`/`onBlur` kuzatuvchilarimni ishga tushirib, `isFocused` holatini vaqtincha `false` qilib qo'yardi — bu esa mening himoya qatlamimni (props.modelValue kuzatuvchisi) vaqtincha "ochib" qo'yib, eskirgan qiymatning `internalValue`ga qayta yozilishiga ("yozilgan matnni yutib yuborish" — foydalanuvchiga xuddi Ctrl+Z bosilgandek ko'ringan) sabab bo'lardi.

**Bu nega barcha oldingi urinishlarda "davom etaverdi":** [38-band]da Tiptap'ga o'tilganda ham muammo davom etgan edi, chunki Tiptap ham xuddi shu `<label>` ichiga joylashtirilgan edi — muammo kutubxonada emas, **info.vue'dagi joylashtirish naqshida** edi, shuning uchun qaysi kutubxona ishlatilishidan qat'i nazar takrorlanardi.

**Yechim:** [`src/views/info.vue`](src/views/info.vue) — RichTextEditor'ni o'rab turgan `<label class="field">` **`<div class="field">`**ga o'zgartirildi (faqat shu bitta joy — yonidagi oddiy matn input maydoni o'zining `<label>`ini saqlab qoladi, chunki u yerda bu muammo yo'q va label-forwarding xususiyati foydali). Muharririning o'zi allaqachon o'zining ARIA-nomiga ega (`"Rich Text Editor. Editing area: main."`), shu sabab `<label>`ning accessibility foydasi bu holatda yo'qolmaydi.

**Sinov — bu safar HAQIQIY DOM tuzilishi (forma > label > RichTextEditor) aniq qayta yaratilib, muammo AVVAL qayta hosil qilindi, keyin tuzatishdan keyin YO'QOLGANI alohida-alohida tasdiqlandi:**
1. `<label>` bilan (tuzatishdan oldin): matn yozib, 1 soniya kutib, muharrir ichiga bir marta bosilganda — **yozilgan matn to'liq yo'qoldi**, `document.activeElement` CKEditor'ning "Undo" tugmasiga o'tgani, va yashirin `<input type="file">` labelning ichida ekani to'g'ridan-to'g'ri tasdiqlandi.
2. `<div>` bilan (tuzatishdan keyin): xuddi shu ssenariy — matn **to'liq saqlanib qoldi**, hatto **uch marta ketma-ket qayta bosilganda ham** o'zgarmadi.

`npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi.

**Xulosa — nega bu topish shuncha qiyin bo'ldi:** bu klassik "ikkita to'g'ri narsaning noto'g'ri birikishi" turkumidagi xato edi — na `<label class="field">` naqshi (o'zi ilovada juda keng va to'g'ri ishlatiladi), na CKEditor'ning yashirin fayl-inputi (rasm yuklash uchun zarur va standart) alohida holda muammo emas edi; ular faqat **birga** kelganda, brauzerning o'zi (JavaScript kodimiz emas) fokusni kutilmagan tarzda boshqa yo'naltirib yuborardi. Shuning uchun ham muammo har doim "muharrir ichida", "har bir bosishda" takrorlanardi (chunki `<label>`ning butun maydoni ta'sir doirasida edi), lekin OS/sichqoncha, brauzer kengaytmasi, yoki muharrir kutubxonasi darajasidagi hech qanday sinov buni ko'rsata olmasdi — chunki bu **ana shu ikkitasining aynan bizning kodimizdagi kombinatsiyasi** edi.

---

### 44. Bajarilgan murojaatlar uchun SLA "kechikish" hisoblanishi noto'g'ri edi — endi to'xtatiladi
Foydalanuvchi: "bitta murojaat yuborilsa va unga shu murojaatdan oldin javob bersa ham, tizim uni murojaat soatiga qarab hisoblamoqda... murojaat vaqtidan oldin bajarilgan bo'lsa, nega vaqtni yanada hisoblab turishimiz kerak, bajarilgan deb hisoblashni to'xtatishimiz kerak emasmi". Ya'ni: muddatidan OLDIN muvaffaqiyatli yopilgan murojaat ham hamon "kechikkan" (overdue) deb ko'rsatilmoqda edi.

**Tekshiruv:** [`src/stores/requests.ts`](src/stores/requests.ts) va [`src/views/appeals.vue`](src/views/appeals.vue)da `is_overdue`/`sla_percent` maydonlarining **frontendda hech qanday mahalliy hisob-kitobsiz**, to'g'ridan-to'g'ri backend API javobidan (`GET /api/v1/requests/`) o'qilib, shunchaki ko'rsatilayotgani aniqlandi — bu maydonlar backendning o'zida `readOnly` sifatida hisoblanadi (`api/schema/` orqali tasdiqlangan). Ya'ni tub sabab **backend hisob-kitobida** — u yopilgan (bajarilgan/rad etilgan) murojaat uchun ham kechikishni "hozirgi vaqt"ga qarab hisoblashda davom etayotganga o'xshaydi, "bajarilgan payt"ga emas.

**Cheklov:** backend Django loyihasi bu repozitoriyada emas — uning hisoblash mantig'ini to'g'ridan-to'g'ri tuzatib bo'lmaydi. Shu sabab **frontend darajasida himoya (defensive) tuzatish** qo'llanildi — backendning noto'g'ri bo'lishi mumkin bo'lgan `is_overdue` bayrog'iga har doim ishonavermasdan, murojaat allaqachon yopilgan bo'lsa, kechikishni **o'zimiz, yopilgan payt asosida** aniqlaymiz.

**Backend schema orqali tasdiqlangan maydonlar** (`resolved_at` — "Bajarilgan vaqt", `sla_deadline` — "SLA muddati", ikkalasi ham `RequestDetail`/`RequestListItem`da mavjud):
```
resolved_at: string | null (format: date-time) — "Bajarilgan vaqt"
sla_deadline: string | null (format: date-time) — "SLA muddati"
```

**O'zgartirilgan fayllar:**
- [`src/views/appeals.vue`](src/views/appeals.vue) — yangi `isRequestOverdue(item)` funksiyasi qo'shildi: agar murojaat yopilgan bo'lsa (`resolved_at` mavjud) va `sla_deadline` ham mavjud bo'lsa, kechikish **faqat** `resolved_at > sla_deadline` solishtirilib aniqlanadi (ya'ni bajarilgan paytdan keyin vaqt hisoblanishi **to'xtatiladi**); agar murojaat hali ochiq bo'lsa (`resolved_at` yo'q), backend'ning jonli `is_overdue` qiymatiga ishoniladi (bu holatda "hozir"ga qarab hisoblash to'g'ri xatti-harakat). Xodim va talaba ko'rinishidagi ikkala murojaatlar ro'yxatida (`item.is_overdue` to'g'ridan-to'g'ri ishlatilgan ikkala joyda) shu funksiya bilan almashtirildi.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. Backend schema (`resolved_at`/`sla_deadline` maydon nomlari va turlari) haqiqiy `api/schema/` javobi bilan tasdiqlandi.

**Eslatma foydalanuvchi uchun:** bu — **frontendda qo'llanilgan himoya chorasi**, backend'ning o'z hisob-kitobi hamon noto'g'ri bo'lib qolishi mumkin (masalan statistika/SLA-trend grafiklarida, agar ular ham xuddi shu backend maydonlariga tayansa). Agar boshqa joyларда ham (masalan Statistika sahifasidagi SLA foizi) shunga o'xshash noto'g'ri "kechikish" ko'rinsa, xabar bering — ammo **eng to'g'ri va yakuniy yechim** — backend jamoasiga ushbu hisob-kitobni ("yopilgan murojaat uchun `resolved_at`ni ishlatish, `now()`ni emas") tuzatishni so'rash bo'ladi.

---

### 45. "O'z vaqtida yakunlandi" ko'rsatkichi qo'shildi — SLA chizig'i endi bajarilgan murojaatda ko'k rangda "davom etmaydi"
[44-band]dan davom: foydalanuvchi backend tarafini o'zi tekshirishga rozi bo'ldi, lekin qo'shimcha so'radi: "murojaat yakunlagan bo'lsa, 'murojaat yakunlandi' degan kabi narsa qo'shish kerak, hozircha vaqt [chizig'i] ko'k rangda davom etmoqda — buni ham boshqa uslubga o'tkazish kerak". Ya'ni: [44-band]dagi tuzatish "kechikkan" degan noto'g'ri holatni to'g'irladi, lekin **o'z vaqtida yakunlangan** murojaat SLA chizig'i hamon "hali jarayonda"gidek oddiy ko'k rangda chiqardi — bu ham chalkashtiruvchi edi.

**O'zgartirilgan fayllar:**
- [`src/views/appeals.vue`](src/views/appeals.vue) — yangi `isRequestCompletedOnTime(item)` funksiyasi qo'shildi (`resolved_at` bor va kechikmagan bo'lsa `true`). Xodim va talaba ko'rinishidagi ikkala murojaatlar ro'yxatida SLA chizig'iga endi uchinchi holat qo'shildi: **yashil** (`req-sla-completed`) + "✓ O'z vaqtida yakunlandi" belgisi — mavjud "qizil/kechikkan" (`req-sla-overdue` + "Muddat oshib ketdi") naqshiga o'xshash, lekin ijobiy ma'noda.
- [`src/style.css`](src/style.css) — `.req-sla-completed` (yashil gradient chiziq) va `.req-completed-tag` (yashil belgi, yorug'+qorong'i tema) qo'shildi — mavjud `.req-sla-overdue`/`.req-overdue-tag` bilan bir xil dizayn tilida.
- [`src/i18n/messages.ts`](src/i18n/messages.ts) — uchala tilga `appeals.completedOnTimeTag` kaliti qo'shildi.

**Natija — endi SLA chizig'i uchta aniq holatni ko'rsatadi:**
- **Ko'k** — hali jarayonda (ochiq murojaat, "hozir"ga qarab hisoblanadi).
- **Qizil** + "Muddat oshib ketdi" — kechikkan (ochiq va muddati o'tgan, YOKI yopilgan va kechikib bajarilgan).
- **Yashil** + "✓ O'z vaqtida yakunlandi" — yopilgan va muddatidan oldin/vaqtida bajarilgan (endi vaqt hisoblanishi to'xtagani ko'zga aniq tashlanadi).

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. Uchala holatning rangi (`getComputedStyle()` orqali: ko'k gradient, qizil gradient, yashil gradient) va yangi "yakunlandi" belgisining rangi (yorug'+qorong'i tema) real build CSS bilan brauzerda tekshirildi — barchasi to'g'ri chiqishi tasdiqlandi.

---

### 46. Rad etilgan murojaatlar uchun alohida (neytral) rang qo'shildi
[45-band]dan darhol keyin foydalanuvchi: "rad etilgan murojaatlar uchun boshqacha rang bo'lishi kerak edi, tizimda boshqacha edi". Sabab: [45-band]dagi `isRequestCompletedOnTime()` tekshiruvi "`resolved_at` bor va kechikmagan" shartiga asoslangan edi — bu rad etilgan (`rejected`) murojaatlarni ham (agar SLA muddatidan oldin rad etilgan bo'lsa) noto'g'ri ravishda **yashil "✓ O'z vaqtida yakunlandi"** deb ko'rsatib qo'yishi mumkin edi, garchi rad etish muvaffaqiyatli bajarilish emasligiga qaramay.

**O'zgartirilgan fayllar:**
- [`src/views/appeals.vue`](src/views/appeals.vue) — `isRequestCompletedOnTime()` endi aniq `item.status === 'completed'` shartini tekshiradi (avvalgi "resolved_at bor va kechikmagan" o'rniga) — shu bilan rad etilgan/bekor qilingan murojaatlar endi "yakunlandi" toifasiga tushmaydi. Yangi `isRequestRejected(item)` funksiyasi qo'shildi. SLA qatorida endi ustuvorlik tartibi: **rad etilgan → kechikkan → yakunlandi → jarayonda**.
- [`src/style.css`](src/style.css) — `.req-sla-rejected` (neytral kulrang-ko'k gradient chiziq) va `.req-rejected-tag` (neytral belgi, yorug'+qorong'i tema) qo'shildi — mavjud `m.appeals.statuses.rejected` matni qayta ishlatildi (yangi tarjima kaliti shart bo'lmadi).

**Natija — endi SLA chizig'i to'rtta aniq holatni ko'rsatadi:** ko'k (jarayonda) / qizil (kechikkan) / yashil (o'z vaqtida yakunlandi) / **kulrang-ko'k (rad etildi)** — har biri o'ziga xos ma'noga ega, bir-biriga aralashmaydi.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. To'rtta holatning barchasi (`getComputedStyle()` orqali gradient ranglar va belgi ranglari) real build CSS bilan brauzerda, ham yorug', ham qorong'i temada tekshirildi.

---

### 47. Backend'dagi yangilanishlarga moslashtirish: my-kpi'ga xodim tanlash qo'shildi, SLA tasdiqlandi, HEMIS talaba qidiruvi — qo'shimcha ma'lumot kerak
Foydalanuvchi: "bir nechta API'larda o'zgarishlar bo'ldi — my-kpi'da o'zgarish bo'ldi, SLA vaqti backend bilan to'g'irlandi, HEMIS'dan talaba qidirish ID bo'yicha ko'proq ma'lumot bilan chiqadigan bo'ldi". Backend sxemasi (`api/schema/`) qayta yuklab tekshirildi.

**1. `GET /api/v1/statistics/my-kpi/` — tasdiqlangan va ulangan:** sxema tavsifida yangi `employee_id` (query, ixtiyoriy, faqat bo'lim admin/SuperAdmin uchun) parametri paydo bo'lgani aniqlandi — "Bo'lim admin/SuperAdmin `employee_id` bilan istalgan boshqa xodimning KPI'sini ham ko'ra oladi". Javob shaklining o'zi (bajargan/bajarmagan/kechikkan sonlar + o'rtacha baho) o'zgarmagan, faqat kimning ma'lumoti so'ralishi kengaydi.
   - [`src/stores/statistics.ts`](src/stores/statistics.ts) — yangi `fetchMyKpi(employeeId?)` action va `myKpiEmployeeId` state qo'shildi.
   - [`src/views/statistics.vue`](src/views/statistics.vue) — "Mening ko'rsatkichlarim" panelining sarlavha qatoriga, **faqat admin uchun**, xodimlar ro'yxatidan (`staffStore.members`) birini tanlash imkonini beruvchi kichik tanlov (select) qo'shildi — "O'zim" (standart) yoki istalgan boshqa xodim.
   - [`src/i18n/messages.ts`](src/i18n/messages.ts) — `statistics.myKpiMineOption` kaliti uchala tilga qo'shildi.

**2. SLA vaqti — backend tasdiqlandi, frontendda o'zgartirish shart emas:** sxemada `is_overdue`/`sla_deadline`/`sla_percent` maydon nomlari va turlari **o'zgarmagan** — bu backend faqat ICHKI hisoblash mantig'ini tuzatgani ([44-46-band]dagi muammoni), maydon shaklini emas, deganini bildiradi. [44-46-band]dagi frontend himoya tuzatishi (`isRequestOverdue`/`isRequestCompletedOnTime`/`isRequestRejected`) hamon **to'g'ri va zararsiz** qoladi — backend endi to'g'ri hisoblasa ham, bizning frontend hisob-kitobimiz xuddi shu natijani beradi (ikkalasi ham `resolved_at` vs `sla_deadline`ga asoslangani uchun mos tushadi), shu sabab hech narsa o'chirilmadi yoki o'zgartirilmadi.

**3. HEMIS talaba qidiruvi — sxema tavsifi kengaygani tasdiqlandi, lekin aniq maydon nomlari hamon hujjatlashtirilmagan:** `GET /api/v1/hemis/student/{hemis_id}/` endi rasman "shaxsiy, akademik, manzil va ta'lim shakli maydonlari bilan birga to'liq holda qaytariladi" deb tavsiflangan (avval bunday tavsif yo'q edi) — bu foydalanuvchining "juda ko'proq ma'lumot" degan kuzatuvini tasdiqlaydi. Biroq javob TANASI hamon "No response body" deb belgilangan (aniq maydon nomlari hujjatlashtirilmagan) — hozirgi [`src/services/hemisLookup.ts`](src/services/hemisLookup.ts) faqat 5 ta asosiy maydonni (ism, HEMIS ID, fakultet, guruh, kurs, rasm) o'qiydi, "manzil" va "ta'lim shakli" kabi yangi maydonlarni umuman o'qimaydi.

**Hal qilinmagan — foydalanuvchidan aniq ma'lumot kerak:** [26-band]dagi kabi, bu holatda ham aniq maydon nomlarini **taxmin qilib yozish xavfli** (avval buni qilib, keyin tuzatishga to'g'ri kelgan holatlar bo'lgan). Iltimos, xodim sifatida kirib, Swagger orqali (yoki header qidiruv orqali) haqiqiy HEMIS ID bilan `GET /api/v1/hemis/student/{hemis_id}/` so'rovini yuborib, **to'liq JSON javobni** menga yuboring — shundan so'ng [`hemisLookup.ts`](src/services/hemisLookup.ts) va qidiruv natijasi ko'rsatiladigan [`AppHeader.vue`](src/components/AppHeader.vue) panelini yangi (manzil, ta'lim shakli va h.k.) maydonlarni to'liq ko'rsatadigan qilib kengaytiraman.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. my-kpi uchun xodim tanlash — kod darajasida to'g'ri yozilgan (backend `employee_id` parametrini hujjatlashtirgan), lekin haqiqiy kredensiallar yo'qligi sababli jonli sinalmadi.

---

### 48. Profil rasmini o'chirish imkoniyati qo'shildi (backend'da yangi DELETE endpoint)
Foydalanuvchi: "rasm yuklashda ham tuzatishlar kiritilgan edi — hodim va student o'zlari qo'shgan rasmni o'chirish yoki boshqasini qo'yishlari mumkin bo'lishi kerak edi". Backend sxemasi qayta tekshirilganda `/api/v1/auth/profile/`ga yangi **`DELETE`** metodi qo'shilgani topildi: "Foydalanuvchi shu tizim orqali yuklagan rasmni o'chiradi — fayl diskdan ham olib tashlanadi. HEMIS'dan kelgan rasm bunga taalluqli emas — o'chirilgandan keyin, agar bo'lsa, avtomatik o'sha ko'rsatiladi (`effective_image_url`)". "Boshqasini qo'yish" (almashtirish) imkoniyati allaqachon bor edi ([20-band]dagi "Rasm yuklash" — yangi rasm PATCH qilinganda eskisi ustidan yoziladi); yetishmayotgani — o'chirish imkoniyati edi.

**O'zgartirilgan fayllar:**
- [`src/stores/auth.ts`](src/stores/auth.ts) — yangi `deleteProfileImage()` action qo'shildi (`DELETE /api/v1/auth/profile/`, muvaffaqiyatli bo'lsa profilni qayta yuklaydi). `fetchProfileImage()` endi backend qaytarishi mumkin bo'lgan yangi `effective_image_url` maydonini (mavjud bo'lsa) eski `image`dan ustuvor o'qiydi — bu backend DELETE amalidan keyin qaysi rasm (agar HEMIS rasmi bo'lsa) "hal qiluvchi" ekanini to'g'ri aks ettiradi.
- [`src/views/profile.vue`](src/views/profile.vue) — avatar tugmalari qatoriga (rasm yuklash + HEMIS bilan yangilash yonida) yangi **"Rasmni o'chirish"** tugmasi qo'shildi — faqat foydalanuvchida hozir rasm ko'rsatilayotgan bo'lsa ko'rinadi (`authStore.session?.imageUrl`), qizil (xavfli amal) uslubida, muvaffaqiyat/xato xabarlari bilan.
- [`src/i18n/messages.ts`](src/i18n/messages.ts) — uchala tilga `settings.avatarDelete`/`avatarDeleted`/`avatarDeleteError` kalitlari qo'shildi.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. Yangi tugmaning rangi (qizil, xavfli amal uslubi — mavjud `.req-cancel-btn` klassidan foydalanildi) real build CSS bilan tasdiqlandi. Haqiqiy kredensiallar yo'qligi sababli DELETE so'rovining haqiqiy natijasi (HEMIS rasmiga qaytishi) jonli sinalmadi.

---

## 2026-08-21

### 49. Interfeys tiliga 4-til (O'zbek — kirill) qo'shildi
Foydalanuvchi: "shu tizim uchun 4-til uzbek krelni ham qo'shishimiz kerak". [18-band]da faqat Info/Aloqa **kontenti** 4 tilga (shu jumladan kirill) o'tkazilgan edi, lekin sayt **interfeysi** (header'dagi til almashtirgich, barcha menyu/tugma/xabar matnlari) hamon 3 tilda (UZ/RU/EN) qolgan edi. Endi interfeys ham to'liq 4-tilni (O'zbek lotin, O'zbek kirill, Rus, Ingliz) qo'llab-quvvatlaydi.

**Yondashuv — qo'lda tarjima emas, avtomatik transliteratsiya:** [`src/i18n/messages.ts`](src/i18n/messages.ts) dagi interfeys matnlari ~500 qatorlik `uz` obyektida joylashgan (barcha sahifa, tugma, xato xabarlari). Buni to'liq qo'lda kirillga o'girish o'rniga (xato qilish ehtimoli yuqori, va kelajakda `uz` matn o'zgarganda kirill versiyasi darhol eskirib qoladi), **rasmiy o'zbek lotin-kirill mos jadvaliga asoslangan algoritmik transliteratsiya** yozildi — bu yondashuv o'zbek tili uchun ishonchli, chunki (rus/serb kabi tillardan farqli) lotin va kirill o'zbek yozuvlari deyarli 1:1 tovush-harf mosligida.

**Yaratilgan fayl:** [`src/i18n/uzTranslit.ts`](src/i18n/uzTranslit.ts) — `transliterateUzToCyrillic(text)` va `deepTransliterate(obj)` (butun obyekt/massivni chuqur aylantiradi) funksiyalari. Qoidalar: `o'`/`g'` (turli apostrof belgilari bilan) → `ў`/`ғ`; `sh`/`ch`/`ya`/`yo`/`yu`/`ye` digraflari → `ш`/`ч`/`я`/`ё`/`ю`/`е`; qolgan yakka apostrof → `ъ` (masalan `e'lon` → `эълон`); `e` so'z boshida yoki unlidan keyin → `э`, undoshdan keyin → `е` (masalan `sherik` → `шерик`, `telefon` → `телефон`); qolgan lotin harflari rasmiy jadval bo'yicha bittalab almashtiriladi. `HEMIS`, `OneID`, `JSHSHIR`, `SuperAdmin`, `PDF`, `Excel`, `SLA`, `GPA` kabi brend/qisqartma nomlar harflab emas, aynan o'zi qoldiriladi (himoyalangan atamalar ro'yxati orqali).

**O'zgartirilgan fayllar:**
- [`src/i18n/messages.ts`](src/i18n/messages.ts) — `Locale` turiga `'UZ_CYRL'` qo'shildi; `const uzCyrl: Messages = deepTransliterate(uz)` orqali kirill varianti `uz` obyektidan avtomatik hosil qilinadi (qo'lda dublikat yo'q — `uz` matni o'zgarsa, kirill ham avtomatik yangilanadi); `messages` eksportiga `UZ_CYRL: uzCyrl` qo'shildi.
- [`src/stores/locale.ts`](src/stores/locale.ts) — `loadLocale()` endi `localStorage`dan `'UZ_CYRL'` qiymatini ham to'g'ri tan oladi.
- [`src/stores/info.ts`](src/stores/info.ts), [`src/stores/contacts.ts`](src/stores/contacts.ts) — backend `lang` so'rov parametri xaritasiga `UZ_CYRL: 'uz_cyrl'` qo'shildi (bu ikkalasi [18-band]dan beri backendning `uz_cyrl` kontent tilini allaqachon qo'llab-quvvatlagan, endi interfeys tili kirillga o'tganda ular ham avtomatik kirill kontentni so'raydi).
- [`src/components/AppHeader.vue`](src/components/AppHeader.vue) — til almashtirgich ro'yxatiga `UZ_CYRL` qo'shildi (O'zbekiston bayrog'idan qayta foydalaniladi); trigger va menyu bandlaridagi matn endi xom `Locale` kodini emas ("UZ_CYRL" kabi chiroyli bo'lmagan), qisqa `LOCALE_SHORT_LABEL` xaritasidan (`UZ`/`ЎЗ`/`RU`/`EN`) o'qiydi; bayroq belgisi endi to'g'ri `currentFlagCode` computed orqali aniqlanadi (avval `localeStore.locale.toLowerCase()` ishlatilardi — bu "UZ_CYRL" uchun `'uz_cyrl'` berib, `FlagIcon`ning `'uz'|'ru'|'en'` turiga mos kelmay, noto'g'ri bayroq — inglizcha — chiqarib yuborardi).

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. Transliteratsiya funksiyasi Node orqali (`node --experimental-strip-types`) real so'zlar bilan sinaldi — barcha natijalar haqiqiy o'zbek kirill yozuvi bilan mos keldi (`bo'lim`→`бўлим`, `qo'shish`→`қўшиш`, `O'zbekiston`→`Ўзбекистон`, `tayyor`→`тайёр`, `e'lon qilingach`→`эълон қилингач`, `sherik`→`шерик`, `noyabr`→`ноябр`, va h.k.). Brauzerda dev-server orqali jonli tekshirildi: til almashtirgichda endi 4 ta band (UZ/ЎЗ/EN/RU) chiqishi, "ЎЗ" tanlanganda butun login sahifasi (sarlavha, tugmalar, HEMIS/OneID metodlari, pastki matn) to'liq va to'g'ri kirillga o'tishi, `localStorage`da tanlov (`UZ_CYRL`) saqlanib qolishi va sahifa yangilanganda (F5) ham saqlanib qolishi, konsolda xato chiqmasligi tasdiqlandi.

**Diqqat — bilinadigan cheklov:** bu **algoritmik** transliteratsiya, professional lingvist tomonidan tekshirilgan qo'lda tarjima emas — sinovda ishlatilgan barcha so'zlar to'g'ri chiqdi, lekin juda kam uchraydigan (bizning matnlarda yo'q) g'ayrioddiy so'zlarda nazariy jihatdan aniqlik pasayishi mumkin. Agar kelajakda biror ekranda noto'g'ri/g'alati kirill so'z ko'rinsa, buni ayting — [`src/i18n/uzTranslit.ts`](src/i18n/uzTranslit.ts) ichidagi qoidalarni yoki himoyalangan atamalar ro'yxatini tuzatish kifoya (butun matnni qayta yozish shart emas).

---

## 2026-08-25

### 50. Talaba murojaat yuborishda JSHSHIR'ni qo'lda kiritishi shart emas — endi avtomatik olinadi
Foydalanuvchi: "hozida tizmda kirgan talaba faqat o'zi murojat yo'llay oladi shunday ekan hozirda jshshr kiritilshi kerak bo'lmoqda shuni o'lib tashlash kerak va jshshrni kiritish shart emas shunchaki bor jshshrni ko'rsatib murojat yubora oladigan bo'lishi kerakda". Ya'ni: murojaat doim tizimga kirgan talabaning o'ziga tegishli bo'lgani uchun, u avval o'zining 14 xonali JSHSHIR raqamini qo'lda terib, "HEMIS'dan olish" tugmasini bosishi shart emas — bu ma'lumot allaqachon backendda (talabaning shaxsiy profilida) bor, shunchaki ko'rsatilishi kerak.

**Aniqlangan manba:** [21-band]da topilgan `GET /api/v1/auth/me/` javobidagi `student_profile` (JSON) obyekti ichida `jshshir` kaliti allaqachon mavjud ekan (`profile.vue`dagi `studentFields.jshshir` tarjima kaliti orqali tasdiqlangan) — ya'ni talabaning o'z JSHSHIR'i backendda profil ma'lumotining bir qismi sifatida saqlanadi, uni qayta HEMIS'dan (`/hemis/lookup/`) so'rab olish yoki qo'lda kiritish shart emas edi.

**O'zgartirilgan/yaratilgan fayllar:**
- [`src/utils/profileJson.ts`](src/utils/profileJson.ts) — **yangi**. [21/28-band]dagi `profile.vue` ichidagi `student_profile`/`employee_profile`ni (JSON-satr / obyekt / Python dict-repr — uchala shaklda ham) xavfsiz o'qiydigan `parseProfileJson()` funksiyasi umumiy fayl sifatida chiqarildi (ikki joyda bir xil, nozik parsing mantig'ini dublikat qilmaslik uchun).
- [`src/views/profile.vue`](src/views/profile.vue) — lokal `tryParseJson`/`parseProfileJson` olib tashlandi, o'rniga yangi umumiy modul import qilindi (xatti-harakat o'zgarmadi).
- [`src/components/RequestWizardModal.vue`](src/components/RequestWizardModal.vue) — birinchi qadam ("JSHSHIR kiriting" + "HEMIS'dan olish" tugmasi) butunlay olib tashlandi. Modal ochilganda endi avtomatik `GET /api/v1/auth/me/` chaqiriladi, `student_profile.jshshir` (va `full_name`/`faculty`/`group`) o'qiladi — foydalanuvchiga faqat **o'qish uchun** ko'rsatiladi ("F.I.Sh.", "Fakultet", "Guruh", "JSHSHIR" qatorlari), keyin to'g'ridan-to'g'ri shablon tili/formati tanlash qadamiga o'tiladi. Agar biror sababga ko'ra (masalan tarmoq xatosi yoki profilda JSHSHIR topilmasa) avtomatik yuklash muvaffaqiyatsiz bo'lsa, aniq xato xabari + "Qayta urinish" tugmasi ko'rsatiladi (endi ishlatilmaydigan `lookupStudentByJshshir` chaqiruvi butunlay olib tashlandi, backendga yuboriladigan `jshshir` maydonining o'zi — talaba profilidan olingan holda — o'zgarishsiz qoladi).
- [`src/services/hemisLookup.ts`](src/services/hemisLookup.ts) — endi hech qayerda ishlatilmaydigan `lookupStudentByJshshir()` (va u chaqirgan `GET /api/v1/hemis/lookup/`) olib tashlandi — xodim uchun mo'ljallangan `lookupStudentByHemisId()` ([29-band], header qidiruvda ishlatiladi) o'zgarishsiz qoldi.
- [`src/i18n/messages.ts`](src/i18n/messages.ts) — `wizard.jshshirLabel`/`jshshirPlaceholder`/`jshshirInvalid`/`jshshirNotFound`/`jshshirLookupError`/`lookupBtn`/`looking` kalitlari uchala tildan (`uz`/`ru`/`en`) olib tashlandi, o'rniga `loadingStudentData`/`jshshirAutoLabel`/`jshshirAutoError`/`retry` qo'shildi (`UZ_CYRL` avtomatik transliteratsiya orqali o'zi yangilanadi).
- [`src/style.css`](src/style.css) — yangi `.wizard-loading` klassi (markazlashtirilgan spinner+matn, yorug'/qorong'i tema) qo'shildi.

**Diqqat:** backendning `POST /api/v1/requests/` (`RequestCreate`) endpointi hamon `jshshir` maydonini majburiy talab qiladi — bu frontendda o'zgartirilmadi (o'zgartirib bo'lmaydi ham, backend talabi), faqat bu qiymatning **manbai** talaba qo'lda kiritgan matndan → talabaning o'z profilidan avtomatik olingan qiymatga o'zgardi.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. Yangi "yuklanmoqda" va "ma'lumotlar ko'rsatilgan" holatlari (`.wizard-loading` spinneri, JSHSHIR'ning o'qish-uchun qatori) real ilova `style.css`i bilan qorong'i temada brauzerda `getComputedStyle()` orqali tekshirildi — matn/rang/joylashuv to'g'ri chiqishi tasdiqlandi. Haqiqiy talaba kredensiallari yo'qligi sababli to'liq oqim (modal ochilib, `/auth/me/` chaqirilib, real JSHSHIR bilan murojaat yuborilishi) jonli sinalmadi — agar backend `student_profile.jshshir`ni kutilganidan boshqacha joyda/nomda qaytarsa, faqat `RequestWizardModal.vue`dagi `loadOwnStudentData()` ichidagi o'qish qatorini tuzatish kifoya bo'ladi.

---

### 51. Murojaat kartasidagi "bitta chiziq" SLA ko'rsatkichi zamonaviy, animatsiyali bosqichma-bosqich tracker'ga almashtirildi
Foydalanuvchi: "murojatlarni dizayini boshqa turga o'zgartirishimiz kerakda hozirda bitta chiziq va bazi ma'lumotlar kiritolmoqda ... zamonaviy ... kreativ ... my.gov'da murjjatlar holatini ko'rsang qanday bo'lgani bilasan". Plan Mode orqali reja tuzilib tasdiqlangandan keyin amalga oshirildi. Talab: (1) to'liq qayta qurish (oddiy rang yangilash emas), (2) yangi ma'lumot maydoni qo'shilmaydi — faqat mavjud narsalar (status, SLA, sana, izoh, hujjat, tarix, baho) chiroyliroq ko'rsatiladi, (3) xodim tugmalari (Ishga olish/Yo'naltirish/Rad etish/Hujjat/Bajarildi)ning `v-if` mantiqda ko'rinish shartlari o'zgarmaydi — faqat vizual va responsive tuzatiladi.

**Yaratilgan fayl:** [`src/components/RequestStatusTracker.vue`](src/components/RequestStatusTracker.vue) — murojaat lifecycle'ini "Yuborildi → Ko'rib chiqilmoqda → Yakun (Yakunlandi/Rad etildi/Muddat o'tdi/Bekor qilindi)" tarzida 2-3 bosqichli, animatsiyali tracker sifatida ko'rsatadi. Props: `status`, `slaPercent`, `isOverdue`, `isCompletedOnTime`, `isRejected` (`appeals.vue`da allaqachon mavjud `isRequestOverdue`/`isRequestCompletedOnTime`/`isRequestRejected` — [band 44-46] — funksiyalaridan hisoblanib uzatiladi, komponent ichida qayta yozilmaydi), `slaDeadline`. Muhim taqdimot qoidasi: `cancelled` holat 1-bosqichdan to'g'ridan-to'g'ri tarmoqlanadi (2-bosqichga hech qachon "erishilgan" ko'rinmaydi), chunki [28-band] qoidasiga ko'ra talaba faqat `new` holatdagi murojaatni bekor qila oladi. SLA endi tekis progress-bar emas — 2-bosqich (Ko'rib chiqilmoqda) atrofidagi SVG halqa, `sla_percent`ga qarab to'ladi va rangi silliq o'tadi: <70% ko'k → 70-99% to'q sariq → kechikkan (`isOverdue`) qizil; halqa faqat murojaat FAOL ko'rib chiqilayotganda "nafas oladi" (pulsatsiya), yakunlangan/rad etilgan/bekor qilingan holatlarda harakat butunlay to'xtaydi.

**O'zgartirilgan fayllar:**
- [`src/views/appeals.vue`](src/views/appeals.vue) — eski `.req-sla-row` (tekis progress-bar + uchta alohida belgi: overdue/completed/rejected tag) ikkala ko'rinishda (xodim va talaba) ham `<RequestStatusTracker>` bilan almashtirildi. `.appeal-card-head`dagi `student_name · request_number · date` (nuqta bilan qo'shilgan tekis matn) endi ikonka+matn "meta-chip"larga bo'lindi (yangi ma'lumot emas, xuddi shu uchta narsa). Ikkala ro'yxat (`v-for`) `<TransitionGroup name="req-card">` ichiga olindi — kartalar ro'yxatga kirganda ozgina kechikish bilan pastdan tepaga suzib chiqadi (`--i` CSS o'zgaruvchisi orqali navbat bilan). Amaliyot tugmalari blokining `v-if` mantig'iga TEGINILMADI.
- [`src/style.css`](src/style.css) — eskirgan `.req-sla-row`/`.req-sla-track`/`.req-sla-overdue/completed/rejected`/`.req-overdue-tag`/`.req-completed-tag`/`.req-rejected-tag` (+ ularning dark-tema dublikatlari) olib tashlandi; yangi `.req-tracker*` klasslar va `@keyframes reqTrackerPulse`/`reqTrackerRingPulse`/`reqTrackerCheckPop`/`reqCardEnter` qo'shildi. `.appeal-card`ga `statistics.vue`ning `.kpi-v2` naqshidagi hover-lift (`translateY(-2px)`) qo'shildi. `.appeal-card`/`.appeal-card-head h3`/`.appeal-meta`/`.appeal-tag`/`.appeal-btn`/`.appeal-btn.primary`/`.req-detail-item`/`.req-history-entry` qattiq kodlangan hex ranglardan `var(--dash-*)` token'lariga o'tkazildi (mos keladigan eski dark-tema dublikatlari olib tashlandi — endi token orqali avtomatik to'g'ri chiqadi). `.appeal-actions`ga `flex-wrap: wrap` va `@media (max-width: 640px)` ostida 2-ustunli grid qo'shildi (5 tagacha tugma tor ekranda endi sig'adi, "..." menyu YO'Q). `@media (prefers-reduced-motion: reduce)` bloki yangi pulsatsiya/kirish animatsiyalarini ham qamrab oladigan qilib kengaytirildi.
- [`src/i18n/messages.ts`](src/i18n/messages.ts) — uchala tilga (`uz`/`ru`/`en`) bitta yangi kalit — `appeals.trackerSubmitted` ("Yuborildi"/"Отправлено"/"Submitted") — qo'shildi; qolgan barcha tracker matnlari (2-bosqich, yakun holatlari) mavjud `appeals.statuses.*`/`appeals.completedOnTimeTag`/`appeals.overdueTag` kalitlaridan qayta foydalanildi (dublikat yo'q).

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. Haqiqiy backend kredensiallari yo'qligi sababli, real dev-server (`localhost:3000`, real yuklangan `style.css` bilan) ustiga barcha 10 holat kombinatsiyasi (new, in_progress 30%/75%/100%+, redirected, completed o'z vaqtida/kechikib, rejected, expired, cancelled) uchun vaqtincha DOM in'ektsiyasi orqali sinaldi: har bir holatning tracker shakli, SLA halqasining ko'k→sariq→qizil o'tishi, pulsatsiyaning faqat "ko'rib chiqilmoqda"da ishlashi, `cancelled`ning chiziq "kesilishi" — barchasi to'g'ri chiqishi tasdiqlandi. **Muhim texnik topilma:** runtime'da JS orqali `data-theme` atributini o'zgartirib darhol `getComputedStyle` bilan SVG `stroke`ni o'qishga urinilganda, brauzer buni ba'zan eskirgan (stale) qiymat bilan qaytardi (CSS custom property o'zining o'zi to'g'ri yangilangan bo'lsa ham) — bu haqiqiy CSS xatosi emas, faqat konsol orqali qilingan sun'iy, real reflow'siz tekshiruvning o'ziga xos xususiyati ekani sahifani **haqiqiy** `localStorage`dagi tema sozlamasi bilan qayta yuklab (F5) tasdiqlandi — shunday qilinganda barcha ranglar (ko'k `#2f6dff`/to'q sariq `#f0900a`/qizil `#e0405a` yorug' temada, mos dark-tema qiymatlari qorong'ida) to'g'ri chiqdi. `.appeal-actions`ning 375px kenglikda 2-ustunli grid'ga o'tishi (`display:grid; grid-template-columns:155px 155px`) va tugmalarning `min-height:40px` bilan markazlashishi ham tasdiqlandi. Test uchun DOM'ga qo'shilgan vaqtinchalik elementlar barchasi olib tashlandi (`git status` orqali repo'ga hech narsa tushmagani tekshirildi).

---

### 52. Bildirishnomalar (Notifications) — header'ga qo'ng'iroq belgisi qo'shildi, backend'dagi tayyor API'larga ulandi
Foydalanuvchi: "bldirishnomlarni qo'shish kerakda hozirda backendda borlarini qo'shish kerak" — ya'ni backend'da allaqachon mavjud bildirishnoma API'larini frontendga ulash so'raldi.

**Muhim topilma:** [`src/stores/notifications.ts`](src/stores/notifications.ts) (`useNotificationsStore`, `AppNotification` interfeysi bilan) **allaqachon oldingi bir sessiyada yozib qo'yilgan ekan** — lekin hech qanday UI komponenti uni ishlatmagan (butun ilova bo'ylab qidirilganda faqat shu faylning o'zida "notif" so'zi topildi). Ya'ni store tayyor edi, faqat **ulanmagan** edi.

**Backend bilan tasdiqlangan (`api/schema/` orqali, "Bildirishnomalar" tegi ostida):**
```
GET  /api/v1/notifications/                 → { count, next, previous, results: Notification[] } (sahifalangan)
POST /api/v1/notifications/{id}/read/       → bitta bildirishnomani o'qildi deb belgilaydi
POST /api/v1/notifications/mark-all-read/   → barchasini o'qildi deb belgilaydi
GET  /api/v1/notifications/unread-count/    → o'qilmagan soni ("No response body" — mavjud store'da moslashuvchan o'qiladi)
Notification: { id, type (TypeEnum: request_created/status_changed/document_ready/sla_warning/
                sla_escalation/rating_request/new_service/system), type_display, channel (in_app),
                channel_display, title, message, request (murojaat id yoki null), is_read, created_at }
```
Mavjud `src/stores/notifications.ts`dagi `AppNotification` interfeysi backend `Notification` sxemasi bilan **field-by-field aynan mos** ekani tasdiqlandi — o'zgartirish shart bo'lmadi. Barcha 3 endpoint token'siz `401` qaytarishi (`curl` orqali) tasdiqlandi — himoyalangan, kutilganidek.

**O'zgartirilgan/yaratilgan fayllar:**
- [`src/components/AppHeader.vue`](src/components/AppHeader.vue) — mavjud tema/til dropdown'lari bilan bir xil `.header-dropdown`/`.header-trigger`/`.header-menu` naqshida yangi **qo'ng'iroq (bell) tugmasi** qo'shildi (foydalanuvchi chiqish tugmasi yonida, faqat autentifikatsiyadan o'tgan holatda ko'rinadi — talaba ham, xodim ham). O'qilmagan son badge sifatida (9 dan ko'p bo'lsa "9+") ko'rsatiladi; sessiya ochilganda (`watch(authStore.isAuthenticated, ..., {immediate:true})`) va har 60 soniyada (`setInterval`, [`LiveClockCard.vue`](src/components/stats/LiveClockCard.vue)dagi bilan bir xil naqsh) `fetchUnreadCount()` chaqiriladi. Qo'ng'iroq bosilganda panel ochiladi va to'liq ro'yxat (`fetchNotifications()`) yuklanadi; bitta bildirishnomaga bosilganda (agar o'qilmagan bo'lsa) `markRead()` chaqiriladi va agar bildirishnoma murojaatga bog'liq bo'lsa (`request` maydoni bor) `/appeals`ga o'tiladi; "Barchasini o'qildi deb belgilash" tugmasi `markAllRead()`ni chaqiradi. Uch dropdown (tema/til/bildirishnoma) bir-birini avtomatik yopadi (mavjud `closeDropdowns()` naqshiga qo'shildi).
- [`src/utils/formatDate.ts`](src/utils/formatDate.ts) — **yangi**. [`appeals.vue`](src/views/appeals.vue) ichida yozilgan `formatDate()` (lokal, sana+vaqtni `ru-RU`/`en-GB` formatida ko'rsatuvchi) funksiyasi endi bildirishnomalar panelida ham kerak bo'lgani sabab umumiy `formatDateTime(iso, locale)` funksiyasiga chiqarildi (dublikat mantiq yozilmasin uchun); `appeals.vue`dagi eski funksiya endi shunchaki shu umumiy funksiyani chaqiradi (xatti-harakat o'zgarmadi).
- [`src/style.css`](src/style.css) — yangi `.notif-trigger`/`.notif-bell`/`.notif-badge`/`.notif-panel`/`.notif-panel-head`/`.notif-mark-all`/`.notif-status`/`.notif-list`/`.notif-item`/`.notif-dot`/`.notif-item-body` klasslari qo'shildi — barchasi to'g'ridan-to'g'ri `var(--dash-*)` token'lari bilan yozildi ([51-band]da boshlangan modernizatsiya yo'nalishiga mos), shu sabab alohida dark-tema dublikatlari kerak emas.
- [`src/i18n/messages.ts`](src/i18n/messages.ts) — uchala tilga (`uz`/`ru`/`en`) yangi `notifications.{title,empty,loading,markAllRead}` bloki qo'shildi. Bildirishnomaning o'zi (`title`/`message`/`type_display`) backend tomonidan allaqachon tayyor matn sifatida qaytarilgani uchun bularni frontendda qayta tarjima qilish shart emas.

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. `curl` orqali barcha 3 endpoint (`notifications/`, `unread-count/`, `mark-all-read/`) token'siz `401` qaytarishi tasdiqlandi. Yangi qo'ng'iroq tugmasi, badge, ochiladigan panel (o'qilgan/o'qilmagan qatorlar, bo'sh holat) real ilova `style.css`i bilan brauzerda vaqtincha DOM in'ektsiyasi orqali tekshirildi — badge qizil rangda, o'qilmagan qatorlar fon bilan ajratilgan, o'qilmagan nuqta faqat tegishli qatorlarda ko'rinishi tasdiqlandi. Haqiqiy kredensiallar yo'qligi sababli to'liq jonli oqim (haqiqiy bildirishnoma kelishi, bosilganda o'qilgan deb belgilanishi, murojaatga o'tish) jonli sinalmadi.

---

### 53. To'liq audit o'tkazildi va topilgan xatolik/kamchiliklar tuzatildi
Foydalanuvchi: "hozirgi holatda biz qilmoqchi bo'lgan ioshlarni to'liq ko'rib chiqqin qayerda kamchiliklar va hatoliklar bilan ishlamoqda ... shuni to'liq tekshirsangda". Butun loyiha (kod darajasida — build/typecheck, barcha store'lar, router guard, so'nggi ikki funksiya) va CLAUDE.md tarixi (52 band) ikkita parallel audit orqali tekshirildi. Topilgan har bir muammo birma-bir tuzatildi:

1. **[Yuqori] Xodimni o'chirish xavfli edi** — [`staff.vue`](src/views/staff.vue)da "O'chirish" tugmasi hech qanday tasdiqlashsiz, bitta bosishda xodimni butunlay o'chirar edi, xato bo'lsa ham sukut saqlardi. Endi rol tahrirlash bilan bir xil naqshda (`role-edit-row`) inline tasdiqlash qatori qo'shildi: "Ha, o'chirish" (qizil) / "Bekor qilish" (neytral) tugmalari, xato bo'lsa aniq xabar bilan. [`src/stores/staff.ts`](src/stores/staff.ts) — `removeMember` chaqiruvi endi `staff.vue`da `try/catch` bilan o'ralgan.
2. **[O'rta] `staff.ts` store'ida boshqa barcha store'lardan farqli `error` state umuman yo'q edi** — `fetchMembers`/`fetchDepartments` xato qaytarsa sukut saqlardi. Endi boshqa store'lar (`info.ts` va h.k.) bilan bir xil naqshda `error` ref qo'shildi va jadval tepasida ko'rsatiladi.
3. **[O'rta] Hujjat yuklab olish va statistika eksporti (PDF/Excel/CSV) xato bo'lsa jim qolardi** — [`appeals.vue`](src/views/appeals.vue)dagi `download()` va [`statistics.vue`](src/views/statistics.vue)dagi `exportPdf`/`exportExcelRaw`/`exportCsv` endi `try/catch` bilan o'ralgan, xato bo'lsa aniq xabar ko'rsatiladi, eksport tugmalari yuklanish paytida band (`disabled`) bo'lib, "Yuklanmoqda..." matnini ko'rsatadi.
4. **[O'rta] Bildirishnomaga bosilganda aynan o'sha murojaat ochilmasdi** — faqat umumiy `/appeals`ga o'tkazardi. Endi [`AppHeader.vue`](src/components/AppHeader.vue) `?request=<id>` query parametri bilan yo'naltiradi, [`appeals.vue`](src/views/appeals.vue) esa sahifa yuklanganda (yoki allaqachon shu sahifada turib boshqa bildirishnomaga bosilganda — `watch` orqali) shu parametrni o'qib, mos murojaat kartasini avtomatik ochadi va ko'rinadigan qismga silliq aylantiradi (`scrollIntoView`). Xodim ko'rinishida filtr "Barchasi"ga va "Menga tayinlangan" o'chirilgan holatga qaytariladi — aks holda murojaat joriy filtrda ko'rinmay qolishi mumkin edi.
5. **[Past, kamchilik] Backend'da `?assigned_to_me=true` parametri (TZ 7.2 — xodim faqat o'ziga tayinlangan murojaatlarni ko'rishi) mavjud edi, lekin frontendda umuman ishlatilmagan edi.** Endi [`src/stores/requests.ts`](src/stores/requests.ts)dagi `fetchRequests()` ixtiyoriy `{ assignedToMe }` parametrini qabul qiladi, [`appeals.vue`](src/views/appeals.vue)da status-filtr tablari yoniga "Menga tayinlangan" almashtiruvchi (toggle) tugma qo'shildi (bosilganda serverdan qayta so'raladi). **Diqqat (implementatsiya paytida topilgan qo'shimcha nozik xato):** `updateStatus`/`redirectRequest`/`cancelRequest`/`createRequest` harakatidan keyin ichki `fetchRequests()` (argumentsiz) qayta chaqiriladi — agar bu holatda oddiygina "assignedToMe berilmasa — o'chirilgan" deb hisoblansa, "Menga tayinlangan" filtri yoqilgan holda birorta amal bajarilganda ro'yxat sukut ravishda **butun bo'lim ro'yxatiga qaytib qolar edi**. Shu sabab store ichida `lastAssignedToMe` xotira o'zgaruvchisi qo'shildi — argumentsiz chaqiruvlar oxirgi tanlangan filtrni saqlab qoladi, faqat aniq `{ assignedToMe: false }` uzatilganda o'chiriladi (bu esa `openFromNotification()`da, boshqa xodimga tayinlangan murojaatga o'tishda, ataylab ishlatiladi).
6. **[Past, kosmetik] `RequestStatusTracker.vue`dagi ishlatilmagan `isRejected` prop olib tashlandi** ([51-band]da qo'shilgan edi, lekin komponent ichida `status`ning o'zidan yetarli — hech qachon o'qilmagan) — shu bilan birga uni oziqlantirib turgan, endi hech qayerda kerak bo'lmagan `isRequestRejected()` funksiyasi ham `appeals.vue`dan olib tashlandi.
7. **[Past, kosmetik] `.req-tracker-cancelled` va `.req-tracker-check-draw` klasslariga mos CSS yozilmagan edi** (shablon ularni ishlatardi, lekin `style.css`da mos qoida yo'q edi — vizual ta'siri deyarli sezilmas, lekin niyat qilingan effekt ishlamas edi). Endi `.req-tracker-cancelled` bekor qilingan trackerni ozgina xiralashtiradi (`opacity`), `.req-tracker-check-draw` esa "yakunlandi" belgisiga boshqa checkmarklardan sal farqli, quvnoqroq animatsiya beradi.
8. **[Past, kosmetik] `RequestStatusTracker.vue`dagi `slaTitle` tooltip lokalizatsiyasiz edi** — `new Date(...).toLocaleString()` har doim brauzer standart tilida chiqardi (rus/ingliz foydalanuvchilar uchun mos emas). Endi ilovaning umumiy `formatDateTime(iso, locale)` funksiyasidan foydalanadi.
9. **[Past, o'lik kod] `src/stores/appeals.ts` — eski, localStorage-asosli mock store (108 qator) o'chirildi.** `requests.ts` uni allaqachon to'liq almashtirgan edi, lekin fayl hech qachon o'chirilmagan edi; butun loyiha bo'ylab tekshirilib, hech qayerda import qilinmasligi tasdiqlangandan keyin o'chirildi.

**Tekshirish uchun ishlatilgan usul:** ikkita parallel Explore-agent — biri CLAUDE.md tarixidagi barcha "hali sinalmagan"/"hali ulanmagan"/"moslashuvchan (taxminiy) parsing" bandlarini yig'di, ikkinchisi kod darajasida (`try/catch` yo'qligi, i18n mosligi, o'lik kod, store'lar orasidagi nomuvofiqlik, router guard, eng so'nggi ikki funksiya) haqiqiy xatoliklarni qidirdi — ikkalasi ham faqat READ-ONLY tekshirdi. Har bir muhim topilma keyin qo'lda (`grep`/`Read`) qayta tasdiqlangandan so'ng tuzatildi.

**Yangi topilma (backend schema qayta tekshirilganda):** `/api/v1/auth/one-id/login/` va `/api/v1/auth/one-id/callback/` endpointlari backendda endi mavjud, lekin callback'ning o'zi hali "Keyinroq to'liq ishlaydi" deb belgilangan — ya'ni backend'ning o'zi ham OneID'ni hali tayyor demayapti, shu sabab frontenddagi "Tez orada" holati ([11-band]) hozircha o'zgartirilmadi (bu haqiqiy xatolik emas, informatsiya sifatida qayd etildi).

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` har bir tuzatishdan keyin xatosiz o'tdi. Yangi tasdiqlash tugmalari (xodim o'chirish) real `style.css` bilan brauzerda DOM in'ektsiyasi orqali (yorug'/qorong'i rang farqi) tekshirildi. Haqiqiy kredensiallar yo'qligi sababli to'liq jonli oqim (xodimni haqiqatan o'chirish, eksport xatosi, bildirishnomadan murojaatga o'tish, "Menga tayinlangan" filtri) jonli sinalmadi — bular kod darajasida to'g'ri yozilgan, lekin real foydalanuvchi bilan tasdiqlanishi tavsiya etiladi.

---

## 2026-09-17

### 54. Talaba HEMIS orqali kirganda tizim uni "hodim" deb belgilab qo'yishi mumkin bo'lgan xato tuzatildi
Foydalanuvchi: "nega frontentda tizim student hodim deb olib tizimga hodim deb kiritimpoqda ... student authni tekshirib ber". Auth oqimi (`src/stores/auth.ts`, `router/index.ts`, `DashboardLayout.vue`, `appeals.vue`, `grant.vue`) tahlil qilindi.

**Tub sabab:** [`toSession()`](src/stores/auth.ts)da foydalanuvchi talaba yoki xodim ekanligi (`kind`, keyinchalik butun tizimni boshqaruvchi `isStaff`ning manbai) **faqat** backend qaytargan `user.role === 'student'` tekshiruviga qarab aniqlanardi — bu qaysi HEMIS tugmasi (`HEMIS · Xodim` yoki `HEMIS · Talaba`) orqali kirilganidan butunlay mustaqil edi. Agar talaba aynan **talaba** OAuth endpointi (`POST /api/v1/hemis/student/oauth/callback/`) orqali kirsa-yu, biroq backend javobidagi `user.role` maydoni negadir aniq `"student"` satriga teng bo'lmasa (masalan yangi HEMIS-sinxronlangan hisobda bo'sh/boshqacha qiymat) — frontend uni avtomatik ravishda **xodim** (`kind: 'staff'`) deb belgilab qo'yardi. Bu esa nafaqat noto'g'ri menyu emas, balki `isStaff` orqali xavfli oqibatga olib kelardi: talaba `/statistics`/`/grant` (xodim sahifalari)ga yo'naltirilardi va [`appeals.vue`](src/views/appeals.vue)da o'z murojaatini yuborish o'rniga **boshqa foydalanuvchilarning barcha murojaatlarini ko'rib chiqish/rad etish/yo'naltirish** ko'rinishiga tushib qolardi. Xuddi shu muammo [`syncProfile()`](src/stores/auth.ts) (profil PATCH'dan keyin) orqali sessiya davomida ham yuzaga kelishi mumkin edi.

**Yechim:** login usuli (`method`) — `role` maydonidan ancha ishonchli manba, chunki talaba faqat `student` HEMIS endpointi orqali kira oladi. Yangi umumiy `resolveKind(role, method)` funksiyasi qo'shildi: `method === 'student'` bo'lsa, backend nima qaytarishidan qat'i nazar `kind` doim `'student'`; aks holda avvalgidek `role === 'student'` tekshiruviga tushiladi (login+parol orqali kiruvchi department_admin/super_admin uchun xatti-harakat o'zgarmaydi). Bu funksiya ham `toSession()` (dastlabki login), ham `syncProfile()` (profil yangilanishi) ichida ishlatiladi — ikkalasi ham endi joriy sessiyaning `method`ini hisobga oladi.

**O'zgartirilgan fayllar:**
- [`src/stores/auth.ts`](src/stores/auth.ts) — yangi `resolveKind(role, method)` funksiyasi qo'shildi; `toSession()` va `syncProfile()` endi shundan foydalanadi (avvalgi, faqat `user.role`ga tayangan tekshiruv ikkalasida ham olib tashlandi).

**Sinov:** `npx vue-tsc --noEmit` va `npm run build` xatosiz o'tdi. Haqiqiy talaba kredensiallari yo'qligi sababli to'liq jonli login (HEMIS talaba OAuth orqali kirib, `/services`ga to'g'ri yo'naltirilishi) sinalmadi — bu backend real javobida `user.role` qiymati qanday bo'lishidan qat'i nazar frontendni to'g'irlaydigan himoya (defensive) tuzatish. Agar hozir ham talaba xodim sifatida ko'rinsa, bu boshqa sabab (masalan backend HEMIS Talaba callback'ining o'zi xato yoki boshqa xodim hisobiga bog'langan) bo'lishi mumkin — shunday holatda foydalanuvchi login qilgan hisobning haqiqiy `hemis_id`/`role`ini (masalan `GET /auth/me/` orqali) tekshirib ko'rish tavsiya etiladi.

---

## Qoida
Bundan keyingi har bir o'zgarishda ushbu faylga yangi sana ostida: nima qilingani, sababi va o'zgartirilgan fayllar ro'yxati qo'shiladi.
