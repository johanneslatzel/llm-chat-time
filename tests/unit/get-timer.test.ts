import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetTimerTool, TimerPool } from '../../src/index.js';
import { ResultStatus } from '@johannes.latzel/llm-chat';

const mockService = { notifyUser: vi.fn().mockResolvedValue(undefined) };

describe('GetTimerTool', () => {
    let timerPool: TimerPool;
    let tool: GetTimerTool;

    beforeEach(() => {
        timerPool = new TimerPool(mockService);
        tool = new GetTimerTool(timerPool);
    });

    it('returns state of a stopped timer', async () => {
        const timer = await timerPool.create();
        await timer.set('5m');

        const result = await tool.execute({ timer_id: timer.id });
        expect(result.status).toBe(ResultStatus.Success);
        expect(result.tool).toBe('get_timer');

        const data = JSON.parse(result.result);
        expect(data.timer_id).toBe(timer.id);
        expect(data.running).toBe(false);
        expect(data.duration).toMatch(/^-?\d+(\.\d+)?(ms|s|m|h|d)/);
        expect(data.remaining).toMatch(/^-?\d+(\.\d+)?(ms|s|m|h|d)/);
    });

    it('returns state of a running timer', async () => {
        const timer = await timerPool.create();
        await timer.set('1m');
        await timer.start();

        const result = await tool.execute({ timer_id: timer.id });
        const data = JSON.parse(result.result);
        expect(data.running).toBe(true);
    });

    it('includes reminder when set', async () => {
        const timer = await timerPool.create();
        await timer.set('1m');
        await timer.start('pasta is ready');

        const result = await tool.execute({ timer_id: timer.id });
        const data = JSON.parse(result.result);
        expect(data.reminder).toBe('pasta is ready');
    });

    it('returns error for missing timer_id', async () => {
        const result = await tool.execute({});
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('returns error for nonexistent timer_id', async () => {
        const result = await tool.execute({ timer_id: 'nonexistent' });
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('returns error when pool.get throws', async () => {
        vi.spyOn(timerPool, 'get').mockRejectedValue(new Error('get failed'));
        const result = await tool.execute({ timer_id: 'any' });
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toBe('get failed');
    });
});
