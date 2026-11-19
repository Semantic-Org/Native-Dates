import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// the zone a runtime starts in cannot be changed from inside it, so each machine is a second process
// on a machine in UTC, as CI is, text read in the zone of the machine and text read in UTC come out the same
const readOn = (machineZone) => {
  const script = `
    import '@native-dates/plugins/loose';
    import { date, dateRange, datetime, time } from 'native-dates';
    const loose = { loose: true, zone: 'Asia/Kolkata' };
    const clock = (moment) => moment?.format('YYYY-MM-DD HH:mm');
    const noZoneAsked = datetime('Sep 6, 2026 5:30 PM', { loose: true });
    console.log(JSON.stringify({
      typedDay: date('Sep 6, 2026', loose)?.toString(),
      numericDay: date('9/6/2026', loose)?.toString(),
      dayFirst: date('6/9/2026', { ...loose, dayFirst: true })?.toString(),
      lateEvening: clock(datetime('Sep 6, 2026 11:30 PM', loose)),
      afterMidnight: clock(datetime('9/6/2026, 12:15:00 AM', loose)),
      clockAlone: time('Sep 6, 2026 11:30 PM', loose)?.toString(),
      header: datetime('Sun, 06 Sep 2026 14:30:00 GMT', loose)?.toString(),
      headerDay: date('Sun, 06 Sep 2026 20:30:00 GMT', loose)?.toString(),
      range: dateRange('Sep 1, 2026 - Sep 7, 2026', loose)?.toString(),
      noSuchDay: date('Feb 30 2026', loose),
      firstOfMarch: date('Mar 1 2026', loose)?.toString(),
      noZoneAsked: [noZoneAsked?.zone, clock(noZoneAsked)],
    }));
  `;
  const printed = execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
    cwd: fileURLToPath(new URL('../../..', import.meta.url)),
    env: { ...process.env, TZ: machineZone },
    encoding: 'utf8',
  });
  return JSON.parse(printed);
};

describe('{ loose: true } on machines in different time zones', () => {
  // none of these changes its clocks on a day read here
  it.each(['Pacific/Auckland', 'Asia/Tokyo', 'UTC', 'America/Los_Angeles'])(
    'reads the day and the clock as written on a machine in %s',
    (machineZone) => {
      expect(readOn(machineZone)).toEqual({
        typedDay: '2026-09-06',
        numericDay: '2026-09-06',
        dayFirst: '2026-09-06',
        lateEvening: '2026-09-06 23:30',
        afterMidnight: '2026-09-06 00:15',
        clockAlone: '23:30:00',
        header: '2026-09-06T14:30:00.000Z',
        headerDay: '2026-09-07',
        range: '2026-09-01/2026-09-07',
        noSuchDay: null,
        firstOfMarch: '2026-03-01',
        noZoneAsked: [machineZone, '2026-09-06 17:30'],
      });
    },
    30_000,
  );
});
