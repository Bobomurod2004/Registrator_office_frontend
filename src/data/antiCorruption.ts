// "Korrupsiyaga qarshi kurashish" sahifasining statik ma'lumotlari.
// Manba: https://uzswlu.uz/korrupsiyaga-qarshi-kurashish (backend talab qilinmaydi).

export const HOTLINE = {
  phone: '+998712301362',
  display: '+99871 230 13 62',
  extensions: ['1044'],
}

export const TELEGRAM_URL = 'https://t.me/uzdjtu_antikorrupsiya'

// Telegram bot havolasi keyinroq beriladi (masalan 'https://t.me/<bot_username>').
// Bo'sh bo'lsa, sahifada bot tugmasi ko'rsatilmaydi.
export const TELEGRAM_BOT_URL = ''

export interface TeamMember {
  name: string
  position: string
  workHours?: string
  image: string
}

export const TEAM: TeamMember[] = [
  {
    name: 'Hoshimov Bahodir Rustamovich',
    position: "Bo'lim boshlig'i",
    workHours: '09:00–18:00',
    image: '/anticorruption/hoshimov.jpg',
  },
  {
    name: "Axmatov Jo'rabek Eshonto'rayevich",
    position: 'Bosh mutaxassis',
    image: '/anticorruption/axmatov.jpg',
  },
]

export const DUTIES: string[] = [
  "universitetda korrupsiyaga qarshi kurashishga oid qonunlar va qonunosti hujjatlariga rioya etilishi ustidan nazorat olib boradi;",
  "korrupsiyaga oid huquqbuzarliklarning oldini olishga qaratilgan chora-tadbirlar va ish rejalarini ishlab chiqadi, ularning to'liq, sifatli va o'z vaqtida ijro etilishini ta'minlaydi, belgilangan chora-tadbirlarning amalga oshirilishi ahvolini o'rganadi, natijalari bo'yicha ma'lumotlar tayyorlaydi;",
  "universitetda \"Korrupsiyasiz soha\" loyihasini amalga oshirilishini muvofiqlashtiradi;",
  "universitetda korrupsiyaga qarshi kurashish bo'yicha chora-tadbirlarni amalga oshirishga qaratilgan ichki hujjatlar loyihalarini ishlab chiqadi va tasdiqlash uchun universitet rahbariyatiga kiritadi;",
  "universitetning ichki hujjatlarida aniqlangan korrupsiyaviy normalarni bartaraf qilish bo'yicha takliflar ishlab chiqadi;",
  "universitetda korrupsiyaviy xavf-xatarlarni baholaydi va ularni kamaytirish yuzasidan chora-tadbirlar rejalarini ishlab chiqadi;",
  "universitetning professor-o'qituvchilari, boshqaruv, texnik, xizmat ko'rsatuvchi va o'quv-yordamchi xodimlarining xatti-harakatlaridagi korrupsiyaviy xavf-xatarlar va huquqbuzarliklar haqida kelib tushadigan murojaatlar va anonim xabarlarni ko'rib chiqadi hamda o'rnatilgan tartibda chora ko'rish uchun universitet rahbariyatiga ma'lumotlar taqdim etadi;",
  "universitetda korrupsiya faktlariga doir xizmat tekshiruvlari reyestrini yuritib boradi;",
  "davlat xaridlarini amalga oshirishda manfaatlar to'qnashuvini tahlil qilish va kontragentlarning ishonchliligini tekshirishda ishtirok etadi;",
  "universitet xodimlari o'rtasida manfaatlar to'qnashuvi monitoringini yuritadi va muammolar aniqlanganda bartaraf etish uchun universitet rahbariyatiga tegishli takliflar kiritadi;",
  "universitetning professor-o'qituvchilari, boshqaruv, texnik, xizmat ko'rsatuvchi, o'quv-yordamchi xodimlari va talabalari o'rtasida muntazam ravishda profilaktik suhbatlar tashkil etadi;",
  "universitet faoliyatida korrupsiyaviy holatlarni aniqlash maqsadida professor-o'qituvchilar, boshqaruv, texnik, xizmat ko'rsatuvchi, o'quv-yordamchi xodimlar va talabalar (magistrantlar, doktorantlar, mustaqil izlanuvchilar) o'rtasida so'rovnomalar o'tkazadi;",
  "so'rovlar, ijtimoiy va boshqa tadqiqotlar asosida korrupsiyaga qarshi kurashish targ'iboti bo'yicha chora-tadbirlar natijalari va ta'sirini muntazam ravishda baholab boradi hamda keyingi chora-tadbirlarni belgilashda baholash natijalaridan foydalanadi;",
  "professor-o'qituvchilar, talaba-yoshlar o'rtasida korrupsiyaga qarshi kurashishga bag'ishlangan konferensiyalar, uchrashuvlar, seminarlar, tanlovlar tashkil etadi;",
  "universitetda korrupsiyaga qarshi kurashish sohasida qabul qilinayotgan chora-tadbirlarning samaradorligini baholaydi;",
  "universitetda korrupsiyaga oid huquqbuzarliklar sodir etilishining shart-sharoitlari hamda sabablarini o'rganadi va ularni bartaraf etish bo'yicha takliflar ishlab chiqadi;",
  "universitet rasmiy veb-saytining \"Korrupsiyaga qarshi kurashish\" bo'limidagi ma'lumotlarni muntazam ravishda yangilab borilishini ta'minlaydi;",
  "har chorakda va zaruratga ko'ra korrupsiyaga qarshi kurashish bo'yicha amalga oshirilgan ishlar hamda universitetdagi korrupsiyaviy vaziyat haqida universitet rahbariyatiga hamda Oliy va o'rta maxsus ta'lim vazirligining Komplayens nazorat va korrupsiyaga qarshi kurashish bo'limiga hisobot taqdim etadi;",
  "komplayens nazorat va korrupsiyaga qarshi kurashish bo'yicha faoliyatni amalga oshiruvchi davlat organlari va tashkilotlari hamda ota-onalar bilan korrupsiyaga qarshi kurashish sohasida samarali hamkorlikni yo'lga qo'yadi.",
]
