// bespoke homepage sections and city choices for each non-English locale in lib/locales.js.
// evaluated at build time only so localized copy never enters the client script bundle

export const HOME_LOCALES = {
  ja: {
    exampleSlug: 'examples/japanese',
    title: '日本語の暦と表記の落とし穴まで、追加ロケールなしで対応',
    lede: '改元初年の「令和元年」が「令和1年」になってしまう不具合や、深夜をまたぐシフトで日付や不要な「分」が混ざる問題など、日本語特有の罠をブラウザ標準の Intl と Temporal でそのまま解決します。ロケール用の追加バンドルは 0 kB です。',
    linkLabel: '日本語のインタラクティブ例を開く',
    proofs: [
      {
        label: '改元初年の「元年」表記',
        note: '2019年5月1日は「令和1年」ではなく「令和元年」、前日の4月30日は「平成31年」になります。',
        code: "date('2019-05-01').format('long', 'ja-u-ca-japanese')",
        run: ({ date }) => date('2019-05-01').format('long', 'ja-u-ca-japanese'),
      },
      {
        label: 'ゼロ埋めしない年月日と曜日',
        note: '英語風のスペースや不要なゼロ埋めを入れず、自然な日本語の日付と曜日を出力します。',
        code: "date('2026-05-01').format('full', 'ja')",
        run: ({ date }) => date('2026-05-01').format('full', 'ja'),
      },
      {
        label: '深夜をまたぐ時間帯の波ダッシュ',
        note: '日またぎの時刻範囲でも勝手に日付が挿入されず、ロケールの「～」で連結されます。',
        code: "timeRange('22:00', '06:00').format('short', 'ja')",
        run: ({ timeRange }) => timeRange('22:00', '06:00').format('short', 'ja'),
      },
      {
        label: '見出し用の年月と日付の分離',
        note: 'カレンダー見出しには日を持たない YearMonth を使い、安全に「年・月」だけを表記します。',
        code: "yearMonth('2026-05').format('long', 'ja')",
        run: ({ yearMonth }) => yearMonth('2026-05').format('long', 'ja'),
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
      fromZone: 'America/Los_Angeles',
      fromCity: 'サンフランシスコ',
      toZone: 'Asia/Tokyo',
      toCity: '東京',
      lede: '日本には夏時間がありませんが、北米や欧州との定例会議は年に{changes}時差が変わります。Temporal の IANA データベースにより、追加バンドル 0 バイトで正確な現地時刻を追跡できます。',
      caption: '{year}年のサンフランシスコ 9:30 の定例を東京時間で表示。夏時間の{days}は時差が {far} 時間から {near} 時間に縮まり、開始が {time} に変わります。',
    },
  },

  'zh-CN': {
    exampleSlug: 'examples/chinese',
    title: '原生支持中文公历、农历、民国纪年与时段格式',
    lede: '无论是“上午/下午”前置、不补零的年月日，还是农历干支月份与民国纪年转换，都不需要额外加载语言包。基于浏览器内置的 Intl 与 Temporal，0 kB 即可输出地道中文格式。',
    linkLabel: '查看中文交互式示例',
    proofs: [
      {
        label: '传统农历与干支纪年',
        note: '直接格式化为农历干支年与传统月份日期，春节正月初一等节点自动对齐。',
        code: "date('2026-02-17').format('long', 'zh-CN-u-ca-chinese')",
        run: ({ date }) => date('2026-02-17').format('long', 'zh-CN-u-ca-chinese'),
      },
      {
        label: '时段词前置与中文星期',
        note: '12 小时制下自动将“上午/下午”置于时刻之前，无需拼接英文 AM/PM 模板。',
        code: "time('09:30').format({ hour: 'numeric', minute: '2-digit', hour12: true }, 'zh-CN')",
        run: ({ time }) => time('09:30').format({ hour: 'numeric', minute: '2-digit', hour12: true }, 'zh-CN'),
      },
      {
        label: '民国纪年换算',
        note: '同一日期在台湾地区日历下自动换算为民国纪年。',
        code: "date('2026-05-01').format('long', 'zh-TW-u-ca-roc')",
        run: ({ date }) => date('2026-05-01').format('long', 'zh-TW-u-ca-roc'),
      },
      {
        label: '固定公历纪念日',
        note: 'MonthDay 始终保留公历月日，用于生日与固定节日时不会因其他历法而偏移。',
        code: "monthDay('05-01').format('long', 'zh-CN')",
        run: ({ monthDay }) => monthDay('05-01').format('long', 'zh-CN'),
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
      fromZone: 'America/Los_Angeles',
      fromCity: '旧金山',
      toZone: 'Asia/Shanghai',
      toCity: '上海',
      lede: '中国全年固定 UTC+8，但与欧美团队协作时每年会遇到 {changes} 夏令时切换。借助浏览器内置 IANA 时区库，无需打包任何时区数据即可自动换算。',
      caption: '{year} 年旧金山 9:30 例会换算为上海时间。在夏令时的 {days}里，时差由 {far} 小时缩短为 {near} 小时，会议时间变为 {time}。',
    },
  },

  ko: {
    exampleSlug: 'examples/korean',
    title: '한국어 띄어쓰기와 날짜 범위 축약까지 기본 내장',
    lede: '년·월·일 뒤의 정확한 띄어쓰기, 같은 달 안에서 연·월을 생략하되 양쪽 날짜의 ‘일’은 모두 유지하는 범위 표기, ‘오전/오후’ 위치까지 별도 로케일 파일 없이 0 kB로 정확히 처리합니다.',
    linkLabel: '한국어 대화형 예제 보기',
    proofs: [
      {
        label: '공통 연·월 생략과 양쪽 ‘일’ 유지',
        note: '같은 달의 기간은 연도와 월을 한 번만 쓰면서 시작일과 종료일 모두에 ‘일’을 남깁니다.',
        code: "dateRange('2026-05-01', '2026-05-05').format('long', 'ko')",
        run: ({ dateRange }) => dateRange('2026-05-01', '2026-05-05').format('long', 'ko'),
      },
      {
        label: '년·월·일 띄어쓰기와 요일',
        note: '중국어·일본어와 달리 한국어 어법에 맞춰 단위 뒤에 공백을 두고 요일을 이어 씁니다.',
        code: "date('2026-05-01').format('full', 'ko')",
        run: ({ date }) => date('2026-05-01').format('full', 'ko'),
      },
      {
        label: '오전·오후 선행 표기',
        note: '시각 앞에 ‘오전’과 ‘오후’를 자연스럽게 배치합니다.',
        code: "time('14:30').format({ hour: 'numeric', minute: '2-digit', hour12: true }, 'ko')",
        run: ({ time }) => time('14:30').format({ hour: 'numeric', minute: '2-digit', hour12: true }, 'ko'),
      },
      {
        label: '자정을 넘기는 근무 시간',
        note: '야간 시간대도 불필요한 날짜 없이 물결표로 깔끔하게 연결됩니다.',
        code: "timeRange('22:00', '06:00').format('short', 'ko')",
        run: ({ timeRange }) => timeRange('22:00', '06:00').format('short', 'ko'),
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
      fromZone: 'America/Los_Angeles',
      fromCity: '샌프란시스코',
      toZone: 'Asia/Seoul',
      toCity: '서울',
      lede: '한국은 서머타임이 없지만 북미·유럽과 협업할 때 일 년에 {changes} 시차가 달라집니다. Temporal의 IANA 데이터베이스로 번들 추가 없이 정확히 계산합니다.',
      caption: '{year}년 샌프란시스코 오전 9:30 회의를 서울 시간으로 변환한 결과입니다. {days} 동안 시차가 {far}시간에서 {near}시간으로 줄어 {time}에 열립니다.',
    },
  },

  ar: {
    exampleSlug: 'examples/arabic',
    title: 'دعم أصيل للمثنى والجموع الستة والأرقام العربية والتقويم الهجري',
    lede: 'معظم مكتبات التواريخ تفشل في العربية عند صيغة المثنى «يومان» بلا رقم، أو التمييز بين «٥ أيام» و«١١ يومًا»، أو اختلاف الأرقام وأسماء الشهور بين المشرق والمغرب. يعتمد native-dates على Intl وTemporal مباشرةً بحجم إضافي 0 كيلوبايت.',
    linkLabel: 'جرّب مثال اللغة العربية المباشر',
    proofs: [
      {
        label: 'المثنى والجموع الستة في المدد',
        note: 'تُطبع القيمة ٢ بصيغة المثنى «يومان» دون رقم، مع تمييز جمع القلة (٣–١٠) والتمييز المنصوب (١١–٩٩).',
        code: "days(2).format('long', 'ar') + ' · ' + days(11).format('long', 'ar')",
        run: ({ days }) => `${days(2).format('long', 'ar')} · ${days(11).format('long', 'ar')}`,
      },
      {
        label: 'الأرقام المشرقية مقابل المغاربية وأسماء الشهور',
        note: 'تحترم كل منطقة نظام أرقامها واسم الشهر المتداول فيها مثل «مايو» في مصر و«ماي» في المغرب.',
        code: "date('2026-05-01').format('long', 'ar-EG') + ' · ' + date('2026-05-01').format('long', 'ar-MA')",
        run: ({ date }) => `${date('2026-05-01').format('long', 'ar-EG')} · ${date('2026-05-01').format('long', 'ar-MA')}`,
      },
      {
        label: 'تقويم أم القرى الهجري',
        note: 'عرض التاريخ الهجري الكامل بدقة مع بقاء MonthDay على الأشهر الميلادية للمناسبات السنوية الثابتة.',
        code: "date('2026-05-01').format('long', 'ar-SA-u-ca-islamic-umalqura')",
        run: ({ date }) => date('2026-05-01').format('long', 'ar-SA-u-ca-islamic-umalqura'),
      },
      {
        label: 'دمج النطاقات الزمنية من اليمين إلى اليسار',
        note: 'اختصار الشهر والسنة المشتركين في نطاق واحد متسق مع اتجاه الكتابة.',
        code: "dateRange('2026-05-01', '2026-05-05').format('long', 'ar-EG')",
        run: ({ dateRange }) => dateRange('2026-05-01', '2026-05-05').format('long', 'ar-EG'),
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
      lede: 'تُغيّر لندن والقاهرة التوقيت الصيفي في عطلات نهاية أسبوع مختلفة (مارس/أكتوبر مقابل أبريل/أكتوبر)، فيتبدّل الفارق الزمني {changes} في السنة دون بايت واحد إضافي في حزمتك.',
      caption: 'اجتماع 9:30 صباحًا بتوقيت لندن محوّلًا إلى توقيت القاهرة خلال عام {year}. لمدة {days} يتغيّر الفارق من {far} ساعات إلى {near} لينتقل الموعد إلى {time}.',
    },
  },

  ru: {
    exampleSlug: 'examples/russian',
    title: 'Падежи месяцев и русское склонение числительных без локаль-пакетов',
    lede: 'В русском языке месяц в заголовке календаря («май 2026 г.») и внутри даты («1 мая 2026 г.») стоит в разных падежах, а числительные требуют трёх форм множественного числа с исключением для 11–14. Раздельные типы YearMonth, CalendarDate и Duration решают это силами браузера за 0 кБ.',
    linkLabel: 'Открыть интерактивный пример для русского языка',
    proofs: [
      {
        label: 'Именительный падеж в заголовке и родительный в дате',
        note: 'YearMonth выводит «май», а CalendarDate автоматически склоняет месяц в «1 мая».',
        code: "yearMonth('2026-05').format('long', 'ru') + ' · ' + date('2026-05-01').format('long', 'ru')",
        run: ({ date, yearMonth }) => `${yearMonth('2026-05').format('long', 'ru')} · ${date('2026-05-01').format('long', 'ru')}`,
      },
      {
        label: 'Склонение числительных (1, 2, 5, 11, 21)',
        note: 'Точный выбор между «день», «дня» и «дней», включая 11–14 и возврат к единственному числу на 21.',
        code: "[1, 2, 5, 11, 21].map((n) => days(n).format('long', 'ru')).join(' · ')",
        run: ({ days }) => [1, 2, 5, 11, 21].map((n) => days(n).format('long', 'ru')).join(' · '),
      },
      {
        label: 'Схлопывание диапазона дат',
        note: 'Общий месяц в родительном падеже и «г.» выводятся один раз в конце диапазона.',
        code: "dateRange('2026-05-01', '2026-05-05').format('long', 'ru')",
        run: ({ dateRange }) => dateRange('2026-05-01', '2026-05-05').format('long', 'ru'),
      },
      {
        label: 'Ночная смена через полночь',
        note: 'Диапазон времени через 00:00 форматируется без подстановки лишних дат.',
        code: "timeRange('22:00', '06:00').format('short', 'ru')",
        run: ({ timeRange }) => timeRange('22:00', '06:00').format('short', 'ru'),
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
      lede: 'В Москве часы не переводят, а в Европе и США — дважды в год, поэтому разница во времени меняется {changes} в год. База IANA в Temporal учитывает это бесплатно и без лишних байтов.',
      caption: 'Ежедневный созвон в 9:30 по Лондону в московском времени за {year} год. На протяжении {days} разница сокращается с {far} до {near} ч, сдвигая встречу на {time}.',
    },
  },

  es: {
    exampleSlug: 'examples/spanish',
    title: 'Meses en minúscula, conectores «de» y fechas día/mes sin configuración extra',
    lede: 'Las plantillas pensadas para inglés suelen escribir «Mayo 1, 2026» con mayúscula indebida, repetir el mes completo en los rangos o interpretar 01/05/2026 como el 5 de enero. Con Intl y Temporal obtienes gramática española real y lectura día/mes en 0 kB de archivos de idioma.',
    linkLabel: 'Ver el ejemplo interactivo en español',
    proofs: [
      {
        label: 'Rangos contraídos con conectores «de»',
        note: 'Agrupa los días iniciales y conserva «de mayo de 2026» en minúscula una sola vez.',
        code: "dateRange('2026-05-01', '2026-05-05').format('long', 'es')",
        run: ({ dateRange }) => dateRange('2026-05-01', '2026-05-05').format('long', 'es'),
      },
      {
        label: 'Días y meses en minúscula',
        note: 'En español los días de la semana y los meses no llevan mayúscula inicial a mitad de frase.',
        code: "date('2026-05-01').format('full', 'es')",
        run: ({ date }) => date('2026-05-01').format('full', 'es'),
      },
      {
        label: 'Encabezado mensual frente a fecha completa',
        note: 'YearMonth produce «mayo de 2026» para cabeceras sin inventar un día.',
        code: "yearMonth('2026-05').format('long', 'es')",
        run: ({ yearMonth }) => yearMonth('2026-05').format('long', 'es'),
      },
      {
        label: 'Rangos que cruzan de mes',
        note: 'Cuando el rango cambia de mes, conserva «de» en ambos extremos y el año una sola vez.',
        code: "dateRange('2026-05-29', '2026-06-02').format('long', 'es')",
        run: ({ dateRange }) => dateRange('2026-05-29', '2026-06-02').format('long', 'es'),
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
      lede: 'Ciudad de México abolió el horario de verano en 2022 mientras España sigue cambiando el reloj dos veces al año, moviendo la diferencia horaria {changes} al año sin añadir un solo byte a tu bundle.',
      caption: 'Una reunión diaria a las 9:30 en Ciudad de México vista en Madrid durante {year}. Durante {days}, la diferencia pasa de {far} a {near} horas y cambia la hora local a las {time}.',
    },
  },

  'pt-BR': {
    exampleSlug: 'examples/portuguese',
    title: 'Crase em «às 09:30», meses em minúscula e intervalos naturais em português',
    lede: 'Bibliotecas centradas no inglês costumam capitalizar «Maio», esquecer a crase antes do horário ou ler 01/05/2026 como 5 de janeiro. O native-dates usa Intl e Temporal nativos do navegador para entregar a grafia correta do português sem pacotes extras de idioma.',
    linkLabel: 'Abrir o exemplo interativo em português',
    proofs: [
      {
        label: 'Crase antes do horário e dias com hífen',
        note: 'Une data e hora com «às» e preserva «sexta-feira» e «maio» em minúsculas.',
        code: "datetime('2026-05-01T09:30', 'America/Sao_Paulo').format('full', 'pt-BR')",
        run: ({ datetime }) => datetime('2026-05-01T09:30', 'America/Sao_Paulo').format('full', 'pt-BR'),
      },
      {
        label: 'Intervalo de datas enxuto',
        note: 'Agrupa os dias no início e mantém «de maio de 2026» apenas uma vez.',
        code: "dateRange('2026-05-01', '2026-05-05').format('long', 'pt-BR')",
        run: ({ dateRange }) => dateRange('2026-05-01', '2026-05-05').format('long', 'pt-BR'),
      },
      {
        label: 'Cabeçalho de mês sem dia artificial',
        note: 'YearMonth formata «maio de 2026» diretamente para faturas, filtros e calendários.',
        code: "yearMonth('2026-05').format('long', 'pt-BR')",
        run: ({ yearMonth }) => yearMonth('2026-05').format('long', 'pt-BR'),
      },
      {
        label: 'Durações flexionadas no plural',
        note: 'Formata durações compostas em português sem concatenar strings manualmente.',
        code: "duration({ days: 2, hours: 1 }).format('long', 'pt-BR')",
        run: ({ duration }) => duration({ days: 2, hours: 1 }).format('long', 'pt-BR'),
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
      lede: 'O Brasil encerrou o horário de verão, mas Portugal e o resto da Europa mudam o relógio {changes} por ano. A base IANA do Temporal calcula cada virada com zero bytes extras no bundle.',
      caption: 'Uma daily às 9:30 em São Paulo convertida para o horário de Lisboa ao longo de {year}. Por {days}, a diferença muda de {far} para {near} horas, levando a reunião para {time}.',
    },
  },

  fr: {
    exampleSlug: 'examples/french',
    title: 'Mois en minuscules, plages abrégées et variantes francophones sans fichiers de langue',
    lede: 'En français, les jours et les mois s’écrivent en minuscules sans virgule après le jour de la semaine, l’heure s’introduit par « à » (« 09:30 » à Paris, « 09 h 30 » à Montréal) et les plages fusionnent le mois commun. Tout fonctionne nativement via Intl et Temporal pour 0 ko supplémentaire.',
    linkLabel: 'Ouvrir l’exemple interactif en français',
    proofs: [
      {
        label: 'Jour et mois en minuscules, sans virgule',
        note: 'Respecte la typographie française (« vendredi 1 mai 2026 » et non « Vendredi, Mai 1 »).',
        code: "date('2026-05-01').format('full', 'fr')",
        run: ({ date }) => date('2026-05-01').format('full', 'fr'),
      },
      {
        label: 'Variantes horaires entre la France et le Québec',
        note: 'Passe automatiquement de « à 09:30 » en France à « à 09 h 30 » au Québec.',
        code: "datetime('2026-05-01T09:30', 'America/Montreal').format('long', 'fr-CA')",
        run: ({ datetime }) => datetime('2026-05-01T09:30', 'America/Montreal').format('long', 'fr-CA'),
      },
      {
        label: 'Fusion des plages de dates',
        note: 'Évite de répéter le mois et l’année lorsque les deux bornes tombent le même mois.',
        code: "dateRange('2026-05-01', '2026-05-05').format('long', 'fr')",
        run: ({ dateRange }) => dateRange('2026-05-01', '2026-05-05').format('long', 'fr'),
      },
      {
        label: 'En-tête de mois dédié',
        note: 'YearMonth affiche « mai 2026 » sans bricoler le premier jour du mois.',
        code: "yearMonth('2026-05').format('long', 'fr')",
        run: ({ yearMonth }) => yearMonth('2026-05').format('long', 'fr'),
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
      lede: 'New York et Paris changent d’heure avec trois semaines d’écart au printemps et une semaine à l’automne, modifiant leur décalage {changes} par an. Temporal le gère nativement avec zéro octet ajouté.',
      caption: 'Un point quotidien à 9 h 30 à New York lu à l’heure de Paris sur l’année {year}. Pendant {days}, l’écart passe de {far} h à {near} h et déplace la réunion à {time}.',
    },
  },
};
