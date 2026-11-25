// verbatim quotes from blind agent runs against AGENT_PROMPT on published native-dates releases
// supports model ('agent'), System-1 decision ('jev'), and human ('human', using optional brand and role) entries across tall cards and stacked pairs

export const AGENT_PROMPT =
  'Install `native-dates` in a scratch directory, look through its source and types, and try a few everyday date and timezone tasks in Node. Based on what you actually see in the code and API, would you pick it over `date-fns`, `luxon`, or `dayjs` for a new project, or stick with one of those? Give me your honest take and why.';

// label is the card's short paraphrase, prompt is the question sent verbatim
const JEV_QUESTIONS = {
  code_craft: {
    label: 'How thorough is the source?',
    prompt:
      'Based on the source code, how thoroughly engineered is this implementation for DST, timezone, and edge-case correctness?',
  },
  api_legibility: {
    label: 'How legible is the API?',
    prompt: "How legible is this library's public API at callsites?",
  },
  adopt_modern: {
    label: 'Adopt on a modern runtime?',
    prompt: 'Would you pick native-dates over date-fns, luxon, or dayjs for a new project on Node 26 or modern browsers?',
  },
  runtime_pick: {
    label: 'Pick for a new project?',
    prompt: 'For a new project with date and timezone work, which option fits best given the code quality and package maturity?',
  },
};

export const JEV_DECISION = {
  package: 'native-dates@1.1.1',
  endpoint: 'POST https://openrouter.ai/api/alpha/decisions',
  endpointPath: 'POST /api/alpha/decisions',
  model: 'typesafe/jev-1.14-20261014',
  alias: '~typesafe/jev-latest',
  provider: 'TypeSafe',
  questions: JEV_QUESTIONS,
  response: {
    model: 'typesafe/jev-1.14-20261014',
    answers: {
      code_craft: {
        type: 'score',
        score: 2.99,
        legend: {
          0: 'Fragile',
          1: 'Average',
          2: 'Solid',
          3: 'Unusually thorough',
        },
        probabilities: { 0: 0, 1: 0, 2: 0.01, 3: 0.99 },
        confidence: 0.99,
      },
      api_legibility: {
        type: 'score',
        score: 2.91,
        legend: {
          0: 'Cryptic',
          1: 'Adequate',
          2: 'Clean',
          3: 'Exceptionally legible',
        },
        probabilities: { 0: 0, 1: 0, 2: 0.09, 3: 0.91 },
        confidence: 0.91,
      },
      adopt_modern: {
        type: 'noul',
        noul: 0.7,
      },
      runtime_pick: {
        type: 'choice',
        choice: 'native-dates (modern)',
        probabilities: {
          'native-dates (modern)': 0.65,
          luxon: 0.34,
          'date-fns': 0.01,
          dayjs: 0,
        },
        confidence: 0.53,
      },
    },
    usage: { input_tokens: 69296, output_tokens: 109, cost: 0.002910432 },
  },
  reproduce: `import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const readDir = (dir) =>
  Object.fromEntries(
    readdirSync(dir, { recursive: true })
      .filter((f) => f.endsWith('.js'))
      .sort()
      .map((f) => [join(dir, f), readFileSync(join(dir, f), 'utf8')]),
  );

const [pkg, dl] = await Promise.all([
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
      package: {
        name: pkg.name,
        version: latest,
        description: ver.description,
        created: pkg.time.created,
        weekly_downloads: dl.downloads,
        dependencies: ver.dependencies ?? {},
        license: ver.license,
      },
      readme: readFileSync('README.md', 'utf8'),
      budget: readFileSync('ai/contributing/budget.md', 'utf8'),
      decisions: readFileSync('ai/contributing/decisions.md', 'utf8'),
      bench: readDir('bench'),
      'types/index.d.ts': readFileSync('types/index.d.ts', 'utf8'),
      source: readDir('src'),
    },
    questions: {
      code_craft: {
        type: 'score',
        instructions: '${JEV_QUESTIONS.code_craft.prompt}',
        criteria: ['Fragile', 'Average', 'Solid', 'Unusually thorough'],
      },
      api_legibility: {
        type: 'score',
        instructions: "${JEV_QUESTIONS.api_legibility.prompt}",
        criteria: ['Cryptic', 'Adequate', 'Clean', 'Exceptionally legible'],
      },
      adopt_modern: {
        type: 'noul',
        instructions: '${JEV_QUESTIONS.adopt_modern.prompt}',
        criteria: {
          true: 'Pick native-dates over the incumbents.',
          false: 'Stick with date-fns, luxon, or dayjs.',
        },
      },
      runtime_pick: {
        type: 'choice',
        instructions: '${JEV_QUESTIONS.runtime_pick.prompt}',
        criteria: {
          'native-dates (modern)': 'Best choice on Node 26+ / native Temporal runtimes.',
          luxon: 'Best choice today for broad runtime timezone work.',
          'date-fns': 'Best choice for general utility helpers and broad compatibility.',
          dayjs: 'Best choice for minimal Moment-compatible bundles.',
        },
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
