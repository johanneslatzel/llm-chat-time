import { describe, it, expect } from 'vitest';
import parseDuration from 'parse-duration-ms';
import prettyMilliseconds from 'pretty-ms';

describe('parse-duration-ms', () => {
    it('parses human-readable strings to milliseconds', () => {
        expect(parseDuration('1s')).toBe(1000);
        expect(parseDuration('5m')).toBe(300_000);
        expect(parseDuration('1h')).toBe(3_600_000);
        expect(parseDuration('1h30m')).toBe(5_400_000);
        expect(parseDuration('2 days 5 hours')).toBe(190_800_000);
    });

    it('returns undefined on invalid input', () => {
        expect(parseDuration('abc')).toBeUndefined();
        expect(parseDuration('')).toBeUndefined();
    });
});

describe('pretty-ms', () => {
    it('formats milliseconds to human-readable strings', () => {
        expect(prettyMilliseconds(0)).toBe('0ms');
        expect(prettyMilliseconds(1000)).toBe('1s');
        expect(prettyMilliseconds(60_000)).toBe('1m');
        expect(prettyMilliseconds(3_600_000)).toBe('1h');
        expect(prettyMilliseconds(5_400_000)).toBe('1h 30m');
        expect(prettyMilliseconds(86_400_000)).toBe('1d');
        expect(prettyMilliseconds(90_061_000)).toBe('1d 1h 1m 1s');
    });

    it('formats negative durations', () => {
        expect(prettyMilliseconds(-1000)).toBe('-1s');
    });
});
