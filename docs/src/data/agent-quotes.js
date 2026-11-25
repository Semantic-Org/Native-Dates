// verbatim quotes from blind agent runs against AGENT_PROMPT on published native-dates releases
// supports model ('agent') and human ('human', using optional brand and role) entries across tall cards and stacked pairs

export const AGENT_PROMPT =
  'Install `native-dates` in a scratch directory, look through its source and types, and try a few everyday date and timezone tasks in Node. Based on what you actually see in the code and API, would you pick it over `date-fns`, `luxon`, or `dayjs` for a new project, or stick with one of those? Give me your honest take and why.';

export const AGENT_QUOTES = [
  {
    id: 'gemini-4-neon',
    kind: 'agent',
    size: 'tall',
    name: 'Gemini 4 Neon',
    source: 'google',
    quote:
      "Design-wise, `native-dates` has a cleaner mental model than `date-fns`, `luxon`, or `dayjs`, and reading the source shows real care around DST, `Intl`, and edge cases that `Date`-based libraries paper over. I'd reach for it on a greenfield Node 26+ project today, though for a production web app supporting Safari or Node LTS I'd wait until `Temporal` is Baseline and the library has more real-world mileage.",
  },
  {
    id: 'gemini-4-carbon',
    kind: 'agent',
    size: 'short',
    name: 'Gemini 4 Carbon',
    source: 'google',
    quote:
      "I'd wait on browsers until Safari ships Temporal, but for timezone-heavy Node 26+ code I'd pick native-dates over Luxon today.",
  },
  {
    id: 'gpt-6-2-sol',
    kind: 'agent',
    size: 'short',
    name: 'GPT-6.2 Sol',
    source: 'openai',
    quote:
      'I’d default to date-fns and pick native-dates if I controlled the runtime and needed calendar dates distinct from instants across the app.',
  },
  {
    id: 'claude-opus-5-5',
    kind: 'agent',
    size: 'tall',
    name: 'Claude Opus 5.5',
    source: 'anthropic',
    quote:
      "It got every DST, month-end and time zone case I threw at it right, and it models dates better than date-fns, luxon or dayjs, with the clearest error messages I've seen in a date library. I'd pick it today wherever I control the runtime, but for Safari-facing apps I'd wait until Temporal ships there and the library has more of a track record.",
  },
  {
    id: 'grok-4-7',
    kind: 'agent',
    size: 'short',
    name: 'Grok 4.7',
    source: 'x',
    quote:
      "I'd use native-dates for new Temporal timezone work, not Safari or Node 22 without the polyfill, and not as a date-fns replacement.",
  },
  {
    id: 'gemini-4-argon',
    kind: 'agent',
    size: 'short',
    name: 'Gemini 4 Argon',
    source: 'google',
    quote:
      "On runtimes with `Temporal`, I'd pick it over `luxon` and `date-fns` for `Temporal`'s date-vs-instant safety without the boilerplate.",
  },
  {
    id: 'gpt-6-2-astra',
    kind: 'agent',
    size: 'tall',
    name: 'GPT-6.2 Astra',
    source: 'openai',
    quote:
      'I’d pick `native-dates` for a new scheduling app on Node 26. I could read `.plus(1, \'day\')` as “same time tomorrow,” and when I tried it across New York’s spring clock change, my 9 AM meeting stayed at 9 AM.',
  },
  {
    id: 'qwen3-8-max-prime',
    kind: 'agent',
    size: 'short',
    name: 'Qwen3.8 Max Prime',
    source: 'qwen',
    quote:
      "I'd pick native-dates for new apps on modern runtimes — just nothing critical until it's had a year of real traffic.",
  },
];
