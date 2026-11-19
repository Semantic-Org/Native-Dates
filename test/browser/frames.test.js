import { date, datetime, days, isCalendarDate, kindOf } from 'native-dates';
import { beforeAll, describe, expect, it } from 'vitest';

// a same-origin frame has a Date of its own and loads its own copy of every module
describe('values handed over from another frame', () => {
  let frame;
  let theirs;

  beforeAll(async () => {
    frame = document.body.appendChild(document.createElement('iframe')).contentWindow;
    theirs = await frame.eval(`import('${new URL('./frame-library.js', import.meta.url)}')`);
  });

  it('reads a Date made in the frame as the same moment', () => {
    const sent = new frame.Date('2026-11-16T17:30:00Z');
    expect(sent instanceof Date).toBe(false);
    expect(datetime(sent, 'UTC').toString()).toBe('2026-11-16T17:30:00.000Z');
    expect(date(sent, 'America/Los_Angeles').toString()).toBe('2026-11-16');
  });

  it('reports the kind of a value made by the copy of native-dates in the frame', () => {
    const due = theirs.date('2026-11-16');
    expect(due.constructor).not.toBe(date('2026-11-16').constructor);
    expect(kindOf(due)).toBe('date');
    expect(isCalendarDate(due)).toBe(true);
  });

  it('compares, measures and adds across the two copies', () => {
    const due = theirs.date('2026-11-16');
    expect(date('2026-11-16').equals(due)).toBe(true);
    expect(date('2026-11-10').until(due, 'days')).toBe(6);
    expect(date('2026-11-10').to(due).toString()).toBe('2026-11-10/2026-11-16');
    expect(due.plus(days(2)).toString()).toBe('2026-11-18');
    expect(date('2026-11-16').plus(theirs.days(2)).toString()).toBe('2026-11-18');
    expect(date('2026-11-16').at(theirs.time('9:30'), 'UTC').equals(theirs.datetime('2026-11-16T09:30Z'))).toBe(true);
  });
});
