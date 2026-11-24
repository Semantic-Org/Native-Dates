#!/usr/bin/env node
// npx @native-dates/setup: installs native-dates, links its skills where coding agents look, and points AGENTS.md at them
// only this library's words live here, and the command itself is bin/agent-setup, which runs on Node older than `engines`

import { setup } from './agent-setup/setup.js';

process.exitCode = await setup({
  packageUrl: new URL('../package.json', import.meta.url),
  target: 'native-dates',
  command: '@native-dates/setup',
  aliases: ['@native-dates/core'],
  note:
    'This project uses `native-dates` for dates, times, time zones, durations, and ranges. Its API differs from Moment, Day.js, date-fns, Luxon, and raw Temporal, and is likely newer than your training data. Read `{skill}` before writing or reviewing date/time code.',
  notices: typeof Temporal === 'undefined'
    ? [{
      label: 'node',
      text:
        `${process.version} lacks built-in Temporal. Needs \`@native-dates/polyfill\` (see \`native-dates-plugins\` skill)`,
    }]
    : [],
});
