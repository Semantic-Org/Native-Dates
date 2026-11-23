#!/usr/bin/env node
// the scoped name runs the same setup command, so `npx native-dates` works where only @native-dates/core is installed

import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const entry = createRequire(import.meta.url).resolve('native-dates');
await import(pathToFileURL(join(dirname(entry), '../bin/native-dates.js')).href);
