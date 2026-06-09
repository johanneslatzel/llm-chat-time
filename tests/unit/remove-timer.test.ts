import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RemoveTimerTool, TimerPool } from '../../src/index.js';
import { ResultStatus } from '@johannes.latzel/llm-chat';

const mockService = { notifyUser: vi.fn().mockResolvedValue(undefined) };

describe('RemoveTimerTool', () => {
    let timerPool: TimerPool;
    let tool: RemoveTimerTool;

    beforeEach(() => {
        timerPool = new TimerPool(mockService);
        tool = new RemoveTimerTool(timerPool);
    });

    it('removes a stopped timer', async () => {
        const timer = await timerPool.create();

        const result = await tool.execute({ timer_id: timer.id });
        expect(result.status).toBe(ResultStatus.Success);
        expect(result.tool).toBe('remove_timer');

        const data = JSON.parse(result.result);
        expect(data.timer_id).toBe(timer.id);
        expect(data.status).toBe('removed');

        expect(await timerPool.get(timer.id)).toBeNull();
    });

    it('returns error for missing timer_id', async () => {
        const result = await tool.execute({});
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('returns error for nonexistent timer_id', async () => {
        const result = await tool.execute({ timer_id: 'nonexistent' });
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('stops and removes a running timer', async () => {
        const timer = await timerPool.create();
        await timer.set('1m');
        await timer.start();
        const result = await tool.execute({ timer_id: timer.id });
        expect(result.status).toBe(ResultStatus.Success);
        const data = JSON.parse(result.result);
        expect(data.status).toBe('removed');
        expect(await timerPool.get(timer.id)).toBeNull();
    });

    it('returns error when remove throws', async () => {
        vi.spyOn(timerPool, 'remove').mockRejectedValue(new Error('remove failed'));
        const result = await tool.execute({ timer_id: 'any' });
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toBe('remove failed');
    });
});
