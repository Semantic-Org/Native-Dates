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
      maintained: { type: 'noul', noul: 0.83 },
      adopt_modern: { type: 'noul', noul: 0.59 },
      api_legibility: {
        type: 'score',
        score: 2.96,
        legend: {
          0: 'Cryptic / verbose',
          1: 'Adequate',
          2: 'Clean',
          3: 'Exceptionally legible',
        },
        probabilities: { 0: 0, 1: 0, 2: 0.04, 3: 0.96 },
        confidence: 0.96,
      },
      verdict: {
        type: 'choice',
        choice: 'caution',
        probabilities: { adopt: 0.01, caution: 0.99, avoid: 0 },
        confidence: 0.98,
      },
    },
    usage: { input_tokens: 2007, output_tokens: 96, cost: 0.000084294 },
  },
  reproduce: `const [pkg, dl] = await Promise.all([
  fetch('https://registry.npmjs.org/native-dates').then((r) => r.json()),
  fetch('https://api.npmjs.org/downloads/point/last-week/native-dates').then((r) => r.json()),
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
      weekly_downloads: dl.downloads,
      published: pkg.time[latest],
      readme: pkg.readme,
    },
    questions: {
      maintained: { type: 'noul', prompt: 'Is this package actively maintained?' },
      adopt_modern: {
        type: 'noul',
        prompt: 'Should a team on a modern runtime adopt this over date-fns, luxon, or dayjs?',
      },
      api_legibility: {
        type: 'score',
        prompt: 'Rate the API legibility.',
        legend: {
          0: 'Cryptic / verbose',
          1: 'Adequate',
          2: 'Clean',
          3: 'Exceptionally legible',
        },
      },
      verdict: {
        type: 'choice',
        prompt: 'Overall adoption verdict for a new project today?',
        choices: ['adopt', 'caution', 'avoid'],
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
    id: 'typesafe-jev',
    kind: 'jev',
    size: 'short',
    name: 'TypeSafe Jev 1.14',
    source: 'typesafe',
  },
];
