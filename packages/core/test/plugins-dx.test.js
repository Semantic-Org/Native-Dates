import { describe, it } from 'node:test';

import { configure, date, datetime, time } from '@native-dates/core';
import '@native-dates/core/plugins/legacy-date';
import '@native-dates/core/plugins/loose';
import { timeRange } from '@native-dates/core/plugins/ranges';
import '@native-dates/core/plugins/relative';
import '@native-dates/core/plugins/tokens';
import '@native-dates/core/plugins/zones';

import { expect } from './helpers/expect.js';

describe('plugin installation dx', () => {
  it('attaches prototype methods and extensions on subpath import with zero config', () => {
    expect(time('9am').to('5pm').toString()).toBe('09:00:00/17:00:00');
    expect(timeRange('10pm', '6am').contains('00:30')).toBe(true);
    expect(date('2026-09-06').formatRelative('2026-09-07')).toBe('yesterday');
    expect(datetime('2026-09-06T12:00Z', 'Berlin').zone).toBe('Europe/Berlin');
    expect(date('TBD', { loose: true })).toBe(null);
    expect(datetime('2026-09-06T14:30Z').getFullYear()).toBe(2026);
  });

  it('configures zoneAliases, dayFirst, zone and locale in one configure() call', () => {
    configure({
      zoneAliases: { hq: 'Berlin', noc: 'PT' },
      zone: 'hq',
      locale: 'en-US',
      dayFirst: true,
    });

    const cutoverDay = date('08.03.2026', { loose: true });
    expect(String(cutoverDay)).toBe('2026-03-08');
    expect(cutoverDay.split('hour', 'noc')).toHaveLength(23);
    expect(datetime('2026-09-06T00:00Z').format('YYYY-MM-DD HH:mm')).toBe('2026-09-06 02:00');
    expect(datetime('2026-09-06T00:00Z').format('date')).toBe('Sep 6, 2026');
  });
});
