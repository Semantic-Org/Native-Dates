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
    id: 'gemini-4-carbon',
    kind: 'agent',
    size: 'short',
    name: 'Gemini 4 Carbon',
    source: 'google',
    quote:
      "I'd wait on browsers until Safari ships Temporal, but for timezone-heavy Node 26+ code I'd pick native-dates over Luxon today.",
  },
  {
    id: 'gpt-6-2-astra',
    kind: 'agent',
    size: 'short',
    name: 'GPT-6.2 Astra',
    source: 'openai',
    quote:
      'I’d pick native-dates for scheduling on Node 26 and stick with date-fns for projects that mostly pass Date objects around.',
  },
  {
    id: 'claude-fable-5-2',
    kind: 'agent',
    size: 'tall',
    name: 'Claude Fable 5.2',
    source: 'anthropic',
    quote:
      "native-dates got every DST and invalid-date case I threw at it right, was the fastest of the four on timezone work, and has the clearest API of the bunch. I'd pick it for a new project on Node 26+ or evergreen browsers, but it's brand new and needs a polyfill where Temporal is missing, so I wouldn't make it my default everywhere yet.",
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
    id: 'qwen3-8-max-prime',
    kind: 'agent',
    size: 'tall',
    name: 'Qwen3.8 Max Prime',
    source: 'qwen',
    quote:
      "I'd genuinely pick native-dates over dayjs or date-fns for a new project on a modern runtime — the Temporal foundation is the right bet and the code is clearly built with care. My only hesitation is that it's two weeks old, so I'd let someone else find the first production bug before I put anything critical on it.",
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
];
