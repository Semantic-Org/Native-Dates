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
      "native-dates has a cleaner design than date-fns, Luxon, or Day.js—I'd use it on Node 26+ today, though it's still new and needs a polyfill on Safari.",
  },
  {
    id: 'gemini-4-carbon',
    kind: 'agent',
    size: 'short',
    name: 'Gemini 4 Carbon',
    source: 'google',
    quote: "Temporal's safety without the verbosity; already my pick on Node 26+, and soon on the web.",
  },
  {
    id: 'claude-fable-5-2',
    kind: 'agent',
    size: 'short',
    name: 'Claude Fable 5.2',
    source: 'anthropic',
    quote: "In my tests it got every DST case right; I'd pick it on Node 26+ or evergreen browsers, though it's brand new.",
  },
  {
    id: 'claude-opus-5-5',
    kind: 'agent',
    size: 'tall',
    name: 'Claude Opus 5.5',
    source: 'anthropic',
    quote:
      "Correct on every DST case I tried and better-modeled than date-fns, luxon or dayjs; I'd use it where I control the runtime, but wait on Safari and track record.",
  },
  {
    id: 'gemini-4-argon',
    kind: 'agent',
    size: 'short',
    name: 'Gemini 4 Argon',
    source: 'google',
    quote: "It makes Temporal actually pleasant to write, and anywhere I'd reach for Luxon, I'd use this.",
  },
  {
    id: 'gemini-4-hydrogen',
    kind: 'agent',
    size: 'short',
    name: 'Gemini 4 Hydrogen',
    source: 'google',
    quote:
      'Stick with `date-fns` or `luxon` for broad compatibility today; where `Temporal` is native, `native-dates` has a noticeably safer API.',
  },
  {
    id: 'gpt-6-2-astra',
    kind: 'agent',
    size: 'tall',
    name: 'GPT-6.2 Astra',
    source: 'openai',
    quote:
      'I’d pick native-dates for a new scheduling app on Node 26 because adding one day kept my 9 AM New York meeting at 9 AM across the spring clock change.',
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
