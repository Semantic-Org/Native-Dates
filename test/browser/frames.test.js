import { date, datetime, days, isCalendarDate, kindOf } from 'native-dates';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('cross-iframe Date and native-dates interoperability', () => {
  let iframeElement;
  let frame;
  let theirs;

  beforeAll(async () => {
    iframeElement = document.body.appendChild(document.createElement('iframe'));
    frame = iframeElement.contentWindow;
    theirs = await frame.eval(`import('${new URL('./frame-library.js', import.meta.url)}')`);
  });

  afterAll(() => {
    iframeElement?.remove();
  });

  it('converts a cross-realm Date from the iframe to the same instant', () => {
    const sent = new frame.Date('2026-11-16T17:30:00Z');
    expect(sent instanceof Date).toBe(false);
    expect(datetime(sent, 'UTC').toString()).toBe('2026-11-16T17:30:00.000Z');
    expect(date(sent, 'America/Los_Angeles').toString()).toBe('2026-11-16');
  });

  it('recognizes brand identity on values created by a separate native-dates copy in the iframe', () => {
    const due = theirs.date('2026-11-16');
    expect(due.constructor).not.toBe(date('2026-11-16').constructor);
    expect(kindOf(due)).toBe('date');
    expect(isCalendarDate(due)).toBe(true);
  });

  it('compares, diffs, and performs arithmetic across separate native-dates copies', () => {
    const due = theirs.date('2026-11-16');
    expect(date('2026-11-16').equals(due)).toBe(true);
    expect(date('2026-11-10').until(due, 'days')).toBe(6);
    expect(date('2026-11-10').to(due).toString()).toBe('2026-11-10/2026-11-16');
    expect(due.plus(days(2)).toString()).toBe('2026-11-18');
    expect(date('2026-11-16').plus(theirs.days(2)).toString()).toBe('2026-11-18');
    expect(date('2026-11-16').at(theirs.time('9:30'), 'UTC').equals(theirs.datetime('2026-11-16T09:30Z'))).toBe(true);
  });
});
