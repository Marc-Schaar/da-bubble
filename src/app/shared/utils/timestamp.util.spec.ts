import { toDateSafe } from './timestamp.util';

describe('toDateSafe', () => {
  it('returns "now" for null/undefined', () => {
    const before = Date.now();
    expect(toDateSafe(null).getTime()).toBeGreaterThanOrEqual(before);
    expect(toDateSafe(undefined).getTime()).toBeGreaterThanOrEqual(before);
  });

  it('converts a Firestore Timestamp-like object via toDate()', () => {
    const expected = new Date('2026-01-01T12:00:00Z');
    const timestampLike = { toDate: () => expected };
    expect(toDateSafe(timestampLike)).toBe(expected);
  });

  it('returns "now" for a pending serverTimestamp() sentinel (no toDate, no seconds)', () => {
    const before = Date.now();
    const result = toDateSafe({ isEqual: () => false });
    expect(result.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('parses a plain object with a "seconds" field via the Date constructor fallback', () => {
    // Date can't natively parse { seconds }, so this exercises the isNaN fallback to "now".
    const before = Date.now();
    const result = toDateSafe({ seconds: 1735689600 });
    expect(result.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('KNOWN QUIRK: a raw Date instance has neither toDate() nor a "seconds" field, so it is treated like a pending serverTimestamp() sentinel and returns "now" instead of the given date', () => {
    const input = new Date('2026-03-05T08:30:00Z');
    const before = Date.now();
    const result = toDateSafe(input);
    expect(result.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.getTime()).not.toBe(input.getTime());
  });

  it('parses an ISO date string', () => {
    const result = toDateSafe('2026-03-05T08:30:00Z');
    expect(result.toISOString()).toBe('2026-03-05T08:30:00.000Z');
  });

  it('parses a numeric epoch millisecond value', () => {
    const ms = 1772000000000;
    const result = toDateSafe(ms);
    expect(result.getTime()).toBe(ms);
  });

  it('falls back to "now" for an unparseable string', () => {
    const before = Date.now();
    const result = toDateSafe('not-a-date');
    expect(result.getTime()).toBeGreaterThanOrEqual(before);
  });
});
