import { describe, it, expect, afterEach, vi } from 'vitest';
import { SleepTool, SleepRegistry } from '../../src/index.js';
import { ResultStatus } from '@johannes.latzel/llm-chat';

describe('SleepTool', () => {
    const tool = new SleepTool(new SleepRegistry());

    afterEach(() => {
        vi.useRealTimers();
    });

    it('blocks for the given duration string', async () => {
        const result = (await tool.execute({ time: '20ms' }))[0]!;
        expect(result.status).toBe(ResultStatus.Success);
        expect(result.tool).toBe('sleep');

        const data = JSON.parse(result.result);
        expect(data.time).toBe('20ms');
        expect(data.duration_ms).toBe(20);
        expect(typeof data.elapsed).toBe('string');
    });

    it('blocks until the given datetime', async () => {
        const until = new Date(Date.now() + 60).toISOString();
        const result = (await tool.execute({ until }))[0]!;
        expect(result.status).toBe(ResultStatus.Success);

        const data = JSON.parse(result.result);
        expect(data.until).toBe(until);
        expect(data.duration_ms).toBeGreaterThan(0);
        expect(typeof data.elapsed).toBe('string');
    });

    it('rejects durations exceeding the maximum setTimeout delay', async () => {
        const result = (await tool.execute({ time: '25 days' }))[0]!;
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toContain('maximum supported sleep');
    });

    it('rejects an until datetime further than the maximum setTimeout delay', async () => {
        const until = new Date(Date.now() + 26 * 24 * 60 * 60 * 1000).toISOString();
        const result = (await tool.execute({ until }))[0]!;
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toContain('maximum supported sleep');
    });

    it('returns error when both time and until are given', async () => {
        const result = (await tool.execute({ time: '5m', until: '2030-01-01T00:00:00Z' }))[0]!;
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toContain('only one');
    });

    it('returns error when neither time nor until is given', async () => {
        const result = (await tool.execute({}))[0]!;
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toContain('either');
    });

    it('returns error for empty time', async () => {
        const result = (await tool.execute({ time: '' }))[0]!;
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('returns error for non-string time', async () => {
        const result = (await tool.execute({ time: 42 }))[0]!;
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toContain('time must be a string');
    });

    it('returns error for non-string until', async () => {
        const result = (await tool.execute({ until: 42 }))[0]!;
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toContain('until must be a string');
    });

    it('returns error for invalid time format', async () => {
        const result = (await tool.execute({ time: 'abc' }))[0]!;
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('returns error for non-positive duration', async () => {
        const result = (await tool.execute({ time: '0m' }))[0]!;
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('returns error for invalid until datetime', async () => {
        const result = (await tool.execute({ until: 'not-a-date' }))[0]!;
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toContain('not a valid ISO 8601 datetime');
    });

    it('returns error for past until datetime', async () => {
        const until = new Date(Date.now() - 1000).toISOString();
        const result = (await tool.execute({ until }))[0]!;
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toContain('in the past');
    });
});


describe('SleepTool with registry', () => {
    it('registers and unregisters sleeps while they run', async () => {
        vi.useFakeTimers();
        const registry = new SleepRegistry();
        const tool = new SleepTool(registry);

        const promise = tool.execute({ time: '20ms' });
        expect(registry.active).toBe(1);

        await vi.advanceTimersByTimeAsync(20);
        const result = (await promise)[0]!;
        expect(result.status).toBe(ResultStatus.Success);
        expect(registry.active).toBe(0);
    });

    it('returns an error result when interrupted by abortAll', async () => {
        vi.useFakeTimers();
        const registry = new SleepRegistry();
        const tool = new SleepTool(registry);

        const promise = tool.execute({ time: '1h' });
        expect(registry.active).toBe(1);

        registry.abortAll();
        const result = (await promise)[0]!;
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toContain('interrupted');
        expect(registry.active).toBe(0);
    });
});
