// bespoke homepage sections and city choices for each non-English locale in lib/locales.js.
// evaluated at build time only so localized copy never enters the client script bundle

export const HOME_LOCALES = {
  ja: {
    exampleSlug: 'examples/japanese',
    configuredLocale: 'ja',
    setupNote: '起動時に一度設定すれば、すべての .text と .format() に反映（未指定ならブラウザの言語）',
    title: '日本語の暦と表記の落とし穴まで、追加ロケールなしで対応',
    lede: '改元初年の「令和元年」が「令和1年」になってしまう不具合や、深夜をまたぐシフトで日付や不要な「分」が混ざる問題も、一度の設定（またはブラウザの言語）だけでブラウザ標準の Intl と Temporal が解決します。追加ロケールは 0 kB です。',
    linkLabel: '日本語のインタラクティブ例を開く',
    proofs: [
      {
        label: 'ゼロ埋めしない年月日と曜日',
        note: '毎回ロケールを渡さなくても、自然な日本語の日付と曜日を出力します。',
        code: "date('2026-05-01').format('full')",
        run: ({ date }) => date('2026-05-01').format('full'),
      },
      {
        label: '深夜をまたぐ時間帯の波ダッシュ',
        note: '日またぎの時刻範囲も .text だけで「～」連結になり、不要な日付が混ざりません。',
        code: "timeRange('22:00', '06:00').text",
        run: ({ timeRange }) => timeRange('22:00', '06:00').text,
      },
      {
        label: '見出し用の年月と日付の分離',
        note: 'カレンダー見出しには日を持たない YearMonth を使い、安全に「年・月」だけを表記します。',
        code: "yearMonth('2026-05').text",
        run: ({ yearMonth }) => yearMonth('2026-05').text,
      },
      {
        label: '和暦が必要な箇所だけタグを指定',
        note: '2019年5月1日は「令和1年」ではなく「令和元年」、前日の4月30日は「平成31年」になります。',
        code: "date('2019-05-01').format('long', 'ja-u-ca-japanese')",
        run: ({ date }) => date('2019-05-01').format('long', 'ja-u-ca-japanese'),
      },
    ],
    consoles: {
      day: {
        ask: '東京の <code>2026-09-01</code> 0時を ISO 文字列にすると何日？',
        miss: '1日ずれる',
        why: '東半球ではローカル0時を <code>toISOString()</code> に渡すと UTC の前日 15:00 に変換され、<code>2026-08-31</code> になります。<code>CalendarDate</code> は時刻もタイムゾーンも持たないため日付がずれません。',
      },
      clocks: {
        ask: 'ロンドン支社の夏時間開始前日、9時の1日後は何時？',
        miss: '1時間ずれる',
        why: '日本には夏時間がありませんが、ロンドンは3月最終日曜に1時間進みます。24時間を足すと現地で10時になりますが、<code>plus(1, \'day\')</code> なら翌朝9時のままです。',
      },
    },
    year: {
      fromZone: 'Europe/London',
      fromCity: 'ロンドン',
      toZone: 'Asia/Tokyo',
      toCity: '東京',
      lede: '日本には夏時間がありませんが、欧州や北米との定例会議は年に {changeCount} 回、時差が変わります。Temporal の IANA データベースにより、追加バンドル 0 バイトで正確な現地時刻を追跡できます。',
      caption: '{year}年のロンドン 9:30 の定例を東京時間で表示。冬時間の {dayCount} 日間は時差が {far} 時間から {near} 時間に広がり、開始が {time} に変わります。',
    },
  },

  'zh-CN': {
    exampleSlug: 'examples/chinese',
    configuredLocale: 'zh-CN',
    setupNote: '启动时配置一次，所有 .text 与 .format() 全局生效（省略则跟随浏览器语言）',
    title: '原生支持中文公历、农历、民国纪年与时段格式',
    lede: '一次配置（或直接使用浏览器默认语言），“上午/下午”前置、不补零的年月日与纪念日都在全局自动生效；需要农历干支或民国纪年时再按需传入日历标签，语言包体积为 0 kB。',
    linkLabel: '查看中文交互式示例',
    proofs: [
      {
        label: '不补零公历日期与固定纪念日',
        note: '无需在每次调用时重复传入 zh-CN，日期与 MonthDay 直接输出地道中文。',
        code: "date('2026-05-01').text + ' · ' + monthDay('05-01').format('long')",
        run: ({ date, monthDay }) => `${date('2026-05-01').text} · ${monthDay('05-01').format('long')}`,
      },
      {
        label: '时段词自动前置',
        note: '12 小时制下自动将“上午/下午”置于时刻之前，无需手写英文 AM/PM 模板。',
        code: "time('09:30').format({ hour: 'numeric', minute: '2-digit', hour12: true })",
        run: ({ time }) => time('09:30').format({ hour: 'numeric', minute: '2-digit', hour12: true }),
      },
      {
        label: '传统农历与干支纪年',
        note: '仅在切换历法时传入日历标签，春节正月初一与干支年自动对齐。',
        code: "date('2026-02-17').format('long', 'zh-CN-u-ca-chinese')",
        run: ({ date }) => date('2026-02-17').format('long', 'zh-CN-u-ca-chinese'),
      },
      {
        label: '民国纪年换算',
        note: '同一日期在台湾地区日历下自动换算为民国纪年。',
        code: "date('2026-05-01').format('long', 'zh-TW-u-ca-roc')",
        run: ({ date }) => date('2026-05-01').format('long', 'zh-TW-u-ca-roc'),
      },
    ],
    consoles: {
      day: {
        ask: '北京时间 <code>2026-09-01</code> 零点转成 ISO 日期是哪一天？',
        miss: '早了一天',
        why: '在东八区将本地零点调用 <code>toISOString()</code> 会回退到 UTC 前一天 16:00，截出 <code>2026-08-31</code>。<code>CalendarDate</code> 只表示日历日期，绝不会因时区偏移而跨天。',
      },
      clocks: {
        ask: '伦敦夏令时切换前一天上午 9 点，加一天后是几点？',
        miss: '晚了一小时',
        why: '中国不实行夏令时，但欧美团队每年切换两次时钟。直接加 24 小时会在切换日变成 10 点，而 <code>plus(1, \'day\')</code> 始终保持当地时间 9 点。',
      },
    },
    year: {
      fromZone: 'Europe/London',
      fromCity: '伦敦',
      toZone: 'Asia/Shanghai',
      toCity: '上海',
      lede: '中国全年固定 UTC+8，但与欧美团队协作时每年会遇到 {changeCount} 次夏令时切换。借助浏览器内置 IANA 时区库，无需打包任何时区数据即可自动换算。',
      caption: '{year} 年伦敦 9:30 例会换算为上海时间。在冬令时的 {dayCount} 天里，时差由 {far} 小时扩大到 {near} 小时，会议时间变为 {time}。',
    },
  },

  ko: {
    exampleSlug: 'examples/korean',
    configuredLocale: 'ko',
    setupNote: '시작할 때 한 번 설정하면 모든 .text와 .format()에 적용 (생략 시 브라우저 언어 사용)',
    title: '한국어 띄어쓰기와 날짜 범위 축약까지 기본 내장',
    lede: '한 번의 로케일 설정(또는 브라우저 기본 언어)만으로 년·월·일 뒤의 띄어쓰기, 양쪽 ‘일’을 유지하는 범위 표기, ‘오전/오후’ 위치까지 별도 로케일 파일 없이 0 kB로 처리합니다.',
    linkLabel: '한국어 대화형 예제 보기',
    proofs: [
      {
        label: '공통 연·월 생략과 양쪽 ‘일’ 유지',
        note: '매번 로케일을 넘기지 않아도 연도와 월을 한 번만 쓰면서 양쪽 날짜에 ‘일’을 남깁니다.',
        code: "dateRange('2026-05-01', '2026-05-05').format('long')",
        run: ({ dateRange }) => dateRange('2026-05-01', '2026-05-05').format('long'),
      },
      {
        label: '년·월·일 띄어쓰기와 요일',
        note: '중국어·일본어와 달리 한국어 어법에 맞춰 단위 뒤에 공백을 두고 요일을 이어 씁니다.',
        code: "date('2026-05-01').format('full')",
        run: ({ date }) => date('2026-05-01').format('full'),
      },
      {
        label: '오전·오후 선행 표기',
        note: '시각 앞에 ‘오전’과 ‘오후’를 자연스럽게 배치합니다.',
        code: "time('14:30').format({ hour: 'numeric', minute: '2-digit', hour12: true })",
        run: ({ time }) => time('14:30').format({ hour: 'numeric', minute: '2-digit', hour12: true }),
      },
      {
        label: '자정을 넘기는 근무 시간',
        note: '.text 하나만으로 야간 시간대가 불필요한 날짜 없이 물결표로 연결됩니다.',
        code: "timeRange('22:00', '06:00').text",
        run: ({ timeRange }) => timeRange('22:00', '06:00').text,
      },
    ],
    consoles: {
      day: {
        ask: '서울의 <code>2026-09-01</code> 자정을 ISO 문자열로 바꾸면 며칠일까요?',
        miss: '하루 밀림',
        why: '한국 표준시(UTC+9) 자정에 <code>toISOString()</code>을 호출하면 전날 15:00 UTC로 바뀌어 <code>2026-08-31</code>이 됩니다. <code>CalendarDate</code>는 시간대 변환 없이 날짜 자체를 보존합니다.',
      },
      clocks: {
        ask: '런던 서머타임 시작 전날 오전 9시에서 하루 뒤는 몇 시일까요?',
        miss: '1시간 오차',
        why: '한국은 서머타임을 쓰지 않지만 유럽·북미 지사와 일할 때는 시차가 바뀝니다. 24시간을 더하면 10시가 되지만 <code>plus(1, \'day\')</code>는 현지 오전 9시를 지킵니다.',
      },
    },
    year: {
      fromZone: 'Europe/London',
      fromCity: '런던',
      toZone: 'Asia/Seoul',
      toCity: '서울',
      lede: '한국은 서머타임이 없지만 유럽·북미와 협업할 때 일 년에 {changeCount}번 시차가 달라집니다. Temporal의 IANA 데이터베이스로 번들 추가 없이 정확히 계산합니다.',
      caption: '{year}년 런던 오전 9:30 회의를 서울 시간으로 변환한 결과입니다. 동절기 {dayCount}일 동안 시차가 {far}시간에서 {near}시간으로 벌어져 {time}에 열립니다.',
    },
  },

  ar: {
    exampleSlug: 'examples/arabic',
    configuredLocale: 'ar-EG',
    setupNote: 'اضبطه مرّة واحدة عند البدء ليسري على كل القيم والتنسيقات تلقائيًا (أو اتركه ليتبع لغة المتصفح)',
    title: 'دعم أصيل للمثنى والجموع الستة والأرقام العربية والتقويم الهجري',
    lede: 'بضبط الإعداد مرّة واحدة (أو تركه للغة المتصفح)، تعمل صيغة المثنى «يومان» والجموع الستة والأرقام العربية والنطاقات في كل مكان تلقائيًا، مع تمرير رمز إضافي فقط عند التحويل إلى التقويم الهجري أو لهجة أخرى بحجم إضافي 0 كيلوبايت.',
    linkLabel: 'جرّب مثال اللغة العربية المباشر',
    proofs: [
      {
        label: 'المثنى والجموع الستة في المدد',
        note: 'تُطبع القيمة ٢ بصيغة المثنى «يومان» دون رقم، مع تمييز جمع القلة (٣–١٠) والتمييز المنصوب (١١–٩٩).',
        code: "days(2).text + ' · ' + days(11).text",
        run: ({ days }) => `${days(2).text} · ${days(11).text}`,
      },
      {
        label: 'دمج النطاقات الزمنية من اليمين إلى اليسار',
        note: 'اختصار الشهر والسنة المشتركين في نطاق واحد متسق مع اتجاه الكتابة دون تكرار رمز اللغة.',
        code: "dateRange('2026-05-01', '2026-05-05').format('long')",
        run: ({ dateRange }) => dateRange('2026-05-01', '2026-05-05').format('long'),
      },
      {
        label: 'الأرقام المشرقية مقابل التخصيص المغاربي',
        note: 'يسري الإعداد الافتراضي تلقائيًا، مع إمكانية تمرير ar-MA عند الحاجة إلى الأرقام المغاربية و«ماي».',
        code: "date('2026-05-01').format('long') + ' · ' + date('2026-05-01').format('long', 'ar-MA')",
        run: ({ date }) => `${date('2026-05-01').format('long')} · ${date('2026-05-01').format('long', 'ar-MA')}`,
      },
      {
        label: 'تقويم أم القرى الهجري',
        note: 'عرض التاريخ الهجري الكامل بدقة عند تمرير علامة التقويم الإسلامية.',
        code: "date('2026-05-01').format('long', 'ar-SA-u-ca-islamic-umalqura')",
        run: ({ date }) => date('2026-05-01').format('long', 'ar-SA-u-ca-islamic-umalqura'),
      },
    ],
    consoles: {
      day: {
        ask: 'ما هو ناتج تحويل منتصف ليل <code>2026-09-01</code> بتوقيت القاهرة إلى ISO؟',
        miss: 'متأخر بيوم',
        why: 'عند استدعاء <code>toISOString()</code> لمنتصف الليل المحلي في القاهرة (UTC+3 صيفًا) يعود التاريخ إلى 21:00 UTC من اليوم السابق فيصبح <code>2026-08-31</code>. نوع <code>CalendarDate</code> يحفظ اليوم التقويمي دون إزاحة.',
      },
      clocks: {
        ask: 'ما الساعة بعد يوم واحد من 9 صباحًا عشية التوقيت الصيفي في القاهرة؟',
        miss: 'متأخر بساعة',
        why: 'تبدأ مصر التوقيت الصيفي في الجمعة الأخيرة من أبريل فيصبح اليوم ٢٣ ساعة. إضافة ٢٤ ساعة تقفز بالساعة إلى ١٠ صباحًا، بينما تحافظ <code>plus(1, \'day\')</code> على ٩ صباحًا.',
      },
    },
    year: {
      fromZone: 'Europe/London',
      fromCity: 'لندن',
      toZone: 'Africa/Cairo',
      toCity: 'القاهرة',
      lede: 'تُغيّر لندن والقاهرة التوقيت الصيفي في عطلات نهاية أسبوع مختلفة، فيتبدّل الفارق الزمني {changeCount} مرات في السنة دون بايت واحد إضافي في حزمتك.',
      caption: 'اجتماع 9:30 صباحًا بتوقيت لندن محوّلًا إلى توقيت القاهرة خلال عام {year}. لمدة {dayCount} يومًا يتقلّص الفارق من {far} إلى {near} ساعة لينتقل الموعد إلى {time}.',
    },
  },

  ru: {
    exampleSlug: 'examples/russian',
    configuredLocale: 'ru',
    setupNote: 'Один вызов при запуске, и все .text и .format() форматируют по-русски (без вызова берётся язык браузера)',
    title: 'Падежи месяцев и русское склонение числительных без локаль-пакетов',
    lede: 'Достаточно один раз указать локаль (или положиться на язык браузера), и именительный падеж в заголовках («май 2026 г.»), родительный в датах («1 мая 2026 г.») и склонение числительных работают в каждом .text за 0 кБ.',
    linkLabel: 'Открыть интерактивный пример для русского языка',
    proofs: [
      {
        label: 'Именительный падеж в заголовке и родительный в дате',
        note: 'Даже обычное свойство .text выводит «май» у YearMonth и склоняет месяц в «1 мая» у CalendarDate.',
        code: "yearMonth('2026-05').text + ' · ' + date('2026-05-01').text",
        run: ({ date, yearMonth }) => `${yearMonth('2026-05').text} · ${date('2026-05-01').text}`,
      },
      {
        label: 'Склонение числительных (1, 2, 5, 11, 21)',
        note: 'Точный выбор между «день», «дня» и «дней», включая 11–14 и возврат к единственному числу на 21.',
        code: "[1, 2, 5, 11, 21].map((n) => days(n).text).join(' · ')",
        run: ({ days }) => [1, 2, 5, 11, 21].map((n) => days(n).text).join(' · '),
      },
      {
        label: 'Схлопывание диапазона дат',
        note: 'Общий месяц в родительном падеже и «г.» выводятся один раз в конце диапазона.',
        code: "dateRange('2026-05-01', '2026-05-05').text",
        run: ({ dateRange }) => dateRange('2026-05-01', '2026-05-05').text,
      },
      {
        label: 'Ночная смена через полночь',
        note: 'Диапазон времени через 00:00 форматируется без подстановки лишних дат.',
        code: "timeRange('22:00', '06:00').text",
        run: ({ timeRange }) => timeRange('22:00', '06:00').text,
      },
    ],
    consoles: {
      day: {
        ask: 'Какой день вернёт ISO-строка для полуночи <code>2026-09-01</code> в Москве?',
        miss: 'на день раньше',
        why: 'Полуночь в Москве (UTC+3) при вызове <code>toISOString()</code> превращается в 21:00 предыдущего дня по UTC и даёт <code>2026-08-31</code>. <code>CalendarDate</code> хранит саму дату без смещения часового пояса.',
      },
      clocks: {
        ask: 'Который час будет через сутки после 9:00 накануне перехода Лондона на летнее время?',
        miss: 'на час позже',
        why: 'В России нет сезонного перевода стрелок, но в Лондоне в последнее воскресенье марта сутки длятся 23 часа. Прибавление 24 часов сдвинет встречу на 10:00, а <code>plus(1, \'day\')</code> сохранит 9:00.',
      },
    },
    year: {
      fromZone: 'Europe/London',
      fromCity: 'Лондон',
      toZone: 'Europe/Moscow',
      toCity: 'Москва',
      lede: 'В Москве часы не переводят, а в Европе и США переводят дважды в год, поэтому разница во времени меняется {changeCount} раза в год. База IANA в Temporal учитывает это бесплатно и без лишних байтов.',
      caption: 'Ежедневный созвон в 9:30 по Лондону в московском времени за {year} год. На протяжении {dayCount} дней зимнего времени разница увеличивается с {far} до {near} ч, сдвигая встречу на {time}.',
    },
  },

  es: {
    exampleSlug: 'examples/spanish',
    configuredLocale: 'es',
    setupNote: 'Configúralo una vez al iniciar y cada .text y .format() lo usará en toda la app (o déjalo vacío para el idioma del navegador)',
    title: 'Meses en minúscula, conectores «de» y rangos naturales con una sola línea',
    lede: 'Las plantillas pensadas para inglés suelen escribir «Mayo 1, 2026» con mayúscula indebida o repetir el mes completo en los rangos. Configura el idioma una sola vez (o usa el del navegador) y toda la gramática española funciona en 0 kB extra.',
    linkLabel: 'Ver el ejemplo interactivo en español',
    proofs: [
      {
        label: 'Rangos contraídos con conectores «de»',
        note: 'Agrupa los días iniciales y conserva «de mayo de 2026» en minúscula sin repetir el locale en cada llamada.',
        code: "dateRange('2026-05-01', '2026-05-05').format('long')",
        run: ({ dateRange }) => dateRange('2026-05-01', '2026-05-05').format('long'),
      },
      {
        label: 'Días y meses en minúscula',
        note: 'En español los días de la semana y los meses no llevan mayúscula inicial a mitad de frase.',
        code: "date('2026-05-01').format('full')",
        run: ({ date }) => date('2026-05-01').format('full'),
      },
      {
        label: 'Encabezado mensual frente a fecha completa',
        note: 'YearMonth produce «mayo de 2026» para cabeceras sin inventar un día.',
        code: "yearMonth('2026-05').format('long')",
        run: ({ yearMonth }) => yearMonth('2026-05').format('long'),
      },
      {
        label: 'Rangos que cruzan de mes',
        note: 'Cuando el rango cambia de mes, conserva «de» en ambos extremos y el año una sola vez.',
        code: "dateRange('2026-05-29', '2026-06-02').format('long')",
        run: ({ dateRange }) => dateRange('2026-05-29', '2026-06-02').format('long'),
      },
    ],
    consoles: {
      day: {
        ask: '¿Qué día es <code>2026-09-01</code> en Ciudad de México?',
        miss: 'un día antes',
        why: '<code>Date</code> interpreta las cadenas ISO de solo fecha como medianoche UTC, que son las 18:00 del 31 de agosto en Ciudad de México. <code>CalendarDate</code> no tiene zona horaria que pueda desplazar el día.',
      },
      clocks: {
        ask: '¿Qué hora es un día después de las 9:00 del 28 de marzo en Madrid?',
        miss: 'una hora tarde',
        why: 'Esa noche España adelanta el reloj y el domingo dura 23 horas. Sumar 24 horas mueve la cita a las 10:00, mientras que <code>plus(1, \'day\')</code> mantiene las 9:00.',
      },
    },
    year: {
      fromZone: 'America/Mexico_City',
      fromCity: 'Ciudad de México',
      toZone: 'Europe/Madrid',
      toCity: 'Madrid',
      lede: 'Ciudad de México abolió el horario de verano en 2022 mientras España sigue cambiando el reloj, moviendo la diferencia horaria {changeCount} veces al año sin añadir un solo byte a tu bundle.',
      caption: 'Una reunión diaria a las 9:30 en Ciudad de México vista en Madrid durante {year}. Durante {dayCount} días, la diferencia pasa de {far} a {near} horas y cambia la hora local a las {time}.',
    },
  },

  'pt-BR': {
    exampleSlug: 'examples/portuguese',
    configuredLocale: 'pt-BR',
    setupNote: 'Configure uma vez ao iniciar e todo .text e .format() seguirá o idioma (ou omita para usar o do navegador)',
    title: 'Crase em «às 09:30», meses em minúscula e intervalos naturais em português',
    lede: 'Bibliotecas centradas no inglês costumam capitalizar «Maio» ou esquecer a crase antes do horário. Defina o idioma uma única vez (ou use o do navegador) e todas as chamadas entregam a grafia correta do português com 0 kB de pacotes extras.',
    linkLabel: 'Abrir o exemplo interativo em português',
    proofs: [
      {
        label: 'Crase antes do horário e dias com hífen',
        note: 'Une data e hora com «às» e preserva «sexta-feira» e «maio» em minúsculas sem repetir pt-BR.',
        code: "datetime('2026-05-01T09:30', 'America/Sao_Paulo').format('full')",
        run: ({ datetime }) => datetime('2026-05-01T09:30', 'America/Sao_Paulo').format('full'),
      },
      {
        label: 'Intervalo de datas enxuto',
        note: 'Agrupa os dias no início e mantém «de maio de 2026» apenas uma vez.',
        code: "dateRange('2026-05-01', '2026-05-05').format('long')",
        run: ({ dateRange }) => dateRange('2026-05-01', '2026-05-05').format('long'),
      },
      {
        label: 'Cabeçalho de mês sem dia artificial',
        note: 'YearMonth formata «maio de 2026» diretamente para faturas, filtros e calendários.',
        code: "yearMonth('2026-05').format('long')",
        run: ({ yearMonth }) => yearMonth('2026-05').format('long'),
      },
      {
        label: 'Durações flexionadas no plural',
        note: 'Formata durações compostas em português sem concatenar strings manualmente.',
        code: "duration({ days: 2, hours: 1 }).format('long')",
        run: ({ duration }) => duration({ days: 2, hours: 1 }).format('long'),
      },
    ],
    consoles: {
      day: {
        ask: 'Que dia é <code>2026-09-01</code> em São Paulo?',
        miss: 'um dia antes',
        why: '<code>Date</code> lê strings ISO de data como meia-noite UTC, o que cai às 21h de 31 de agosto em São Paulo (UTC-3). <code>CalendarDate</code> representa o dia civil sem fuso para deslocá-lo.',
      },
      clocks: {
        ask: 'Que horas são um dia após as 9h na véspera do horário de verão em Lisboa?',
        miss: 'uma hora a mais',
        why: 'O Brasil não tem mais horário de verão, mas Portugal adianta o relógio no último domingo de março. Somar 24 horas muda a reunião para 10h; <code>plus(1, \'day\')</code> mantém 9h.',
      },
    },
    year: {
      fromZone: 'America/Sao_Paulo',
      fromCity: 'São Paulo',
      toZone: 'Europe/Lisbon',
      toCity: 'Lisboa',
      lede: 'O Brasil encerrou o horário de verão, mas Portugal e o resto da Europa mudam o relógio {changeCount} vezes por ano. A base IANA do Temporal calcula cada virada com zero bytes extras no bundle.',
      caption: 'Uma daily às 9:30 em São Paulo convertida para o horário de Lisboa ao longo de {year}. Por {dayCount} dias, a diferença muda de {far} para {near} horas, levando a reunião para {time}.',
    },
  },

  fr: {
    exampleSlug: 'examples/french',
    configuredLocale: 'fr',
    setupNote: 'Configurez-le une fois au démarrage : chaque .text et .format() suit partout (ou omettez-le pour la langue du navigateur)',
    title: 'Mois en minuscules, plages abrégées et variantes francophones sans fichiers de langue',
    lede: 'Une seule configuration au démarrage (ou la langue du navigateur) suffit pour écrire les jours et les mois en minuscules sans virgule et fusionner les plages, tout en permettant de passer « fr-CA » ponctuellement pour 0 ko supplémentaire.',
    linkLabel: 'Ouvrir l’exemple interactif en français',
    proofs: [
      {
        label: 'Jour et mois en minuscules, sans virgule',
        note: 'Respecte la typographie française (« vendredi 1 mai 2026 ») sans repasser la locale à chaque appel.',
        code: "date('2026-05-01').format('full')",
        run: ({ date }) => date('2026-05-01').format('full'),
      },
      {
        label: 'Fusion des plages de dates',
        note: 'La propriété .text évite déjà de répéter le mois et l’année lorsque les deux bornes tombent le même mois.',
        code: "dateRange('2026-05-01', '2026-05-05').text",
        run: ({ dateRange }) => dateRange('2026-05-01', '2026-05-05').text,
      },
      {
        label: 'En-tête de mois dédié',
        note: 'YearMonth affiche « mai 2026 » directement via .text sans bricoler le premier jour du mois.',
        code: "yearMonth('2026-05').text",
        run: ({ yearMonth }) => yearMonth('2026-05').text,
      },
      {
        label: 'Variante ponctuelle pour le Québec',
        note: 'Passez une locale uniquement pour changer de région : de « à 09:30 » en France à « à 09 h 30 » au Québec.',
        code: "datetime('2026-05-01T09:30', 'America/Montreal').format('long', 'fr-CA')",
        run: ({ datetime }) => datetime('2026-05-01T09:30', 'America/Montreal').format('long', 'fr-CA'),
      },
    ],
    consoles: {
      day: {
        ask: 'Quel jour donne <code>toISOString()</code> pour minuit le <code>2026-09-01</code> à Paris ?',
        miss: 'un jour trop tôt',
        why: 'À Paris (UTC+2 en été), minuit local correspond à 22:00 la veille en UTC, donc <code>toISOString()</code> renvoie <code>2026-08-31</code>. <code>CalendarDate</code> garde la date civile intacte.',
      },
      clocks: {
        ask: 'Quelle heure est-il un jour après 9 h la veille du passage à l’heure d’été à Paris ?',
        miss: 'une heure trop tard',
        why: 'Dans la nuit du dernier dimanche de mars, la journée ne dure que 23 heures en France. Ajouter 24 heures décale le rendez-vous à 10 h, alors que <code>plus(1, \'day\')</code> garde 9 h.',
      },
    },
    year: {
      fromZone: 'America/New_York',
      fromCity: 'New York',
      toZone: 'Europe/Paris',
      toCity: 'Paris',
      lede: 'New York et Paris changent d’heure avec trois semaines d’écart au printemps et une semaine à l’automne, modifiant leur décalage {changeCount} fois par an. Temporal le gère nativement avec zéro octet ajouté.',
      caption: 'Un point quotidien à 9 h 30 à New York lu à l’heure de Paris sur l’année {year}. Pendant {dayCount} jours, l’écart passe de {far} h à {near} h et déplace la réunion à {time}.',
    },
  },
};
