import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseMetaTime, timeAgo } from './time';

describe('parseMetaTime', () => {
  it('returns null for empty/undefined input', () => {
    expect(parseMetaTime(undefined)).toBeNull();
    expect(parseMetaTime('')).toBeNull();
  });

  it('parses ISO date strings', () => {
    const d = parseMetaTime('2024-01-15T10:30:00Z');
    expect(d).not.toBeNull();
    expect(d!.getUTCFullYear()).toBe(2024);
  });

  it('parses "YYYY-MM-DD HH:mm:ss" style strings', () => {
    const d = parseMetaTime('2024-01-15 10:30:00');
    expect(d).not.toBeNull();
    expect(d!.getUTCHours()).toBe(10);
  });

  it('parses numeric epoch seconds', () => {
    const d = parseMetaTime(1700000000);
    expect(d).not.toBeNull();
    expect(d!.getTime()).toBe(1700000000 * 1000);
  });

  it('parses numeric epoch milliseconds', () => {
    const ms = 1700000000000;
    const d = parseMetaTime(ms);
    expect(d).not.toBeNull();
    expect(d!.getTime()).toBe(ms);
  });

  it('returns null for unparseable strings', () => {
    expect(parseMetaTime('not-a-date')).toBeNull();
  });
});

describe('timeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "unknown time" for null/undefined', () => {
    expect(timeAgo(null)).toBe('unknown time');
    expect(timeAgo(undefined)).toBe('unknown time');
  });

  it('returns "just now" for very recent times', () => {
    expect(timeAgo(new Date('2024-01-15T11:59:58Z'))).toBe('just now');
  });

  it('returns seconds ago', () => {
    expect(timeAgo(new Date('2024-01-15T11:59:30Z'))).toBe('30 sec ago');
  });

  it('returns minutes ago', () => {
    expect(timeAgo(new Date('2024-01-15T11:55:00Z'))).toBe('5 min ago');
  });

  it('returns hours ago', () => {
    expect(timeAgo(new Date('2024-01-15T09:00:00Z'))).toBe('3 hr ago');
  });

  it('returns days ago (singular)', () => {
    expect(timeAgo(new Date('2024-01-14T12:00:00Z'))).toBe('1 day ago');
  });

  it('returns days ago (plural)', () => {
    expect(timeAgo(new Date('2024-01-10T12:00:00Z'))).toBe('5 days ago');
  });
});
