// shared by build-time SSR and browser hydration so both evaluate identical chains (`say` maps to home.say.* in content/strings.json)
const at = (say, clock, zone) => ({ say: `at.${say}`, code: `.at('${clock}', '${zone}')`, run: (value) => value.at(clock, zone) });
const into = (say, zone) => ({ say: `in.${say}`, code: `.in('${zone}')`, run: (value) => value.in(zone) });
const next = (weekday) => ({ say: `next.${weekday}`, code: `.next('${weekday}')`, run: (value) => value.next(weekday) });
const plus = (count, unit) => ({ say: `plus.${count}.${unit}`, code: `.plus(${count}, '${unit}')`, run: (value) => value.plus(count, unit) });
const format = (preset) => ({ say: `format.${preset}`, code: `.format('${preset}')`, run: (value) => value.format(preset) });

const AT = {
  losAngeles: at('losAngeles', '9:30am', 'America/Los_Angeles'),
  newYork: at('newYork', '2pm', 'America/New_York'),
  london: at('london', '8am', 'Europe/London'),
  tokyo: at('tokyo', '6:45pm', 'Asia/Tokyo'),
  tokyoEvening: at('tokyoEvening', '6pm', 'Asia/Tokyo'),
  shanghai: at('shanghai', '5pm', 'Asia/Shanghai'),
  seoul: at('seoul', '6pm', 'Asia/Seoul'),
  cairo: at('cairo', '11am', 'Africa/Cairo'),
  moscow: at('moscow', '12pm', 'Europe/Moscow'),
  mexicoCity: at('mexicoCity', '9:30am', 'America/Mexico_City'),
  saoPaulo: at('saoPaulo', '9:30am', 'America/Sao_Paulo'),
  paris: at('paris', '3pm', 'Europe/Paris'),
};

const IN = {
  berlin: into('berlin', 'Europe/Berlin'),
  kolkata: into('kolkata', 'Asia/Kolkata'),
  sydney: into('sydney', 'Australia/Sydney'),
  saoPaulo: into('saoPaulo', 'America/Sao_Paulo'),
  london: into('london', 'Europe/London'),
  tokyo: into('tokyo', 'Asia/Tokyo'),
  madrid: into('madrid', 'Europe/Madrid'),
  lisbon: into('lisbon', 'Europe/Lisbon'),
  montreal: into('montreal', 'America/Montreal'),
};

// pair each locale's primary city with daytime partner zones so converted meeting times stay realistic
const MEETINGS = {
  en: [[AT.losAngeles, AT.newYork, AT.london, AT.tokyo], [IN.berlin, IN.kolkata, IN.sydney, IN.saoPaulo]],
  ja: [[AT.tokyoEvening, AT.london, AT.paris, AT.saoPaulo], [IN.london, IN.sydney, IN.kolkata, IN.saoPaulo]],
  'zh-CN': [[AT.shanghai, AT.london, AT.paris, AT.tokyo], [IN.london, IN.sydney, IN.tokyo, IN.saoPaulo]],
  ko: [[AT.seoul, AT.london, AT.paris, AT.saoPaulo], [IN.london, IN.sydney, IN.tokyo, IN.saoPaulo]],
  ar: [[AT.cairo, AT.london, AT.paris, AT.tokyo], [IN.london, IN.tokyo, IN.kolkata, IN.saoPaulo]],
  ru: [[AT.moscow, AT.london, AT.paris, AT.tokyo], [IN.london, IN.tokyo, IN.kolkata, IN.saoPaulo]],
  es: [[AT.mexicoCity, AT.paris, AT.london, AT.tokyo], [IN.madrid, IN.saoPaulo, IN.tokyo, IN.sydney]],
  'pt-BR': [[AT.saoPaulo, AT.paris, AT.london, AT.tokyo], [IN.lisbon, IN.madrid, IN.tokyo, IN.sydney]],
  fr: [[AT.paris, AT.london, AT.saoPaulo, AT.tokyo], [IN.montreal, IN.tokyo, IN.kolkata, IN.sydney]],
};

const TAGS = { ar: 'ar-EG' };
const DAY_FIRST = new Set(['ar', 'ru', 'es', 'pt-BR', 'fr']);
const localize = (value, locale) => (locale && locale !== 'en' ? value.locale(TAGS[locale] ?? locale) : value);

export function sentencesFor(locale = 'en') {
  const [atChoices, inChoices] = MEETINGS[locale] ?? MEETINGS.en;
  const dayFirst = DAY_FIRST.has(locale);
  const annual = (say, md, dm) => ({
    say,
    code: dayFirst ? `dayMonth('${dm}')` : `monthDay('${md}')`,
    run: (_, { dayMonth, monthDay }, tag) => localize(dayFirst ? dayMonth(dm) : monthDay(md), tag),
  });
  return [
    {
      id: 'date',
      steps: [
        [
          { say: 'today', code: 'today()', run: (_, { today }, tag) => localize(today(), tag) },
          { say: 'tomorrow', code: 'tomorrow()', run: (_, { tomorrow }, tag) => localize(tomorrow(), tag) },
          { say: 'yesterday', code: 'yesterday()', run: (_, { yesterday }, tag) => localize(yesterday(), tag) },
        ],
        [
          { say: 'add.1.week', code: ".add(1, 'week')", run: (value) => value.add(1, 'week') },
          next('monday'),
          next('wednesday'),
          next('friday'),
          next('sunday'),
        ],
        atChoices,
        inChoices,
      ],
    },
    {
      id: 'time',
      steps: [
        [
          { say: 'time.920am', code: "time('9:20am')", run: (_, { time }, tag) => localize(time('9:20am'), tag) },
          { say: 'time.10pm', code: "time('10:00pm')", run: (_, { time }, tag) => localize(time('10:00pm'), tag) },
          { say: 'time.640am', code: "time('6:40am')", run: (_, { time }, tag) => localize(time('6:40am'), tag) },
        ],
        [plus(8, 'hours'), plus(45, 'minutes'), plus(3, 'hours')],
        [
          { say: 'round.15m', code: ".round(15, 'minutes')", run: (value) => value.round(15, 'minutes') },
          { say: 'round.hour', code: ".round('hour')", run: (value) => value.round('hour') },
        ],
        [
          { say: 'format.24h', code: ".format('HH:mm')", run: (value) => value.format('HH:mm') },
          format('short'),
        ],
      ],
    },
    {
      id: 'length',
      steps: [
        [
          { say: 'duration.90m', code: "duration('1h 30m')", run: (_, { duration }, tag) => localize(duration('1h 30m'), tag) },
          { say: 'duration.45m', code: "duration('45 minutes')", run: (_, { duration }, tag) => localize(duration('45 minutes'), tag) },
          { say: 'duration.2d6h', code: "duration('2 days and 6 hours')", run: (_, { duration }, tag) => localize(duration('2 days and 6 hours'), tag) },
        ],
        [plus(45, 'minutes'), plus(3, 'hours'), plus(1, 'day')],
        [
          { say: 'times.2', code: '.times(2)', run: (value) => value.times(2) },
          { say: 'times.3', code: '.times(3)', run: (value) => value.times(3) },
        ],
        [format('narrow'), format('short'), format('digital')],
      ],
    },
    {
      id: 'range',
      steps: [
        [
          { say: 'range.may', code: "dateRange('2026-05-01', '2 weeks')", run: (_, { dateRange }, tag) => localize(dateRange('2026-05-01', '2 weeks'), tag) },
          { say: 'range.jan', code: "dateRange('2026-01-01', '2026-01-14')", run: (_, { dateRange }, tag) => localize(dateRange('2026-01-01', '2026-01-14'), tag) },
          { say: 'range.nov', code: "dateRange('2026-11-01', '2026-11-30')", run: (_, { dateRange }, tag) => localize(dateRange('2026-11-01', '2026-11-30'), tag) },
        ],
        [
          { say: 'count.weekdays', code: ".count('weekdays')", run: (value) => value.count('weekdays') },
          { say: 'count.weekends', code: ".count('weekends')", run: (value) => value.count('weekends') },
          { say: 'count.mondays', code: ".count('mondays')", run: (value) => value.count('mondays') },
          { say: 'count.days', code: '.count()', run: (value) => value.count() },
        ],
      ],
    },
    {
      id: 'month',
      steps: [
        [
          { say: 'month.dec26', code: "monthYear('12/26')", run: (_, { monthYear }, tag) => localize(monthYear('12/26'), tag) },
          { say: 'month.nov27', code: "monthYear('11/27')", run: (_, { monthYear }, tag) => localize(monthYear('11/27'), tag) },
          { say: 'month.apr26', code: "monthYear('04/26')", run: (_, { monthYear }, tag) => localize(monthYear('04/26'), tag) },
        ],
        [
          { say: 'add.3.months', code: ".add(3, 'months')", run: (value) => value.add(3, 'months') },
          { say: 'add.1.year', code: ".add(1, 'year')", run: (value) => value.add(1, 'year') },
          { say: 'minus.1.month', code: ".minus(1, 'month')", run: (value) => value.minus(1, 'month') },
        ],
        [
          { say: 'month.end', code: '.end', run: (value) => value.end },
          { say: 'month.days', code: '.daysInMonth', run: (value) => value.daysInMonth },
          { say: 'month.isPast', code: '.isPast()', run: (value) => value.isPast() },
        ],
      ],
    },
    {
      id: 'annual',
      steps: [
        [
          annual('birthday.oct17', '10/17', '17/10'),
          annual('birthday.feb29', '02/29', '29/02'),
          annual('birthday.dec25', '12/25', '25/12'),
        ],
        [
          { say: 'birthday.next', code: '.next()', run: (value) => value.next() },
          { say: 'birthday.in2028', code: '.in(2028)', run: (value) => value.in(2028) },
          { say: 'birthday.prev', code: '.previous()', run: (value) => value.previous() },
        ],
        [
          { say: 'birthday.fromNow', code: '.fromNow()', run: (value) => value.fromNow() },
          format('full'),
          { say: 'birthday.weekday', code: ".format('dddd')", run: (value) => value.format('dddd') },
        ],
      ],
    },
  ];
}

export const SENTENCES = sentencesFor('en');

const NOUN = {
  datetime: 'DateTime',
  date: 'CalendarDate',
  time: 'Time',
  duration: 'Duration',
  dateRange: 'DateRange',
  yearMonth: 'YearMonth',
  monthDay: 'MonthDay',
};
export const describe = (value, { kindOf }) => {
  if (typeof value === 'string') { return { noun: 'string', text: `'${value}'` }; }
  if (typeof value === 'number') { return { noun: 'number', text: String(value) }; }
  if (typeof value === 'boolean') { return { noun: 'boolean', text: String(value) }; }
  if (Array.isArray(value)) {
    const first = value[0];
    const kind = first ? NOUN[kindOf(first)] : 'value';
    const text = value.length > 2 ? `${first.text} … ${value.at(-1).text}` : value.map((v) => v.text).join(', ');
    return { noun: `${kind}[${value.length}]`, text };
  }
  return { noun: NOUN[kindOf(value)], text: value.text };
};

export function read(sentence, picks, library, locale = 'en') {
  let value;
  return sentence.steps.map((options, i) => {
    value = options[picks[i] ?? 0].run(value, library, locale);
    return describe(value, library);
  });
}
