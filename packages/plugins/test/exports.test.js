import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('@native-dates/plugins exports', () => {
  // test files are ES modules, so require() runs in a second Node process started as CommonJS
  it('attaches zones, loose, parse, and legacy-date when loaded from CommonJS via require()', () => {
    const script = `
      require('@native-dates/plugins/zones');
      require('@native-dates/plugins/loose');
      require('@native-dates/plugins/parse');
      require('@native-dates/plugins/legacy-date');
      const { date, datetime } = require('native-dates');
      const standup = datetime('Nov 16, 2026 9:30 AM', { loose: true, zone: 'los angeles' });
      const due = date('24112026', { format: 'DDMMYYYY' });
      console.log(JSON.stringify({ zone: standup.zone, hours: standup.getHours(), due: due.toString() }));
    `;
    const printed = execFileSync(process.execPath, ['--input-type=commonjs', '--eval', script], {
      cwd: fileURLToPath(new URL('../../..', import.meta.url)),
      encoding: 'utf8',
    });
    expect(JSON.parse(printed)).toEqual({ zone: 'America/Los_Angeles', hours: 9, due: '2026-11-24' });
  });
});
