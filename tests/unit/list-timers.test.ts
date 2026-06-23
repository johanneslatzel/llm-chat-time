import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListTimersTool, TimerPool } from '../../src/index.js';
import { ResultStatus } from '@johannes.latzel/llm-chat';

const mockService = { notify: vi.fn().mockResolvedValue(undefined) };

describe('ListTimersTool', () => {
    let timerPool: TimerPool;
    let tool: ListTimersTool;

    beforeEach(() => {
        timerPool = new TimerPool(mockService);
        tool = new ListTimersTool(timerPool);
    });

    it('returns empty list when no timers exist', async () => {
        const result = (await tool.execute({}))[0]!;
        expect(result.status).toBe(ResultStatus.Success);
        expect(result.tool).toBe('list_timers');

        const data = JSON.parse(result.result);
        expect(data.timers).toEqual([]);
    });

    it('lists all timers with their state', async () => {
        const t1 = await timerPool.create();
        await t1.set('1m');
        await t1.start();

        const t2 = await timerPool.create();
        await t2.set('2m');

        const result = (await tool.execute({}))[0]!;
        const data = JSON.parse(result.result);
        expect(data.timers).toHaveLength(2);

        const running = data.timers.find((t: Record<string, unknown>) => t.id === t1.id);
        expect(running).toBeDefined();
        expect(running.running).toBe(true);
        expect(running.duration).toMatch(/^-?\d+(\.\d+)?(ms|s|m|h|d)(\s+\d+(\.\d+)?(ms|s|m|h|d))*$/);
        expect(running.remaining).toMatch(/^-?\d+(\.\d+)?(ms|s|m|h|d)(\s+\d+(\.\d+)?(ms|s|m|h|d))*$/);

        const stopped = data.timers.find((t: Record<string, unknown>) => t.id === t2.id);
        expect(stopped).toBeDefined();
        expect(stopped.running).toBe(false);
    });

    it('includes reminder when set', async () => {
        const timer = await timerPool.create();
        await timer.set('1m');
        await timer.start('pasta is ready');

        const result = (await tool.execute({}))[0]!;
        const data = JSON.parse(result.result);
        expect(data.timers[0].reminder).toBe('pasta is ready');
    });

    it('returns error when list throws', async () => {
        vi.spyOn(timerPool, 'list').mockRejectedValue(new Error('list failed'));
        const result = (await tool.execute({}))[0]!;
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toBe('list failed');
    });
});
