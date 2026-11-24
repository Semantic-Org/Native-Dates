import { DEFAULT_LOCALE, localePath, t } from './i18n.js';
import { PLUGINS } from './plugins.js';

// slugs without a content entry render with href: null so planned pages appear as unlinked stubs
const named = (name) => ({ name, label: t(DEFAULT_LOCALE, name) });
const titled = (name) => ({ name, title: t(DEFAULT_LOCALE, name) });

const LANGUAGE_GUIDES = [
  { locale: 'ja', title: 'Japanese', slug: 'guides/japanese' },
  { locale: 'zh-CN', title: 'Chinese', slug: 'guides/chinese' },
  { locale: 'ko', title: 'Korean', slug: 'guides/korean' },
  { locale: 'ar', title: 'Arabic', slug: 'guides/arabic' },
  { locale: 'ru', title: 'Russian', slug: 'guides/russian' },
  { locale: 'es', title: 'Spanish', slug: 'guides/spanish' },
  { locale: 'pt-BR', title: 'Portuguese', slug: 'guides/portuguese' },
  { locale: 'fr', title: 'French', slug: 'guides/french' },
];

export const SECTIONS = [
  {
    key: 'guides',
    ...named('nav.guides'),
    groups: [
      {
        ...named('nav.group.start'),
        items: [
          { title: 'Overview', slug: 'guides/overview' },
          { title: 'Installation', slug: 'guides/installation' },
          { title: 'Customization', slug: 'guides/customization' },
          { title: 'Localization', slug: 'guides/localization' },
        ],
      },
      {
        ...named('nav.group.time'),
        items: [
          { title: 'Types of time', slug: 'guides/types-of-time' },
          { title: 'Time zones', slug: 'guides/time-zones' },
          { title: 'Date math', slug: 'guides/date-math' },
          { title: 'Durations', slug: 'guides/durations' },
          { title: 'Ranges', slug: 'guides/ranges' },
          { title: 'Months and days', slug: 'guides/months-and-days' },
          { title: 'Formatting', slug: 'guides/formatting' },
          { title: 'Parsing', slug: 'guides/parsing' },
          { title: 'Storing and sending', slug: 'guides/storing-and-sending' },
        ],
      },
      {
        ...named('nav.group.going-further'),
        items: [
          { title: 'Coming from Day.js', slug: 'guides/from-dayjs' },
          { title: 'Coming from Moment', slug: 'guides/from-moment' },
          { title: 'Working with Temporal', slug: 'guides/temporal' },
          { title: 'Writing a plugin', slug: 'guides/writing-a-plugin' },
        ],
      },
      {
        ...named('nav.group.handling'),
        items: LANGUAGE_GUIDES,
      },
    ],
  },
  {
    key: 'api',
    ...named('nav.api'),
    groups: [
      {
        ...named('nav.group.classes'),
        items: [
          { title: 'DateTime', slug: 'api/date-time', symbol: true },
          { title: 'CalendarDate', slug: 'api/calendar-date', symbol: true },
          { title: 'Time', slug: 'api/time', symbol: true },
          { title: 'Duration', slug: 'api/duration', symbol: true },
          { title: 'YearMonth', slug: 'api/year-month', symbol: true },
          { title: 'MonthDay', slug: 'api/month-day', symbol: true },
          { title: 'DateRange', slug: 'api/ranges', symbol: true },
          { title: 'DateTimeRange', slug: 'api/ranges#datetimerange', symbol: true },
          { title: 'TimeRange', slug: 'api/ranges#timerange', symbol: true },
        ],
      },
      {
        ...named('nav.group.functions'),
        items: [
          { title: 'datetime()', slug: 'api/datetime-fn', symbol: true },
          { title: 'now()', slug: 'api/datetime-fn#now', symbol: true },
          { title: 'date()', slug: 'api/date-fn', symbol: true },
          { title: 'today()', slug: 'api/date-fn#today', symbol: true },
          { title: 'time()', slug: 'api/time-fn', symbol: true },
          { title: 'duration()', slug: 'api/duration-fn', symbol: true },
          { title: 'yearMonth()', slug: 'api/year-month-fn', symbol: true },
          { title: 'monthYear()', slug: 'api/year-month-fn#monthyear', symbol: true },
          { title: 'monthDay()', slug: 'api/month-day-fn', symbol: true },
          { title: 'dayMonth()', slug: 'api/month-day-fn#daymonth', symbol: true },
          { title: 'dateRange()', slug: 'api/range-fn', symbol: true },
          { title: 'datetimeRange()', slug: 'api/range-fn#datetimerange', symbol: true },
          { title: 'timeRange()', slug: 'api/range-fn#timerange', symbol: true },
          { title: 'monthNames()', slug: 'api/month-names', symbol: true },
          { title: 'weekdayNames()', slug: 'api/month-names#weekdaynames', symbol: true },
          { title: 'dayOfWeek()', slug: 'api/configure#dayofweek', symbol: true },
          { title: 'compare()', slug: 'api/compare', symbol: true },
          { title: 'earliest()', slug: 'api/compare#earliest', symbol: true },
          { title: 'latest()', slug: 'api/compare#latest', symbol: true },
          { title: 'kindOf()', slug: 'api/kind-of', symbol: true },
        ],
      },
      {
        ...named('nav.group.setup'),
        items: [
          { title: 'configure()', slug: 'api/configure', symbol: true },
          { ...titled('nav.item.errors'), slug: 'api/errors' },
        ],
      },
    ],
  },
  {
    key: 'examples',
    ...named('nav.examples'),
    groups: [
      { ...named('nav.examples'), items: [{ ...titled('nav.item.allExamples'), slug: 'examples' }] },
      {
        ...named('nav.group.zones'),
        items: [
          { title: 'A meeting across zones', slug: 'examples/meeting-planner' },
          { title: 'Open right now', slug: 'examples/opening-hours' },
        ],
      },
      {
        ...named('nav.group.lengths'),
        items: [
          { title: 'Countdown to a launch', slug: 'examples/countdown' },
          { title: 'Typed durations', slug: 'examples/duration-input' },
        ],
      },
      {
        ...named('nav.group.calendars'),
        items: [
          { title: 'A month grid', slug: 'examples/month-grid' },
        ],
      },
      {
        ...named('nav.group.localization'),
        items: [
          { ...titled('nav.lang.japanese'), slug: 'examples/japanese' },
          { ...titled('nav.lang.chinese'), slug: 'examples/chinese' },
          { ...titled('nav.lang.korean'), slug: 'examples/korean' },
          { ...titled('nav.lang.arabic'), slug: 'examples/arabic' },
          { ...titled('nav.lang.russian'), slug: 'examples/russian' },
          { ...titled('nav.lang.spanish'), slug: 'examples/spanish' },
          { ...titled('nav.lang.portuguese'), slug: 'examples/portuguese' },
          { ...titled('nav.lang.french'), slug: 'examples/french' },
          { ...titled('nav.lang.german'), slug: 'examples/german' },
        ],
      },
    ],
  },
  {
    key: 'plugins',
    ...named('nav.plugins'),
    groups: [
      {
        ...named('nav.plugins'),
        items: [
          { ...titled('nav.item.allPlugins'), slug: 'plugins' },
          { title: 'Writing a plugin', slug: 'guides/writing-a-plugin' },
        ],
      },
      {
        ...named('nav.group.reference'),
        items: [
          ...PLUGINS.map(({ name }) => ({ title: name, slug: `plugins/${name}`, symbol: true })),
        ],
      },
    ],
  },
];

export const hrefFor = (slug, code) => {
  const [path, hash] = slug.split('#');
  return `${localePath(`/${path}/`, code)}${hash ? `#${hash}` : ''}`;
};

// promote the active locale's own language guide into Start right after Localization,
// removing it from the bottom Handling time in group so it only appears once in the sidebar
function groupsFor(section, code) {
  const ownGuide = section.key === 'guides' && LANGUAGE_GUIDES.find((it) => it.locale === code);
  if (!ownGuide) {
    return section.groups;
  }
  return section.groups.map((g) => {
    if (g.name === 'nav.group.start') {
      return { ...g, items: [...g.items, ownGuide] };
    }
    if (g.name === 'nav.group.handling') {
      return { ...g, items: g.items.filter((it) => it.locale !== code) };
    }
    return g;
  });
}

export function navFor(ids, currentId, { code = DEFAULT_LOCALE, titles = new Map() } = {}) {
  const exists = new Set(ids);
  const label = (it) => (it.name ? t(code, it.name) : it.label);
  return SECTIONS.map((section) => {
    const groups = groupsFor(section, code);
    let marked = false;
    return {
      ...section,
      label: label(section),
      href: hrefFor(
        groups.flatMap((g) => g.items).find((it) => exists.has(it.slug.split('#')[0]))?.slug ?? section.key,
        code,
      ),
      groups: groups.map((g) => ({
        ...g,
        label: label(g),
        items: g.items.map((it) => {
          const page = it.slug.split('#')[0];
          // anchor items keep their symbol title instead of inheriting the host page's title
          const title = it.name ? t(code, it.name) : it.slug.includes('#') ? it.title : (titles.get(page) ?? it.title);
          const current = !marked && it.slug === currentId;
          if (current) {
            marked = true;
          }
          return { ...it, title, href: exists.has(page) ? hrefFor(it.slug, code) : null, current };
        }),
      })),
    };
  });
}

export function pagerFor(ids, currentId, code = DEFAULT_LOCALE) {
  const exists = new Set(ids);
  const seen = new Set();
  const section = SECTIONS.find((s) => s.key === currentId.split('/')[0]);
  const pages = groupsFor(section, code)
    .flatMap((g) => g.items)
    .filter((it) => !it.slug.includes('#') && exists.has(it.slug) && !seen.has(it.slug) && seen.add(it.slug));
  const i = pages.findIndex((it) => it.slug === currentId);
  return { prev: pages[i - 1] ?? null, next: pages[i + 1] ?? null };
}
