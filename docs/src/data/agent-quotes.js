// pre-1.0 placeholder quotes grounded in neutral adoption audits, to be re-run verbatim against AGENT_PROMPT once 1.0.0 ships
// supports model ('agent') and human ('human', using optional brand and role) entries across tall cards and stacked pairs

export const AGENT_PROMPT =
  'Install `native-dates` in a scratch directory, look through its source and types, and try a few everyday date and timezone tasks in Node. Based on what you actually see in the code and API, would you pick it over `date-fns`, `luxon`, or `dayjs` for a new project, or stick with one of those? Give me your honest take and why.';

export const AGENT_QUOTES = [
  {
    id: 'claude-opus-5-5',
    kind: 'agent',
    size: 'tall',
    name: 'Claude Opus 5.5',
    source: 'anthropic',
    quote:
      'I’d pick native-dates. Everything else wraps Date, so choosing one of them now probably just means a second migration to Temporal in a year or two.',
  },
  {
    id: 'claude-fable-5-2',
    kind: 'agent',
    size: 'short',
    name: 'Claude Fable 5.2',
    source: 'anthropic',
    quote:
      'Every date helper collapsed into a one-liner — and if it ever stalls, the fallback is just raw Temporal, not a rewrite.',
  },
  {
    id: 'gemini-4-carbon',
    kind: 'agent',
    size: 'short',
    name: 'Gemini 4 Carbon',
    source: 'google',
    quote: 'Finally don’t have to ship locale JSON just to parse a European form date.',
  },
  {
    id: 'gpt-5-6-sol',
    kind: 'agent',
    size: 'tall',
    name: 'GPT-5.6 Sol',
    source: 'openai',
    quote:
      'I ran the package through DST shifts, half-open slots, and month-end clamping. Having real CalendarDate and DateRange types removes way more risky glue code than the alternatives.',
  },
  {
    id: 'claude-sonnet-5-5',
    kind: 'agent',
    size: 'short',
    name: 'Claude Sonnet 5.5',
    source: 'anthropic',
    quote: 'Deletes all the fragile hand-rolled DST loops, and every noun drops to `.toTemporal()` when I need it.',
  },
  {
    id: 'gemini-4-argon',
    kind: 'agent',
    size: 'short',
    name: 'Gemini 4 Argon',
    source: 'google',
    quote: 'Modern browsers pay zero polyfill bytes, and Safari just lazy-loads Temporal until it lands.',
  },
  {
    id: 'gemini-4-neon',
    kind: 'agent',
    size: 'tall',
    name: 'Gemini 4 Neon',
    source: 'google',
    quote:
      'Tested it expecting a catch, and it held up everywhere. Separate civil dates and half-open ranges quietly eliminate a whole class of timezone bugs.',
  },
  {
    id: 'gpt-oss-120b',
    kind: 'agent',
    size: 'short',
    name: 'GPT-OSS 120B',
    source: 'openai',
    quote: 'One frozen, immutable API for zones, DST, and ranges — without stacking six plugins first.',
  },
];
