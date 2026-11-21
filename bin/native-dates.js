#!/usr/bin/env node
// npx native-dates: installs the package, links its skills where coding agents look, and points AGENTS.md at them
// only this library's words live here, and the command itself is bin/agent-setup, which runs on Node older than `engines`

import { setup } from './agent-setup/setup.js';

process.exitCode = await setup({
  packageUrl: new URL('../package.json', import.meta.url),
  aliases: ['@native-dates/core'],
  note:
    'Dates, times, time zones, durations, and ranges in this project use `native-dates`. Its API differs from Moment, Day.js, date-fns, Luxon, and raw Temporal, and is likely newer than your training data. Read `{skill}` before writing or reviewing date or time code.',
  notices: typeof Temporal === 'undefined'
    ? [{
      label: 'node',
      text:
        `${process.version} has no built-in Temporal. Code that runs in it needs \`@native-dates/polyfill\`, covered in the \`native-dates-plugins\` skill`,
    }]
    : [],
});
