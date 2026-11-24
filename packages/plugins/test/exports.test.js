import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('@native-dates/plugins exports', () => {
  // test files are ES modules, so require() runs in a second Node process started as CommonJS
  it('attaches zones, loose, parse, ranges, and legacy-date when loaded from CommonJS via require()', () => {
    const script = `
      require('@native-dates/plugins/zones');
      require('@native-dates/plugins/loose');
      require('@native-dates/plugins/parse');
      require('@native-dates/plugins/legacy-date');
      const { mergeRanges } = require('@native-dates/plugins/ranges');
      const { date, dateRange, datetime } = require('native-dates');
      const standup = datetime('Nov 16, 2026 9:30 AM', { loose: true, zone: 'los angeles' });
      const due = date('24112026', { format: 'DDMMYYYY' });
      const parts = dateRange('2026-11-01', '2026-11-10').subtract('2026-11-04/2026-11-06').map(String);
      const merged = mergeRanges([dateRange('2026-11-06', '2026-11-10'), dateRange('2026-11-01', '2026-11-05')]).map(String);
      console.log(JSON.stringify({ zone: standup.zone, hours: standup.getHours(), due: due.toString(), parts, merged }));
    `;
    const printed = execFileSync(process.execPath, ['--input-type=commonjs', '--eval', script], {
      cwd: fileURLToPath(new URL('../../..', import.meta.url)),
      encoding: 'utf8',
    });
    expect(JSON.parse(printed)).toEqual({
      zone: 'America/Los_Angeles',
      hours: 9,
      due: '2026-11-24',
      parts: ['2026-11-01/2026-11-03', '2026-11-07/2026-11-10'],
      merged: ['2026-11-01/2026-11-10'],
    });
  });
});
