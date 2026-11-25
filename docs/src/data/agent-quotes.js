// verbatim quotes from blind agent runs against AGENT_PROMPT on published native-dates releases
// supports model ('agent'), System-1 decision ('jev'), and human ('human', using optional brand and role) entries across tall cards and stacked pairs

export const AGENT_PROMPT =
  'Install `native-dates` in a scratch directory, look through its source and types, and try a few everyday date and timezone tasks in Node. Based on what you actually see in the code and API, would you pick it over `date-fns`, `luxon`, or `dayjs` for a new project, or stick with one of those? Give me your honest take and why.';

export const JEV_DECISION = {
  package: 'native-dates@1.1.1',
  endpoint: 'POST https://openrouter.ai/api/alpha/decisions',
  endpointPath: 'POST /api/alpha/decisions',
  model: 'typesafe/jev-1.14-20261014',
  alias: '~typesafe/jev-latest',
  provider: 'TypeSafe',
  response: {
    model: 'typesafe/jev-1.14-20261014',
    answers: {
      code_craft: {
        type: 'score',
        score: 2.97,
        legend: {
          0: 'Fragile',
          1: 'Average',
          2: 'Solid',
          3: 'Unusually thorough',
        },
        probabilities: { 0: 0, 1: 0, 2: 0.03, 3: 0.97 },
        confidence: 0.97,
      },
      api_legibility: {
        type: 'score',
        score: 2.75,
        legend: {
          0: 'Cryptic',
          1: 'Adequate',
          2: 'Clean',
          3: 'Exceptionally legible',
        },
        probabilities: { 0: 0, 1: 0, 2: 0.24, 3: 0.76 },
        confidence: 0.76,
      },
      adopt_modern: {
        type: 'noul',
        noul: 0.7,
      },
      runtime_pick: {
        type: 'choice',
        choice: 'native-dates (modern)',
        probabilities: {
          'native-dates (modern)': 0.51,
          luxon: 0.48,
          'date-fns': 0.01,
          dayjs: 0,
        },
        confidence: 0.35,
      },
    },
    usage: { input_tokens: 7598, output_tokens: 109, cost: 0.000319116 },
  },
  reproduce: `import { readFile } from 'node:fs/promises';

const [pkg, dl, readme, calendarDate, dateTime, duration] = await Promise.all([
  fetch('https://registry.npmjs.org/native-dates').then((r) => r.json()),
  fetch('https://api.npmjs.org/downloads/point/last-week/native-dates').then((r) => r.json()),
  readFile('node_modules/native-dates/README.md', 'utf8'),
  readFile('node_modules/native-dates/src/calendar-date.js', 'utf8'),
  readFile('node_modules/native-dates/src/date-time.js', 'utf8'),
  readFile('node_modules/native-dates/src/duration.js', 'utf8'),
]);
const latest = pkg['dist-tags'].latest;
const ver = pkg.versions[latest];

const res = await fetch('https://openrouter.ai/api/alpha/decisions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: \`Bearer \${process.env.OPENROUTER_API_KEY}\`,
  },
  body: JSON.stringify({
    model: '~typesafe/jev-latest',
    state: {
      package: \`\${pkg.name}@\${latest}\`,
      description: ver.description,
      license: ver.license,
      dependencies: Object.keys(ver.dependencies ?? {}),
      created: pkg.time.created,
      published: pkg.time[latest],
      weekly_downloads: dl.downloads,
      readme,
      source: {
        'src/calendar-date.js': calendarDate,
        'src/date-time.js': dateTime,
        'src/duration.js': duration,
      },
    },
    questions: {
      code_craft: {
        type: 'score',
        prompt: 'Rate the implementation craft and edge-case handling in the source.',
        legend: { 0: 'Fragile', 1: 'Average', 2: 'Solid', 3: 'Unusually thorough' },
      },
      api_legibility: {
        type: 'score',
        prompt: 'Rate the API legibility.',
        legend: { 0: 'Cryptic', 1: 'Adequate', 2: 'Clean', 3: 'Exceptionally legible' },
      },
      adopt_modern: {
        type: 'noul',
        prompt: 'Should a team on a modern runtime adopt this over date-fns, luxon, or dayjs?',
      },
      runtime_pick: {
        type: 'choice',
        prompt: 'Which library would you pick for a new project on a modern runtime?',
        choices: ['native-dates (modern)', 'luxon', 'date-fns', 'dayjs'],
      },
    },
  }),
});

console.log(JSON.stringify(await res.json(), null, 2));`,
};

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
    id: 'typesafe-jev',
    kind: 'jev',
    size: 'tall',
    name: 'TypeSafe Jev 1.14',
    source: 'typesafe',
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
    id: 'gpt-6-2-astra',
    kind: 'agent',
    size: 'short',
    name: 'GPT-6.2 Astra',
    source: 'openai',
    quote:
      'I’d pick native-dates for a new scheduling app on Node 26 because adding one day kept my 9 AM New York meeting at 9 AM across the spring clock change.',
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
    id: 'gemini-4-hydrogen',
    kind: 'agent',
    size: 'short',
    name: 'Gemini 4 Hydrogen',
    source: 'google',
    quote:
      'Stick with `date-fns` or `luxon` for broad compatibility today; where `Temporal` is native, `native-dates` has a noticeably safer API.',
  },
];
