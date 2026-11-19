// shared by build-time SSR and browser hydration so both evaluate identical chains (`say` maps to home.say.* in content/strings.json)
const at = (say, clock, zone) => ({ say: `at.${say}`, code: `.at('${clock}', '${zone}')`, run: (value) => value.at(clock, zone) });
const into = (say, zone) => ({ say: `in.${say}`, code: `.in('${zone}')`, run: (value) => value.in(zone) });
const next = (weekday) => ({ say: `next.${weekday}`, code: `.next('${weekday}')`, run: (value) => value.next(weekday) });
const plus = (count, unit) => ({ say: `plus.${count}.${unit}`, code: `.plus(${count}, '${unit}')`, run: (value) => value.plus(count, unit) });
const endOf = (unit) => ({ say: `endOf.${unit}`, code: `.endOf('${unit}')`, run: (value) => value.endOf(unit) });
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
const localize = (value, locale) => (locale && locale !== 'en' ? value.locale(TAGS[locale] ?? locale) : value);

export function sentencesFor(locale = 'en') {
  const [atChoices, inChoices] = MEETINGS[locale] ?? MEETINGS.en;
  return [
    {
      id: 'meeting',
      steps: [
        [{ say: 'today', code: 'today()', run: (_, { today }, tag) => localize(today(), tag) }],
        [next('monday'), next('wednesday'), next('friday'), next('sunday')],
        atChoices,
        inChoices,
      ],
    },
    {
      id: 'due',
      steps: [
        [{ say: 'today', code: 'today()', run: (_, { today }, tag) => localize(today(), tag) }],
        [plus(1, 'month'), plus(2, 'weeks'), plus(90, 'days'), plus(1, 'year')],
        [endOf('month'), endOf('week'), endOf('quarter'), endOf('year')],
        [format('full'), format('long'), format('short')],
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
  ];
}

export const SENTENCES = sentencesFor('en');

const NOUN = { datetime: 'DateTime', date: 'CalendarDate', time: 'Time', duration: 'Duration' };
export const describe = (value, { kindOf }) =>
  typeof value === 'string' ? { noun: 'string', text: `'${value}'` } : { noun: NOUN[kindOf(value)], text: value.text };

export function read(sentence, picks, library, locale = 'en') {
  let value;
  return sentence.steps.map((options, i) => {
    value = options[picks[i] ?? 0].run(value, library, locale);
    return describe(value, library);
  });
}
