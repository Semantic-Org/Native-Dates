import { DEFAULT_LOCALE, localePath, t } from './i18n.js';
import { PLUGINS } from './plugins.js';

// the docs' order. an item points at a page by slug; a slug with no page yet is listed as a stub,
// so the shape of the docs is visible before every page exists.

// a section's or group's name is one of the interface's words (nav.… in content/strings.json): name
// is its key, and label is that name in english, for the pages that are only english
const named = (name) => ({ name, label: t(DEFAULT_LOCALE, name) });

// an item that isn't a page of its own (a landing, an anchor) is named the same way
const titled = (name) => ({ name, title: t(DEFAULT_LOCALE, name) });

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
        ],
      },
      {
        ...named('nav.group.time'),
        items: [
          { title: 'Types of time', slug: 'guides/types-of-time' },
          { title: 'Time zones', slug: 'guides/time-zones' },
          { title: 'Date math', slug: 'guides/date-math' },
          { title: 'Durations', slug: 'guides/durations' },
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
          { title: 'monthDay()', slug: 'api/month-day-fn', symbol: true },
          { title: 'dateRange()', slug: 'api/range-fn', symbol: true },
          { title: 'monthNames()', slug: 'api/month-names', symbol: true },
          { title: 'weekdayNames()', slug: 'api/month-names#weekdaynames', symbol: true },
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

// a nav item's href, in a language (english at the root, the rest under their path)
export const hrefFor = (slug, code) => {
  const [path, hash] = slug.split('#');
  return `${localePath(`/${path}/`, code)}${hash ? `#${hash}` : ''}`;
};

// the nav for a page, in a language: every item knows whether its page exists and whether it is
// this page. sections and groups go by their name in the language, and a page translated into it
// (titles, by slug) goes by its translated title
export function navFor(ids, currentId, { code = DEFAULT_LOCALE, titles = new Map() } = {}) {
  const exists = new Set(ids);
  const label = (it) => (it.name ? t(code, it.name) : it.label);
  return SECTIONS.map((section) => ({
    ...section,
    label: label(section),
    href: hrefFor(
      section.groups.flatMap((g) => g.items).find((it) => exists.has(it.slug.split('#')[0]))?.slug ?? section.key,
      code,
    ),
    groups: section.groups.map((g) => ({
      ...g,
      label: label(g),
      items: g.items.map((it) => {
        const page = it.slug.split('#')[0];
        const title = it.name ? t(code, it.name) : it.slug.includes('#') ? it.title : (titles.get(page) ?? it.title);
        return { ...it, title, href: exists.has(page) ? hrefFor(it.slug, code) : null, current: it.slug === currentId };
      }),
    })),
  }));
}

// previous and next among the pages that exist, in nav order, within the section
export function pagerFor(ids, currentId) {
  const exists = new Set(ids);
  const section = SECTIONS.find((s) => s.key === currentId.split('/')[0]);
  const pages = section.groups.flatMap((g) => g.items)
    .filter((it) => !it.slug.includes('#') && exists.has(it.slug));
  const i = pages.findIndex((it) => it.slug === currentId);
  return { prev: pages[i - 1] ?? null, next: pages[i + 1] ?? null };
}
