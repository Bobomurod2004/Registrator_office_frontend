export type Locale = 'UZ' | 'RU' | 'EN'
export type ServiceTab = 'all' | 'docs' | 'finance' | 'research' | 'academic'

interface ServiceItem {
  title: string
  description: string
}

interface InfoCardContent {
  title: string
  details: string[]
}

const uz = {
  brand: {
    office: 'Registrator Ofis',
    gateway: 'Raqamli identifikatsiya',
    uniLine1: "O'zbekiston davlat",
    uniLine2: 'jahon tillari universiteti',
  },
  header: {
    search: 'Qidirish...',
    logout: 'Chiqish',
    theme: { light: 'Yorug', dark: 'Tungi', system: 'Tizim' },
  },
  roles: { staff: 'Xodim', student: 'Talaba' },
  menu: {
    services: 'Tezkor xizmatlar',
    appeals: 'Murojaatlar',
    myAppeals: 'Mening murojaatlarim',
    addStaff: "Xodim qo'shish",
    statistics: 'Statistika',
    grant: "Ta'lim granti",
    info: 'Info',
    settings: 'Sozlamalar',
  },
  login: {
    pill: 'Xavfsiz HEMIS va OneID',
    titlePrefix: 'Raqamli xizmatlar',
    rotating: ['talabalar', 'professorlar', 'registrator xodimlari', 'tadqiqotchilar'],
    showcaseText:
      "Talabalar, professor-o'qituvchilar va universitet ma'muriyati uchun ishonchli, tez va xavfsiz akademik xizmatlarni taqdim etuvchi yagona registrator platformasi.",
    heading: 'Tizimga kirish',
    subheading: 'Demo rejim: login va parol bilan kiring.',
    loginLabel: 'Login',
    passwordLabel: 'Parol',
    loginPlaceholder: 'Loginni kiriting',
    passwordPlaceholder: 'Parolni kiriting',
    submit: 'Kirish',
    demoHint: 'Demo akkauntlar:',
    orVia: 'yoki tizim orqali',
    soon: 'Tez orada',
    secured: "Davlat darajasidagi shifrlash bilan himoyalangan",
    methods: {
      staff: { title: 'HEMIS · Xodim', description: 'Akademik va registrator xodimlari' },
      student: { title: 'HEMIS · Talaba', description: 'Bakalavr va magistr talabalari' },
      oneid: { title: 'OneID', description: 'Yagona davlat identifikatsiya tizimi' },
    },
  },
  services: {
    title: 'Tezkor xizmatlar',
    subtitle: "Kerakli bo'limni tanlang va xizmatni tez ishga tushiring.",
    open: 'Ochish',
    tabs: {
      all: 'Barcha xizmatlar',
      docs: "Ma'lumotnomalar",
      finance: 'Moliyaviy jarayon',
      research: 'Ilmiy jarayon',
      academic: 'Akademik jarayon',
    },
    items: {
      all: [
        {
          title: "O'qish joyidan ma'lumotnoma olish",
          description: "Talabalik holatini tasdiqlovchi rasmiy ma'lumotnoma.",
        },
        {
          title: "To'lov shartnoma olish",
          description: "Kontrakt to'lov hujjatini yuklab olish va tekshirish.",
        },
        {
          title: "Talabalar turar joyi uchun shartnoma olish",
          description: "TTJ joylashuvi bo'yicha shartnoma arizasini rasmiylashtirish.",
        },
        {
          title: 'Reyting daftarcha olish',
          description: "Fanlar kesimida o'zlashtirish natijalari ko'rsatilgan hujjat.",
        },
        {
          title: "Akademik ta'til arizasi",
          description: "Semestr yoki yil bo'yicha akademik ta'til so'rovini yuborish.",
        },
        {
          title: "Transkriptga buyurtma berish",
          description: "Barcha fanlar va kreditlar bo'yicha transkript olish.",
        },
      ],
      docs: [
        {
          title: "Talabalik guvohnomasi dublikati",
          description: "Yo'qolgan holatlar uchun yangi guvohnoma so'rovi.",
        },
        {
          title: 'Diplom ilovasidan nusxa',
          description: "Arxivdan diplom ilovasi nusxasini rasmiy so'rash.",
        },
        {
          title: "O'qishni tasdiqlash xati",
          description: 'Ish joyi yoki boshqa tashkilotlar uchun rasmiy xat.',
        },
      ],
      finance: [
        {
          title: "Kontrakt qarzdorlik holati",
          description: "To'lovlar bo'yicha joriy holat va muddatlarni ko'rish.",
        },
        {
          title: "To'lov kvitansiyasini yuklab olish",
          description: "To'langan summalar bo'yicha rasmiy kvitansiya.",
        },
        {
          title: 'Stipendiya hisobi',
          description: "Stipendiya miqdori va to'lov davrlarini tekshirish.",
        },
      ],
      research: [
        {
          title: 'Ilmiy rahbar biriktirish',
          description: 'Bitiruv yoki ilmiy ish uchun rahbar tanlash xizmati.',
        },
        {
          title: 'Maqola taqdim etish',
          description: 'Konferensiya va jurnal uchun maqola yuborish oynasi.',
        },
        {
          title: 'Ilmiy faoliyat hisoboti',
          description: "Nashr va ishtiroklar bo'yicha hisobot topshirish.",
        },
      ],
      academic: [
        {
          title: "Fan tanlash va ro'yxatdan o'tish",
          description: "Semestr uchun fanlarni tanlash va tasdiqlash.",
        },
        {
          title: "Qayta o'qish (retake) arizasi",
          description: "O'zlashtirilmagan fanlar bo'yicha qayta o'qishga yozilish.",
        },
        {
          title: 'Dars jadvalini olish',
          description: "Haftalik dars jadvali va auditoriyalar ro'yxati.",
        },
      ],
    } as Record<ServiceTab, ServiceItem[]>,
  },
  info: {
    download: 'Yuklab olish',
    cards: [
      {
        title: "O'qishni ko'chirish tartibi",
        details: [
          'Arizalar odatda yozgi qabul oynasida qabul qilinadi.',
          "Talaba shaxsiy kabinet orqali elektron ariza to'ldiradi va hujjatlarni biriktiradi.",
          "Akademik farq bo'lsa, fakultet tomonidan individual o'quv rejasi belgilanadi.",
          "Yakunda qabul komissiyasi qarori asosida ko'chirish natijasi e'lon qilinadi.",
        ],
      },
      {
        title: 'Magistraturaga qabul qilish',
        details: [
          "Abituriyent mutaxassislik yo'nalishini tanlaydi va online ro'yxatdan o'tadi.",
          'Talab etilgan hujjatlar: diplom, transkript, pasport nusxasi va foto.',
          "Kirish sinovlari va suhbat jadvali e'lon qilingandan keyin natijalar kabinetda ko'rinadi.",
          'Qabul qilinganlar uchun kontrakt va buyruq jarayonlari avtomatlashtirilgan.',
        ],
      },
      {
        title: "Ikkinchi ta'limga qabul qilish",
        details: [
          "Nomzod amaldagi oliy ma'lumot hujjatlari bilan ariza topshiradi.",
          "Ta'lim shakli va yo'nalishiga qarab to'lov-kontrakt miqdori belgilanadi.",
          "Fanlar bo'yicha perezachet jarayoni kafedra bilan kelishilgan holda o'tkaziladi.",
          "Tasdiqdan so'ng shaxsiy kabinet orqali dars jadvali va topshiriqlar ochiladi.",
        ],
      },
    ] as InfoCardContent[],
  },
  appeals: {
    staffTitle: 'Murojaatlar',
    staffSubtitle: "Talabalar murojaatlarini ko'rib chiqing va holatini yangilang.",
    studentTitle: 'Mening murojaatlarim',
    studentSubtitle: 'Yangi murojaat yuboring yoki holatini kuzating.',
    total: 'Jami',
    new: 'Yangi',
    inProgress: 'Jarayonda',
    resolved: 'Hal qilindi',
    filterAll: 'Barchasi',
    filterGeneral: 'Umumiy murojaatlar',
    filterOnsite: 'Joyida hal qilinadigan',
    catGeneral: 'Umumiy murojaat',
    catOnsite: 'Joyida hal qilinadigan',
    take: 'Jarayonga olish',
    markResolved: 'Hal qilindi',
    newAppeal: 'Yangi murojaat',
    topic: 'Mavzu',
    topicPlaceholder: 'Murojaat mavzusi',
    type: 'Turi',
    text: 'Matn',
    textPlaceholder: 'Murojaat mazmunini yozing',
    send: 'Yuborish',
    sent: 'Murojaatingiz qabul qilindi.',
    empty: "Hozircha murojaatlaringiz yo'q.",
  },
  staff: {
    title: "Xodim qo'shish",
    subtitle: "Yangi xodimni ro'yxatga qo'shing va xodimlar ro'yxatini boshqaring.",
    newStaff: 'Yangi xodim',
    name: 'F.I.Sh.',
    namePlaceholder: 'Ism familiya',
    position: 'Lavozim',
    positionPlaceholder: 'Masalan: Registrator',
    department: "Bo'lim",
    departmentPlaceholder: "Bo'lim nomi",
    phone: 'Telefon',
    add: "Qo'shish",
    added: "Xodim qo'shildi.",
    colId: 'ID',
    colPhone: 'Telefon',
  },
  statistics: {
    title: 'Statistika',
    subtitle: "Platforma bo'yicha umumiy ko'rsatkichlar va dinamika.",
    totalAppeals: 'Jami murojaatlar',
    newAppeals: 'Yangi murojaatlar',
    resolved: 'Hal qilingan',
    staffCount: 'Xodimlar',
    monthlyTitle: 'Oylik murojaatlar dinamikasi',
    typesTitle: 'Murojaat turlari',
    months: ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun'],
    general: 'Umumiy murojaatlar',
    onsite: 'Joyida hal qilinadigan',
  },
  grant: {
    title: "Ta'lim granti",
    subtitle: "Davlat granti o'rinlari taqsimoti va holati.",
    badge: 'Grant',
    statusTitle: 'Sizning grant holatingiz',
    statusText:
      "Hozirgi semestrda davlat granti asosida o'qiyapsiz. Keyingi semestr uchun reyting natijalari e'lon qilingach holat yangilanadi.",
    totalSeats: "Jami grant o'rinlari",
    used: 'Band qilingan',
    free: "Bo'sh o'rinlar",
    byFaculty: 'Fakultetlar kesimida',
    colFaculty: 'Fakultet',
    colTotal: 'Jami',
    colUsed: 'Band',
    colFree: "Bo'sh",
    colFill: "To'ldirilganligi",
    faculties: [
      'Ingliz tili fakulteti',
      'Roman-german fakulteti',
      'Sharq tillari fakulteti',
      'Tarjima fakulteti',
    ],
  },
}

export type Messages = typeof uz

const ru: Messages = {
  brand: {
    office: 'Офис регистратора',
    gateway: 'Цифровая идентификация',
    uniLine1: 'Узбекский государственный',
    uniLine2: 'университет мировых языков',
  },
  header: {
    search: 'Поиск...',
    logout: 'Выход',
    theme: { light: 'Светлая', dark: 'Тёмная', system: 'Системная' },
  },
  roles: { staff: 'Сотрудник', student: 'Студент' },
  menu: {
    services: 'Быстрые услуги',
    appeals: 'Обращения',
    myAppeals: 'Мои обращения',
    addStaff: 'Добавить сотрудника',
    statistics: 'Статистика',
    grant: 'Образовательный грант',
    info: 'Инфо',
    settings: 'Настройки',
  },
  login: {
    pill: 'Безопасный HEMIS и OneID',
    titlePrefix: 'Цифровые услуги для',
    rotating: ['студентов', 'преподавателей', 'сотрудников', 'исследователей'],
    showcaseText:
      'Единая платформа регистратора, предоставляющая надёжные, быстрые и безопасные академические услуги для всего университетского сообщества.',
    heading: 'Вход в систему',
    subheading: 'Демо-режим: войдите с логином и паролем.',
    loginLabel: 'Логин',
    passwordLabel: 'Пароль',
    loginPlaceholder: 'Введите логин',
    passwordPlaceholder: 'Введите пароль',
    submit: 'Войти',
    demoHint: 'Демо-аккаунты:',
    orVia: 'или через систему',
    soon: 'Скоро',
    secured: 'Защищено шифрованием государственного уровня',
    methods: {
      staff: { title: 'HEMIS · Сотрудник', description: 'Академические и регистраторские сотрудники' },
      student: { title: 'HEMIS · Студент', description: 'Студенты бакалавриата и магистратуры' },
      oneid: { title: 'OneID', description: 'Единая государственная система идентификации' },
    },
  },
  services: {
    title: 'Быстрые услуги',
    subtitle: 'Выберите нужный раздел и быстро запустите услугу.',
    open: 'Открыть',
    tabs: {
      all: 'Все услуги',
      docs: 'Справки',
      finance: 'Финансовый процесс',
      research: 'Научный процесс',
      academic: 'Академический процесс',
    },
    items: {
      all: [
        {
          title: 'Справка с места учёбы',
          description: 'Официальная справка, подтверждающая статус студента.',
        },
        {
          title: 'Получение договора об оплате',
          description: 'Скачивание и проверка контрактного платёжного документа.',
        },
        {
          title: 'Договор на студенческое общежитие',
          description: 'Оформление заявления на договор о месте в общежитии.',
        },
        {
          title: 'Получение рейтинговой книжки',
          description: 'Документ с результатами успеваемости по предметам.',
        },
        {
          title: 'Заявление на академический отпуск',
          description: 'Подача запроса на академический отпуск на семестр или год.',
        },
        {
          title: 'Заказ транскрипта',
          description: 'Получение транскрипта по всем предметам и кредитам.',
        },
      ],
      docs: [
        {
          title: 'Дубликат студенческого билета',
          description: 'Запрос нового билета в случае утери.',
        },
        {
          title: 'Копия приложения к диплому',
          description: 'Официальный запрос копии приложения к диплому из архива.',
        },
        {
          title: 'Письмо-подтверждение об обучении',
          description: 'Официальное письмо для места работы или других организаций.',
        },
      ],
      finance: [
        {
          title: 'Состояние контрактной задолженности',
          description: 'Просмотр текущего состояния и сроков по оплатам.',
        },
        {
          title: 'Скачать платёжную квитанцию',
          description: 'Официальная квитанция по оплаченным суммам.',
        },
        {
          title: 'Расчёт стипендии',
          description: 'Проверка размера стипендии и периодов выплат.',
        },
      ],
      research: [
        {
          title: 'Назначение научного руководителя',
          description: 'Услуга выбора руководителя для выпускной или научной работы.',
        },
        {
          title: 'Подача статьи',
          description: 'Окно подачи статьи для конференции и журнала.',
        },
        {
          title: 'Отчёт о научной деятельности',
          description: 'Сдача отчёта по публикациям и участиям.',
        },
      ],
      academic: [
        {
          title: 'Выбор предметов и регистрация',
          description: 'Выбор и подтверждение предметов на семестр.',
        },
        {
          title: 'Заявление на пересдачу (retake)',
          description: 'Запись на повторное изучение неосвоенных предметов.',
        },
        {
          title: 'Получение расписания',
          description: 'Недельное расписание занятий и список аудиторий.',
        },
      ],
    },
  },
  info: {
    download: 'Скачать',
    cards: [
      {
        title: 'Порядок перевода',
        details: [
          'Заявления обычно принимаются в период летнего приёма.',
          'Студент заполняет электронное заявление в личном кабинете и прикрепляет документы.',
          'При академической разнице факультет устанавливает индивидуальный учебный план.',
          'В итоге результат перевода объявляется по решению приёмной комиссии.',
        ],
      },
      {
        title: 'Приём в магистратуру',
        details: [
          'Абитуриент выбирает направление специальности и регистрируется онлайн.',
          'Требуемые документы: диплом, транскрипт, копия паспорта и фото.',
          'После объявления расписания вступительных испытаний и собеседования результаты видны в кабинете.',
          'Для принятых процессы контракта и приказов автоматизированы.',
        ],
      },
      {
        title: 'Приём на второе образование',
        details: [
          'Кандидат подаёт заявление с имеющимися документами о высшем образовании.',
          'Сумма контракта определяется в зависимости от формы и направления обучения.',
          'Перезачёт предметов проводится по согласованию с кафедрой.',
          'После утверждения в личном кабинете открываются расписание и задания.',
        ],
      },
    ],
  },
  appeals: {
    staffTitle: 'Обращения',
    staffSubtitle: 'Просматривайте обращения студентов и обновляйте их статус.',
    studentTitle: 'Мои обращения',
    studentSubtitle: 'Отправьте новое обращение или отслеживайте его статус.',
    total: 'Всего',
    new: 'Новые',
    inProgress: 'В процессе',
    resolved: 'Решено',
    filterAll: 'Все',
    filterGeneral: 'Общие обращения',
    filterOnsite: 'Решаемые на месте',
    catGeneral: 'Общее обращение',
    catOnsite: 'Решаемое на месте',
    take: 'Взять в работу',
    markResolved: 'Решено',
    newAppeal: 'Новое обращение',
    topic: 'Тема',
    topicPlaceholder: 'Тема обращения',
    type: 'Тип',
    text: 'Текст',
    textPlaceholder: 'Опишите суть обращения',
    send: 'Отправить',
    sent: 'Ваше обращение принято.',
    empty: 'Пока у вас нет обращений.',
  },
  staff: {
    title: 'Добавить сотрудника',
    subtitle: 'Добавьте нового сотрудника и управляйте списком сотрудников.',
    newStaff: 'Новый сотрудник',
    name: 'Ф.И.О.',
    namePlaceholder: 'Имя и фамилия',
    position: 'Должность',
    positionPlaceholder: 'Например: Регистратор',
    department: 'Отдел',
    departmentPlaceholder: 'Название отдела',
    phone: 'Телефон',
    add: 'Добавить',
    added: 'Сотрудник добавлен.',
    colId: 'ID',
    colPhone: 'Телефон',
  },
  statistics: {
    title: 'Статистика',
    subtitle: 'Общие показатели и динамика по платформе.',
    totalAppeals: 'Всего обращений',
    newAppeals: 'Новые обращения',
    resolved: 'Решено',
    staffCount: 'Сотрудники',
    monthlyTitle: 'Динамика обращений по месяцам',
    typesTitle: 'Типы обращений',
    months: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'],
    general: 'Общие обращения',
    onsite: 'Решаемые на месте',
  },
  grant: {
    title: 'Образовательный грант',
    subtitle: 'Распределение и состояние мест государственного гранта.',
    badge: 'Грант',
    statusTitle: 'Ваш статус по гранту',
    statusText:
      'В текущем семестре вы учитесь на основе государственного гранта. Статус обновится после объявления рейтинговых результатов на следующий семестр.',
    totalSeats: 'Всего грантовых мест',
    used: 'Занято',
    free: 'Свободные места',
    byFaculty: 'В разрезе факультетов',
    colFaculty: 'Факультет',
    colTotal: 'Всего',
    colUsed: 'Занято',
    colFree: 'Свободно',
    colFill: 'Заполненность',
    faculties: [
      'Факультет английского языка',
      'Романо-германский факультет',
      'Факультет восточных языков',
      'Переводческий факультет',
    ],
  },
}

const en: Messages = {
  brand: {
    office: 'Registrar Office',
    gateway: 'Digital identity',
    uniLine1: 'Uzbekistan State',
    uniLine2: 'World Languages University',
  },
  header: {
    search: 'Search...',
    logout: 'Log out',
    theme: { light: 'Light', dark: 'Dark', system: 'System' },
  },
  roles: { staff: 'Staff', student: 'Student' },
  menu: {
    services: 'Quick services',
    appeals: 'Appeals',
    myAppeals: 'My appeals',
    addStaff: 'Add staff',
    statistics: 'Statistics',
    grant: 'Education grant',
    info: 'Info',
    settings: 'Settings',
  },
  login: {
    pill: 'Secure HEMIS & OneID',
    titlePrefix: 'Digital services for',
    rotating: ['students', 'faculty', 'registrar staff', 'researchers'],
    showcaseText:
      'A unified registrar platform delivering trusted, fast and secure academic services for the entire university community.',
    heading: 'Sign in to continue',
    subheading: 'Demo mode: sign in with username and password.',
    loginLabel: 'Username',
    passwordLabel: 'Password',
    loginPlaceholder: 'Enter username',
    passwordPlaceholder: 'Enter password',
    submit: 'Sign in',
    demoHint: 'Demo accounts:',
    orVia: 'or via system',
    soon: 'Coming soon',
    secured: 'Protected by government-grade encryption',
    methods: {
      staff: { title: 'HEMIS · Staff', description: 'Academic and registrar employees' },
      student: { title: 'HEMIS · Student', description: 'Undergraduate and graduate students' },
      oneid: { title: 'OneID', description: 'Government unified identity provider' },
    },
  },
  services: {
    title: 'Quick services',
    subtitle: 'Choose the section you need and launch the service quickly.',
    open: 'Open',
    tabs: {
      all: 'All services',
      docs: 'References',
      finance: 'Financial process',
      research: 'Research process',
      academic: 'Academic process',
    },
    items: {
      all: [
        {
          title: 'Certificate from place of study',
          description: 'Official certificate confirming student status.',
        },
        {
          title: 'Obtain payment contract',
          description: 'Download and verify the contract payment document.',
        },
        {
          title: 'Dormitory contract',
          description: 'Process the application for a dormitory placement contract.',
        },
        {
          title: 'Obtain rating booklet',
          description: 'Document showing academic performance by subject.',
        },
        {
          title: 'Academic leave application',
          description: 'Submit a request for academic leave for a semester or year.',
        },
        {
          title: 'Order a transcript',
          description: 'Obtain a transcript for all subjects and credits.',
        },
      ],
      docs: [
        {
          title: 'Student ID duplicate',
          description: 'Request a new ID card in case of loss.',
        },
        {
          title: 'Diploma supplement copy',
          description: 'Official request for a copy of the diploma supplement from the archive.',
        },
        {
          title: 'Study confirmation letter',
          description: 'Official letter for a workplace or other organizations.',
        },
      ],
      finance: [
        {
          title: 'Contract debt status',
          description: 'View current status and deadlines for payments.',
        },
        {
          title: 'Download payment receipt',
          description: 'Official receipt for paid amounts.',
        },
        {
          title: 'Scholarship calculation',
          description: 'Check scholarship amount and payment periods.',
        },
      ],
      research: [
        {
          title: 'Assign a research advisor',
          description: 'Service for choosing an advisor for thesis or research work.',
        },
        {
          title: 'Submit an article',
          description: 'Submission window for conference and journal articles.',
        },
        {
          title: 'Research activity report',
          description: 'Submit a report on publications and participations.',
        },
      ],
      academic: [
        {
          title: 'Course selection and registration',
          description: 'Select and confirm courses for the semester.',
        },
        {
          title: 'Retake application',
          description: 'Enroll to retake failed subjects.',
        },
        {
          title: 'Get class schedule',
          description: 'Weekly class schedule and list of classrooms.',
        },
      ],
    },
  },
  info: {
    download: 'Download',
    cards: [
      {
        title: 'Transfer procedure',
        details: [
          'Applications are usually accepted during the summer admission window.',
          'The student fills out an electronic application in the personal cabinet and attaches documents.',
          'If there is an academic difference, the faculty sets an individual study plan.',
          'Finally, the transfer result is announced based on the admission committee decision.',
        ],
      },
      {
        title: "Master's admission",
        details: [
          'The applicant selects a specialty direction and registers online.',
          'Required documents: diploma, transcript, passport copy and photo.',
          'After the entrance exams and interview schedule are announced, results appear in the cabinet.',
          'For admitted students, contract and order processes are automated.',
        ],
      },
      {
        title: 'Second education admission',
        details: [
          'The candidate submits an application with existing higher education documents.',
          'The contract amount is determined based on the form and direction of study.',
          'Subject re-crediting is carried out in agreement with the department.',
          'After approval, the schedule and assignments open in the personal cabinet.',
        ],
      },
    ],
  },
  appeals: {
    staffTitle: 'Appeals',
    staffSubtitle: 'Review student appeals and update their status.',
    studentTitle: 'My appeals',
    studentSubtitle: 'Submit a new appeal or track its status.',
    total: 'Total',
    new: 'New',
    inProgress: 'In progress',
    resolved: 'Resolved',
    filterAll: 'All',
    filterGeneral: 'General appeals',
    filterOnsite: 'Resolved on-site',
    catGeneral: 'General appeal',
    catOnsite: 'Resolved on-site',
    take: 'Take in progress',
    markResolved: 'Resolved',
    newAppeal: 'New appeal',
    topic: 'Topic',
    topicPlaceholder: 'Appeal topic',
    type: 'Type',
    text: 'Text',
    textPlaceholder: 'Describe the appeal content',
    send: 'Send',
    sent: 'Your appeal has been received.',
    empty: 'You have no appeals yet.',
  },
  staff: {
    title: 'Add staff',
    subtitle: 'Add a new employee and manage the staff list.',
    newStaff: 'New employee',
    name: 'Full name',
    namePlaceholder: 'First and last name',
    position: 'Position',
    positionPlaceholder: 'e.g. Registrar',
    department: 'Department',
    departmentPlaceholder: 'Department name',
    phone: 'Phone',
    add: 'Add',
    added: 'Employee added.',
    colId: 'ID',
    colPhone: 'Phone',
  },
  statistics: {
    title: 'Statistics',
    subtitle: 'Overall indicators and dynamics across the platform.',
    totalAppeals: 'Total appeals',
    newAppeals: 'New appeals',
    resolved: 'Resolved',
    staffCount: 'Staff',
    monthlyTitle: 'Monthly appeals dynamics',
    typesTitle: 'Appeal types',
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    general: 'General appeals',
    onsite: 'Resolved on-site',
  },
  grant: {
    title: 'Education grant',
    subtitle: 'Distribution and status of state grant seats.',
    badge: 'Grant',
    statusTitle: 'Your grant status',
    statusText:
      'This semester you are studying on a state grant. The status will be updated once the rating results for the next semester are announced.',
    totalSeats: 'Total grant seats',
    used: 'Occupied',
    free: 'Free seats',
    byFaculty: 'By faculty',
    colFaculty: 'Faculty',
    colTotal: 'Total',
    colUsed: 'Used',
    colFree: 'Free',
    colFill: 'Fill rate',
    faculties: [
      'Faculty of English Language',
      'Romano-Germanic Faculty',
      'Faculty of Oriental Languages',
      'Translation Faculty',
    ],
  },
}

export const messages: Record<Locale, Messages> = { UZ: uz, RU: ru, EN: en }
