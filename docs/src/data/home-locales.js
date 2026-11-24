// localized homepage sections and city choices for each non-English locale in lib/locales.js,
// evaluated at build time so localized copy never enters the client script bundle. Sample dates
// use 2026-05-01 where single-digit month/day unpadding or genitive day 1 is shown, and 2026-05-15
// in French and Brazilian Portuguese where the 1st of a month uses 1er / 1º

export const HOME_LOCALES = {
  ja: {
    exampleSlug: 'examples/japanese',
    guideSlug: 'guides/japanese',
    guideLabel: '日本語の日付・時刻ガイドを読む',
    configuredLocale: 'ja',
    setupNote: 'アプリ起動時に一度設定（未指定ならブラウザの言語）、サーバーのリクエスト単位は <code>.locale(tag)</code>',
    title: '日本語の暦と表記の落とし穴まで、追加ロケールなしで対応',
    lede: '改元初年の「令和元年」が「令和1年」になってしまう不具合や、深夜をまたぐシフトに不要な日付が混ざる問題も、一度の設定（またはブラウザの言語）だけでブラウザ標準の Intl と Temporal が解決します。追加ロケールは 0 kB です。',
    linkLabel: '日本語のインタラクティブ例を開く',
    proofs: [
      {
        label: 'ゼロ埋めしない年月日と括弧付きの曜日',
        note: '毎回ロケールを渡さなくても、日本の画面で定番の「(金)」形式と年月日を出力します。',
        code: "date('2026-05-01').format('llll')",
        run: ({ date }) => date('2026-05-01').format('llll'),
      },
      {
        label: '深夜をまたぐ時間帯の波ダッシュ',
        note: '日またぎの時刻範囲も .text だけで「～」連結になり、不要な日付が混ざりません。',
        code: "timeRange('22:00', '06:00').text",
        run: ({ timeRange }) => timeRange('22:00', '06:00').text,
      },
      {
        label: '「一昨日・明後日」までの自然な相対日',
        note: '英語の昨日・明日よりも広い 2 日前後の日本語語彙を、辞書なしでそのまま返します。',
        code: "date('2026-04-29').from('2026-05-01') + ' · ' + date('2026-05-03').from('2026-05-01')",
        run: ({ date }) => `${date('2026-04-29').from('2026-05-01')} · ${date('2026-05-03').from('2026-05-01')}`,
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
    consolesEn: {
      day: {
        ask: 'What ISO date is midnight <code>2026-09-01</code> in Tokyo?',
        why: 'Midnight in Tokyo (UTC+9) is 3 PM the previous afternoon in UTC, so <code>toISOString()</code> slices out <code>2026-08-31</code>. <code>CalendarDate</code> has no time zone offset to shift.',
      },
      clocks: {
        ask: 'What time is one day after 9 AM on March 28 in London?',
        why: 'Japan has no DST, while London springs forward on the last Sunday of March, making that day 23 hours long. Adding 24 hours shifts the clock to 10 AM, whereas <code>plus(1, \'day\')</code> keeps 9 AM.',
      },
    },
    year: {
      fromZone: 'Europe/London',
      fromCity: 'ロンドン',
      fromCityEn: 'London',
      toZone: 'Asia/Tokyo',
      toCity: '東京',
      toCityEn: 'Tokyo',
      lede: '日本には夏時間がありませんが、欧州や北米との定例会議は年に {changeCount} 回、時差が変わります。Temporal の IANA データベースにより、追加バンドル 0 バイトで正確な現地時刻を追跡できます。',
      ledeEn: 'Japan never changes its clocks, while London switches DST twice a year, shifting their offset {changes} a year. Temporal’s IANA database tracks every transition with zero bytes shipped in your bundle.',
      caption: '{year}年のロンドン 9:30 の定例を東京時間で表示。冬時間の {dayCount} 日間は時差が {far} 時間から {near} 時間に広がり、開始が {time} に変わります。',
      captionEn: 'A 9:30 AM London standup converted to Tokyo time across {year}. For {days} in winter, the offset widens from {far} hours to {near}, moving the meeting to {time}.',
    },
    xray: { inviteCity: 'シドニー', inviteCityEn: 'Sydney' },
    try: {
      city: 'ロンドン',
      cityEn: 'London',
      zones: ['Asia/Tokyo', 'Europe/London', 'Asia/Seoul', 'Asia/Singapore', 'Europe/Paris', 'Australia/Sydney'],
    },
  },

  'zh-CN': {
    exampleSlug: 'examples/chinese',
    guideSlug: 'guides/chinese',
    guideLabel: '阅读中文日期与时间指南',
    configuredLocale: 'zh-CN',
    setupNote: '客户端启动时配置一次（省略则跟随浏览器语言），服务端按请求调用 <code>.locale(tag)</code>',
    title: '原生支持中文公历、农历干支、周表头与时段格式',
    lede: '一次配置（或直接使用浏览器默认语言），“上午/下午”前置、不补零的年月日、纪念日与周一至周日表头都在全局自动生效；需要传统农历与干支纪年时再按需传入日历标签，语言包体积为 0 kB。',
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
        note: '12 小时制下自动输出中文“上午/下午”并置于时刻之前，无需手写英文 AM/PM 映射。',
        code: "time('09:30').format('Ah:mm')",
        run: ({ time }) => time('09:30').format('Ah:mm'),
      },
      {
        label: '传统农历与干支纪年',
        note: '仅在切换历法时传入日历标签，春节正月初一与干支年自动对齐。',
        code: "date('2026-02-17').format('long', 'zh-CN-u-ca-chinese')",
        run: ({ date }) => date('2026-02-17').format('long', 'zh-CN-u-ca-chinese'),
      },
      {
        label: '周一至周日表头',
        note: '按中文地区习惯从周一开始并正确输出“周日”，告别手写映射表或拼接出“周七”的隐患。',
        code: "weekdayNames('short').join(' · ')",
        run: ({ weekdayNames }) => weekdayNames('short').join(' · '),
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
    consolesEn: {
      day: {
        ask: 'What ISO date is midnight <code>2026-09-01</code> in Beijing?',
        why: 'Midnight in China Standard Time (UTC+8) is 4 PM the previous afternoon in UTC, so <code>toISOString()</code> slices out <code>2026-08-31</code>. <code>CalendarDate</code> has no time zone offset to shift.',
      },
      clocks: {
        ask: 'What time is one day after 9 AM on March 28 in London?',
        why: 'China stays on UTC+8 all year, while London springs forward on the last Sunday of March. Adding 24 hours lands on 10 AM, whereas <code>plus(1, \'day\')</code> keeps 9 AM.',
      },
    },
    year: {
      fromZone: 'Europe/London',
      fromCity: '伦敦',
      fromCityEn: 'London',
      toZone: 'Asia/Shanghai',
      toCity: '上海',
      toCityEn: 'Shanghai',
      lede: '中国全年固定 UTC+8，但与欧美团队协作时每年会遇到 {changeCount} 次夏令时切换。借助浏览器内置 IANA 时区库，无需打包任何时区数据即可自动换算。',
      ledeEn: 'China stays on UTC+8 year-round while Europe and North America switch DST, changing the offset {changes} a year. Temporal’s IANA database gives you that for free with zero bytes shipped in your bundle.',
      caption: '{year} 年伦敦 9:30 例会换算为上海时间。在冬令时的 {dayCount} 天里，时差由 {far} 小时扩大到 {near} 小时，会议时间变为 {time}。',
      captionEn: 'A 9:30 AM London standup converted to Shanghai time across {year}. For {days} in winter, the offset widens from {far} hours to {near}, moving the meeting to {time}.',
    },
    xray: { inviteCity: '悉尼', inviteCityEn: 'Sydney' },
    try: {
      city: '伦敦',
      cityEn: 'London',
      zones: ['Asia/Shanghai', 'Europe/London', 'Asia/Tokyo', 'Asia/Singapore', 'Europe/Paris', 'Australia/Sydney'],
    },
  },

  ko: {
    exampleSlug: 'examples/korean',
    guideSlug: 'guides/korean',
    guideLabel: '한국어 날짜와 시각 가이드 읽기',
    configuredLocale: 'ko',
    setupNote: '앱 시작 시 한 번 설정(생략 시 브라우저 로케일), 서버 요청별로는 <code>.locale(tag)</code>',
    title: '한국어 띄어쓰기, 괄호 요일, 음력 표기까지 기본 내장',
    lede: '한 번의 로케일 설정(또는 브라우저 기본 로케일)만으로 년·월·일 뒤의 띄어쓰기, 양쪽 ‘일’을 유지하는 범위 표기, ‘오전’·‘오후’ 위치와 음력 명절 표기까지 별도 로케일 파일 없이 0 kB로 처리합니다.',
    linkLabel: '한국어 인터랙티브 예제 보기',
    proofs: [
      {
        label: '공통 연·월 생략과 양쪽 ‘일’ 유지',
        note: '매번 로케일을 전달하지 않아도 연도와 월을 한 번만 쓰면서 양쪽 날짜에 ‘일’을 남깁니다.',
        code: "dateRange('2026-05-01', '2026-05-05').format('long')",
        run: ({ dateRange }) => dateRange('2026-05-01', '2026-05-05').format('long'),
      },
      {
        label: '년·월·일 띄어쓰기와 괄호 요일',
        note: '중국어·일본어와 달리 단위 뒤에 공백을 두고 한국어 UI에서 익숙한 ‘(금)’ 형태를 바로 만듭니다.',
        code: "date('2026-05-01').format('llll')",
        run: ({ date }) => date('2026-05-01').format('llll'),
      },
      {
        label: '시각 앞 오전·오후 표기',
        note: '시각 앞에 ‘오전’과 ‘오후’를 자연스럽게 배치합니다.',
        code: "time('14:30').format('A h:mm')",
        run: ({ time }) => time('14:30').format('A h:mm'),
      },
      {
        label: '추석·설날을 위한 음력 변환',
        note: '음력 변환 테이블을 번들에 싣지 않고도 간지 연도와 음력 날짜를 표시합니다.',
        code: "date('2026-09-25').format('long', 'ko-KR-u-ca-dangi')",
        run: ({ date }) => date('2026-09-25').format('long', 'ko-KR-u-ca-dangi'),
      },
    ],
    consoles: {
      day: {
        ask: '서울의 <code>2026-09-01</code> 자정을 ISO 문자열로 바꾸면 며칠일까요?',
        miss: '하루 빠름',
        why: '한국 표준시(UTC+9) 자정에 <code>toISOString()</code>을 호출하면 전날 15:00 UTC로 바뀌어 <code>2026-08-31</code>이 됩니다. <code>CalendarDate</code>는 시간대 변환 없이 날짜 자체를 보존합니다.',
      },
      clocks: {
        ask: '런던 서머타임 시작 전날 오전 9시에서 하루 뒤는 몇 시일까요?',
        miss: '1시간 늦음',
        why: '한국은 서머타임을 쓰지 않지만, 런던은 3월 마지막 일요일에 시계를 한 시간 앞당겨 그날 하루가 23시간이 됩니다. 그래서 24시간을 더하면 오전 10시가 되지만, <code>plus(1, \'day\')</code>는 현지 오전 9시를 그대로 유지합니다.',
      },
    },
    consolesEn: {
      day: {
        ask: 'What ISO date is midnight <code>2026-09-01</code> in Seoul?',
        why: 'Midnight in Korea Standard Time (UTC+9) is 3 PM the previous afternoon in UTC, so <code>toISOString()</code> slices out <code>2026-08-31</code>. <code>CalendarDate</code> has no time zone offset to shift.',
      },
      clocks: {
        ask: 'What time is one day after 9 AM on March 28 in London?',
        why: 'Korea does not observe DST, while London springs forward on the last Sunday of March. Adding 24 hours lands on 10 AM, whereas <code>plus(1, \'day\')</code> keeps 9 AM.',
      },
    },
    year: {
      fromZone: 'Europe/London',
      fromCity: '런던',
      fromCityEn: 'London',
      toZone: 'Asia/Seoul',
      toCity: '서울',
      toCityEn: 'Seoul',
      lede: '한국은 서머타임이 없지만 유럽·북미와 협업할 때 일 년에 {changes} 시차가 달라집니다. Temporal의 IANA 데이터베이스로 번들 추가 없이 정확히 계산합니다.',
      ledeEn: 'Korea never switches clocks, while Europe and North America observe DST, changing their offset {changes} a year. Temporal’s IANA database tracks every shift with zero bytes shipped in your bundle.',
      caption: '{year}년 런던 오전 9:30 회의를 서울 시간으로 변환한 결과입니다. 동절기 {days} 동안 시차가 {far}시간에서 {near}시간으로 벌어져 {time}에 열립니다.',
      captionEn: 'A 9:30 AM London standup converted to Seoul time across {year}. For {days} in winter, the offset widens from {far} hours to {near}, moving the meeting to {time}.',
    },
    xray: { inviteCity: '시드니', inviteCityEn: 'Sydney' },
    try: {
      city: '런던',
      cityEn: 'London',
      zones: ['Asia/Seoul', 'Europe/London', 'Asia/Tokyo', 'Asia/Singapore', 'Europe/Paris', 'Australia/Sydney'],
    },
  },

  ar: {
    exampleSlug: 'examples/arabic',
    guideSlug: 'guides/arabic',
    guideLabel: 'اقرأ دليل التواريخ والأوقات بالعربية',
    configuredLocale: 'ar-EG',
    setupNote: 'اضبطه مرّة عند بدء التطبيق (أو اتركه للغة المتصفح)، أو مرّر <code>.locale(tag)</code> لكل طلب على الخادم',
    title: 'دعم أصيل للمثنى والجموع الستة والأرقام العربية والتقويم الهجري',
    lede: 'بضبط الإعداد مرّة واحدة (أو تركه للغة المتصفح)، تعمل صيغة المثنى «يومان» والجموع الستة والأرقام العربية والنطاقات في كل مكان تلقائيًا، مع تمرير رمز إضافي فقط عند التحويل إلى التقويم الهجري أو لهجة أخرى بحجم إضافي 0 كيلوبايت.',
    linkLabel: 'جرّب مثال اللغة العربية المباشر',
    proofs: [
      {
        label: 'المفرد والمثنى والجموع الستة في المدد',
        note: 'يظهر المفرد والمثنى «يومان» دون رقم، مع تمييز جمع القلة من ٣ إلى ١٠ والتمييز المنصوب من ١١ إلى ٩٩.',
        code: "[1, 2, 5, 11].map((n) => days(n).text).join(' · ')",
        run: ({ days }) => [1, 2, 5, 11].map((n) => days(n).text).join(' · '),
      },
      {
        label: 'دمج النطاقات الزمنية من اليمين إلى اليسار',
        note: 'اختصار الشهر والسنة المشتركين في نطاق واحد متسق مع اتجاه الكتابة دون تكرار رمز اللغة.',
        code: "dateRange('2026-05-01', '2026-05-05').format('long')",
        run: ({ dateRange }) => dateRange('2026-05-01', '2026-05-05').format('long'),
      },
      {
        label: 'الأرقام المشرقية مقابل التخصيص المغاربي',
        note: 'يسري الإعداد الافتراضي تلقائيًا، مع إمكانية إرفاق ar-MA بالقيمة عند الحاجة إلى الأرقام المغاربية و«ماي».',
        code: "date('2026-05-01').format('long') + ' · ' + date('2026-05-01').locale('ar-MA').format('long')",
        run: ({ date }) => `${date('2026-05-01').format('long')} · ${date('2026-05-01').locale('ar-MA').format('long')}`,
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
    consolesEn: {
      day: {
        ask: 'What ISO date is midnight <code>2026-09-01</code> in Cairo?',
        why: 'Summer midnight in Cairo (UTC+3) is 9 PM the previous evening in UTC, so <code>toISOString()</code> slices out <code>2026-08-31</code>. <code>CalendarDate</code> has no time zone offset to shift.',
      },
      clocks: {
        ask: 'What time is one day after 9 AM on April 23 in Cairo?',
        why: 'Egypt springs forward on the last Friday of April, making that day 23 hours long. Adding 24 hours shifts the clock to 10 AM, whereas <code>plus(1, \'day\')</code> keeps 9 AM.',
      },
    },
    year: {
      fromZone: 'Europe/London',
      fromCity: 'لندن',
      fromCityEn: 'London',
      toZone: 'Africa/Cairo',
      toCity: 'القاهرة',
      toCityEn: 'Cairo',
      lede: 'تُغيّر لندن والقاهرة التوقيت الصيفي في عطلات نهاية أسبوع مختلفة، فيتبدّل الفارق الزمني {changeCount} مرات في السنة دون بايت واحد إضافي في حزمتك.',
      ledeEn: 'London and Cairo switch DST on different weekends in spring and autumn, changing their offset {changes} a year. Temporal’s IANA database gives you that for free with zero bytes shipped in your bundle.',
      caption: 'اجتماع 9:30 صباحًا بتوقيت لندن محوّلًا إلى توقيت القاهرة خلال عام {year}. لمدة {dayCount} يومًا يتقلّص الفارق من {far} إلى {near} ساعة لينتقل الموعد إلى {time}.',
      captionEn: 'A 9:30 AM London standup converted to Cairo time across {year}. For {days}, the offset narrows from {far} hours to {near}, moving the meeting to {time}.',
    },
    xray: { inviteCity: 'دبي', inviteCityEn: 'Dubai' },
    try: {
      city: 'لندن',
      cityEn: 'London',
      zones: ['Africa/Cairo', 'Asia/Riyadh', 'Asia/Dubai', 'Africa/Casablanca', 'Europe/London', 'Europe/Paris'],
    },
  },

  ru: {
    exampleSlug: 'examples/russian',
    guideSlug: 'guides/russian',
    guideLabel: 'Читать руководство для русского языка',
    configuredLocale: 'ru',
    setupNote: 'Один вызов при запуске (или язык браузера), а на сервере по запросу — <code>.locale(tag)</code>',
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
        label: 'Живые русские наречия для близких дат',
        note: 'Календарные даты выдают «позавчера» и «послезавтра» напрямую из встроенных таблиц языка.',
        code: "date('2026-05-01').from('2026-05-03') + ' · ' + date('2026-05-05').from('2026-05-03')",
        run: ({ date }) => `${date('2026-05-01').from('2026-05-03')} · ${date('2026-05-05').from('2026-05-03')}`,
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
    consolesEn: {
      day: {
        ask: 'What ISO date is midnight <code>2026-09-01</code> in Moscow?',
        why: 'Midnight in Moscow (UTC+3) is 9 PM the previous evening in UTC, so <code>toISOString()</code> slices out <code>2026-08-31</code>. <code>CalendarDate</code> has no time zone offset to shift.',
      },
      clocks: {
        ask: 'What time is one day after 9 AM on March 28 in London?',
        why: 'Moscow stays on UTC+3 year-round, while London springs forward on the last Sunday of March. Adding 24 hours shifts the clock to 10 AM, whereas <code>plus(1, \'day\')</code> keeps 9 AM.',
      },
    },
    year: {
      fromZone: 'Europe/London',
      fromCity: 'Лондон',
      fromCityEn: 'London',
      toZone: 'Europe/Moscow',
      toCity: 'Москва',
      toCityEn: 'Moscow',
      lede: 'В Москве часы не переводят, а в Европе и США переводят дважды в год, поэтому разница во времени меняется {changeCount} раза в год. База IANA в Temporal учитывает это бесплатно и без лишних байтов.',
      ledeEn: 'Moscow stays on UTC+3 all year while Europe and North America switch DST, changing their offset {changes} a year. Temporal’s IANA database handles every transition with zero bytes shipped in your bundle.',
      caption: 'Ежедневный созвон в 9:30 по Лондону в московском времени за {year} год. На протяжении {dayCount} дней зимнего времени разница увеличивается с {far} до {near} ч, сдвигая встречу на {time}.',
      captionEn: 'A 9:30 AM London standup converted to Moscow time across {year}. For {days} in winter, the offset widens from {far} hours to {near}, moving the meeting to {time}.',
    },
    xray: { inviteCity: 'Токио', inviteCityEn: 'Tokyo' },
    try: {
      city: 'Лондоне',
      cityEn: 'London',
      zones: ['Europe/Moscow', 'Asia/Almaty', 'Europe/London', 'Europe/Paris', 'Asia/Dubai', 'Asia/Tokyo'],
    },
  },

  es: {
    exampleSlug: 'examples/spanish',
    guideSlug: 'guides/spanish',
    guideLabel: 'Leer la guía de fechas y horas en español',
    configuredLocale: 'es',
    setupNote: 'Una vez al iniciar la app (o el idioma del navegador), o <code>.locale(tag)</code> por petición en el servidor',
    title: 'Meses en minúscula, conectores «de» y variantes de España y América en 0 kB',
    lede: 'Las plantillas pensadas para inglés suelen escribir «Mayo 1, 2026» con mayúscula indebida o chocar entre martes y miércoles en los calendarios. Configura el idioma una sola vez (o usa el del navegador) y toda la gramática española funciona en 0 kB extra.',
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
        label: 'Cabeceras de semana sin colisión entre martes y miércoles',
        note: 'Evita la ambigüedad «M / M» de las iniciales de una letra devolviendo sílabas únicas de lunes a domingo.',
        code: "weekdayNames('narrow').join(' · ')",
        run: ({ weekdayNames }) => weekdayNames('narrow').join(' · '),
      },
      {
        label: 'Reloj de 24 horas en España y de 12 horas en América',
        note: 'Adapta una hora puntual a otra variante hispanohablante sin cargar tablas de idioma.',
        code: "time('17:30').text + ' · ' + time('17:30').locale('es-MX').text",
        run: ({ time }) => `${time('17:30').text} · ${time('17:30').locale('es-MX').text}`,
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
    consolesEn: {
      day: {
        ask: 'What day is <code>2026-09-01</code> in Mexico City?',
        why: '<code>Date</code> parses ISO date strings as UTC midnight, which is 6 PM on August 31 in Mexico City (UTC-6). <code>CalendarDate</code> has no time zone offset to shift.',
      },
      clocks: {
        ask: 'What time is one day after 9 AM on March 28 in Madrid?',
        why: 'Spain springs forward that night, making the day 23 hours long. Adding 24 hours shifts the clock to 10 AM, whereas <code>plus(1, \'day\')</code> keeps 9 AM.',
      },
    },
    year: {
      fromZone: 'America/Mexico_City',
      fromCity: 'Ciudad de México',
      fromCityEn: 'Mexico City',
      toZone: 'Europe/Madrid',
      toCity: 'Madrid',
      toCityEn: 'Madrid',
      lede: 'Ciudad de México abolió el horario de verano en 2022 mientras España sigue cambiando el reloj, moviendo la diferencia horaria {changeCount} veces al año sin añadir un solo byte a tu bundle.',
      ledeEn: 'Mexico City abolished DST in 2022 while Spain still switches clocks twice a year, changing their offset {changes} a year. Temporal’s IANA database gives you that for free with zero bytes shipped in your bundle.',
      caption: 'Una reunión diaria a las 9:30 en Ciudad de México vista en Madrid durante {year}. Durante {dayCount} días, la diferencia pasa de {far} a {near} horas y cambia la hora local a las {time}.',
      captionEn: 'A 9:30 AM Mexico City standup converted to Madrid time across {year}. For {days} in winter, the offset narrows from {far} hours to {near}, moving the meeting to {time}.',
    },
    xray: { inviteCity: 'Madrid', inviteCityEn: 'Madrid' },
    try: {
      city: 'Madrid',
      cityEn: 'Madrid',
      zones: ['America/Mexico_City', 'Europe/Madrid', 'America/Bogota', 'America/Lima', 'America/Santiago', 'Europe/London'],
    },
  },

  'pt-BR': {
    exampleSlug: 'examples/portuguese',
    guideSlug: 'guides/portuguese',
    guideLabel: 'Ler o guia de datas e horários em português',
    configuredLocale: 'pt-BR',
    setupNote: 'Uma vez ao iniciar o app (ou o idioma do navegador), ou <code>.locale(tag)</code> por requisição no servidor',
    title: 'Crase em «às 09:30», meses em minúscula e fusos do Brasil sem pacotes extras',
    lede: 'Bibliotecas centradas no inglês costumam capitalizar «Maio» ou esquecer a crase antes do horário. Defina o idioma uma única vez (ou use o do navegador) e todas as chamadas entregam a grafia correta do português com 0 kB de pacotes extras.',
    linkLabel: 'Abrir o exemplo interativo em português',
    proofs: [
      {
        label: 'Crase antes do horário e dias com hífen',
        note: 'Une data e hora com «às» e preserva «sexta-feira» e «maio» em minúsculas sem repetir pt-BR.',
        code: "datetime('2026-05-15T09:30', 'America/Sao_Paulo').format('full')",
        run: ({ datetime }) => datetime('2026-05-15T09:30', 'America/Sao_Paulo').format('full'),
      },
      {
        label: 'Intervalo de datas enxuto',
        note: 'Agrupa os dias no início e mantém «de maio de 2026» apenas uma vez.',
        code: "dateRange('2026-05-15', '2026-05-19').format('long')",
        run: ({ dateRange }) => dateRange('2026-05-15', '2026-05-19').format('long'),
      },
      {
        label: 'Conversão entre fusos brasileiros com máscara segura',
        note: 'Converte de Brasília para Manaus mantendo «[às]» protegido contra o token de segundos.',
        code: "datetime('2026-05-15T09:30', 'America/Sao_Paulo').in('America/Manaus').format('DD/MM [às] HH:mm')",
        run: ({ datetime }) => datetime('2026-05-15T09:30', 'America/Sao_Paulo').in('America/Manaus').format('DD/MM [às] HH:mm'),
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
    consolesEn: {
      day: {
        ask: 'What day is <code>2026-09-01</code> in São Paulo?',
        why: '<code>Date</code> parses ISO date strings as UTC midnight, which is 9 PM on August 31 in São Paulo (UTC-3). <code>CalendarDate</code> has no time zone offset to shift.',
      },
      clocks: {
        ask: 'What time is one day after 9 AM on March 28 in Lisbon?',
        why: 'Brazil ended DST, while Portugal springs forward on the last Sunday of March. Adding 24 hours shifts the clock to 10 AM, whereas <code>plus(1, \'day\')</code> keeps 9 AM.',
      },
    },
    year: {
      fromZone: 'America/Sao_Paulo',
      fromCity: 'São Paulo',
      fromCityEn: 'São Paulo',
      toZone: 'Europe/Lisbon',
      toCity: 'Lisboa',
      toCityEn: 'Lisbon',
      lede: 'O Brasil encerrou o horário de verão, mas Portugal e o resto da Europa mudam o relógio {changeCount} vezes por ano. A base IANA do Temporal calcula cada virada com zero bytes extras no bundle.',
      ledeEn: 'Brazil ended DST while Portugal and the rest of Europe still switch clocks, changing their offset {changes} a year. Temporal’s IANA database tracks every shift with zero bytes shipped in your bundle.',
      caption: 'Uma daily às 9:30 em São Paulo convertida para o horário de Lisboa ao longo de {year}. Por {dayCount} dias, a diferença muda de {far} para {near} horas, levando a reunião para {time}.',
      captionEn: 'A 9:30 AM São Paulo standup converted to Lisbon time across {year}. For {days} in winter, the offset narrows from {far} hours to {near}, moving the meeting to {time}.',
    },
    xray: { inviteCity: 'Lisboa', inviteCityEn: 'Lisbon' },
    try: {
      city: 'Lisboa',
      cityEn: 'Lisbon',
      zones: ['America/Sao_Paulo', 'Europe/Lisbon', 'America/Manaus', 'Africa/Luanda', 'Europe/Paris', 'Asia/Tokyo'],
    },
  },

  fr: {
    exampleSlug: 'examples/french',
    guideSlug: 'guides/french',
    guideLabel: 'Lire le guide des dates et heures en français',
    configuredLocale: 'fr',
    setupNote: 'Une fois au démarrage (ou la langue du navigateur), ou <code>.locale(tag)</code> par requête côté serveur',
    title: 'Mois en minuscules, horloge « 14h30 » et variantes francophones sans fichiers de langue',
    lede: 'Une seule configuration au démarrage (ou la langue du navigateur) suffit pour écrire les jours et les mois en minuscules sans virgule et fusionner les plages, tout en permettant de passer « fr-CA » ponctuellement pour 0 ko supplémentaire.',
    linkLabel: 'Ouvrir l’exemple interactif en français',
    proofs: [
      {
        label: 'Jour et mois en minuscules, sans virgule',
        note: 'Écrit le jour et le mois en minuscules sans virgule (« vendredi 15 mai 2026 ») sans repasser la locale à chaque appel.',
        code: "date('2026-05-15').format('full')",
        run: ({ date }) => date('2026-05-15').format('full'),
      },
      {
        label: 'Fusion des plages de dates',
        note: 'La propriété .text évite déjà de répéter le mois et l’année lorsque les deux bornes tombent le même mois.',
        code: "dateRange('2026-05-15', '2026-05-19').text",
        run: ({ dateRange }) => dateRange('2026-05-15', '2026-05-19').text,
      },
      {
        label: 'Horloge française en « 14h30 » et prépositions',
        note: 'Combine les noms français du moteur avec « [le] », « [à] » et « HH[h]mm » sans collision avec le jeton 12 h.',
        code: "datetime('2026-05-15T14:30', 'Europe/Paris').format('[le] dddd D MMMM [à] HH[h]mm')",
        run: ({ datetime }) => datetime('2026-05-15T14:30', 'Europe/Paris').format('[le] dddd D MMMM [à] HH[h]mm'),
      },
      {
        label: 'Variante ponctuelle pour le Québec',
        note: 'Attachez une locale sur une valeur pour passer de « à 09:30 » en France à « à 09 h 30 » au Québec.',
        code: "datetime('2026-05-15T09:30', 'America/Montreal').locale('fr-CA').format('long')",
        run: ({ datetime }) => datetime('2026-05-15T09:30', 'America/Montreal').locale('fr-CA').format('long'),
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
    consolesEn: {
      day: {
        ask: 'What ISO date is midnight <code>2026-09-01</code> in Paris?',
        why: 'Summer midnight in Paris (UTC+2) is 10 PM the previous evening in UTC, so <code>toISOString()</code> slices out <code>2026-08-31</code>. <code>CalendarDate</code> has no time zone offset to shift.',
      },
      clocks: {
        ask: 'What time is one day after 9 AM on March 28 in Paris?',
        why: 'France springs forward on the last Sunday of March, making that day 23 hours long. Adding 24 hours shifts the clock to 10 AM, whereas <code>plus(1, \'day\')</code> keeps 9 AM.',
      },
    },
    year: {
      fromZone: 'America/Montreal',
      fromCity: 'Montréal',
      fromCityEn: 'Montréal',
      toZone: 'Europe/Paris',
      toCity: 'Paris',
      toCityEn: 'Paris',
      lede: 'Montréal et Paris changent d’heure avec trois semaines d’écart au printemps et une semaine à l’automne, modifiant leur décalage {changeCount} fois par an. Temporal le gère nativement avec zéro octet ajouté.',
      ledeEn: 'Montréal and Paris switch DST three weeks apart in spring and one week apart in autumn, changing their offset {changes} a year. Temporal’s IANA database gives you that for free with zero bytes shipped in your bundle.',
      caption: 'Un point quotidien à 9 h 30 à Montréal lu à l’heure de Paris sur l’année {year}. Pendant {dayCount} jours, l’écart passe de {far} h à {near} h et déplace la réunion à {time}.',
      captionEn: 'A 9:30 AM Montréal standup converted to Paris time across {year}. For {days}, the offset narrows from {far} hours to {near}, moving the meeting to {time}.',
    },
    xray: { inviteCity: 'Tokyo', inviteCityEn: 'Tokyo' },
    try: {
      city: 'Montréal',
      cityEn: 'Montréal',
      zones: ['Europe/Paris', 'America/Montreal', 'Europe/Brussels', 'Europe/Zurich', 'Africa/Abidjan', 'Asia/Tokyo'],
    },
  },
};
