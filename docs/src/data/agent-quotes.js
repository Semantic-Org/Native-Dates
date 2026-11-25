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
    size: 'tall',
    name: 'Gemini 4 Argon',
    source: 'google',
    quote:
      "`native-dates` gives you the one thing `date-fns`, `dayjs`, and `luxon` can't—`Temporal`'s hard separation between a calendar date, a wall-clock time, and a zoned instant—without making you write verbose `Temporal` boilerplate at every callsite. Having read the source, it's the rare wrapper that actually sweat the edge cases, from skipped-midnight DST transitions and anchored duration math to serializing clean UTC ISO strings that won't choke your database.",
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
    id: 'gpt-6-2-astra',
    kind: 'agent',
    size: 'tall',
    name: 'GPT-6.2 Astra',
    source: 'openai',
    quote:
      'I’d pick `native-dates` for a scheduling app on Node 26. The code reads the way I think about a meeting, and it kept a 9 AM appointment at 9 AM across the clock change. For a project that mostly passes `Date` objects around, I’d stick with `date-fns`.',
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
    size: 'tall',
    name: 'Qwen3.8 Max Prime',
    source: 'qwen',
    quote:
      "I'd genuinely pick native-dates over dayjs or date-fns for a new project on a modern runtime — the Temporal foundation is the right bet and the code is clearly built with care. My only hesitation is that it's two weeks old, so I'd let someone else find the first production bug before I put anything critical on it.",
  },
  {
    id: 'minimax-m3-1-flash',
    kind: 'agent',
    size: 'tall',
    name: 'MiniMax M3.1 Flash',
    source: 'minimax',
    quote:
      "Everything I threw at it — DST transitions, cross-zone conversion, ambiguous and nonexistent local times, locale formatting — came back correct, and the error messages are better than anything date-fns, Luxon, or Day.js gives you; it was the only one of the four where 'a date with no time and no zone' and 'an instant' are actually different types. The only thing holding me back is that it was 22 minutes old when I installed it, so I wouldn't put a production app on it yet, but I suspect it's the one I'd pick in a year.",
  },
  {
    id: 'gemini-4-hydrogen',
    kind: 'agent',
    size: 'tall',
    name: 'Gemini 4 Hydrogen',
    source: 'google',
    quote:
      "For broad browser or older Node targets today I'd still stick with `date-fns` or `luxon` rather than polyfilling `Temporal` or adopting a brand-new library. On runtimes where `Temporal` is already native, though, `native-dates` has a noticeably safer API—forcing calendar dates, wall times, and zoned instants to stay separate eliminates a whole class of silent timezone bugs.",
  },
  {
    id: 'gemini-3-8-flash',
    kind: 'agent',
    size: 'tall',
    name: 'Gemini 3.8 Flash',
    source: 'google',
    quote:
      "It's the cleanest wrapper around `Temporal` I've seen, fixing its awkward syntax while getting DST and timezone math right out of the box—I'd jump on it for modern runtimes, but I'd still hesitate on older production stacks until `Temporal` is native everywhere.",
  },
];
