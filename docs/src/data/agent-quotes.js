// verbatim quotes from blind agent runs against AGENT_PROMPT on published native-dates releases
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
      "It got every DST edge case right where dayjs didn't, ran faster than luxon, dayjs and date-fns in my quick test, and reads more naturally than luxon, so on a modern runtime it's what I'd reach for. It's also brand new, so for a team shipping to Safari or older Node today, I'd give it a few releases first.",
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
    id: 'gpt-6-2-sol',
    kind: 'agent',
    size: 'short',
    name: 'GPT-6.2 Sol',
    source: 'openai',
    quote:
      'I’d default to date-fns and pick native-dates if I controlled the runtime and needed calendar dates distinct from instants across the app.',
  },
  {
    id: 'gemini-4-carbon',
    kind: 'agent',
    size: 'tall',
    name: 'Gemini 4 Carbon',
    source: 'google',
    quote:
      "`native-dates` gives you `Temporal`'s strict separation between civil dates and zoned timestamps without the ceremony of raw `Temporal`, and reading the source made `luxon` feel immediately dated. I'd still wait for Safari to ship native `Temporal` before making it my default in browser bundles, but for a Node 26+ service or anything heavy on timezones and intervals, I'd pick it today.",
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
      'I’d pick `native-dates` for a scheduling app on Node 26. The code reads the way I think about a meeting, and it kept a 9 AM appointment at 9 AM across the clock change. For a project that mostly passes `Date` objects around, I’d stick with `date-fns`.',
  },
  {
    id: 'minimax-m3-1-flash',
    kind: 'agent',
    size: 'short',
    name: 'MiniMax M3.1 Flash',
    source: 'minimax',
    quote:
      "Everything I tested was correct and better-designed than the alternatives, but at 22 minutes old, I'd wait a year before trusting it.",
  },
];
