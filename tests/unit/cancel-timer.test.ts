import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CancelTimerTool, TimerPool } from '../../src/index.js';
import { ResultStatus } from '@johannes.latzel/llm-chat';

const mockService = { notify: vi.fn().mockResolvedValue(undefined) };

describe('CancelTimerTool', () => {
    let timerPool: TimerPool;
    let tool: CancelTimerTool;

    beforeEach(() => {
        timerPool = new TimerPool(mockService);
        tool = new CancelTimerTool(timerPool);
    });

    it('cancels a timer', async () => {
        const timer = await timerPool.start('5m');

        const result = (await tool.execute({ timer_id: timer.id }))[0]!;
        expect(result.status).toBe(ResultStatus.Success);
        expect(result.tool).toBe('cancel_timer');

        const data = JSON.parse(result.result);
        expect(data.timer_id).toBe(timer.id);
        expect(data.status).toBe('cancelled');

        expect(await timerPool.get(timer.id)).toBeNull();
    });

    it('cancels a running timer', async () => {
        const timer = await timerPool.start('5m');

        const result = (await tool.execute({ timer_id: timer.id }))[0]!;
        expect(result.status).toBe(ResultStatus.Success);
        expect(await timerPool.get(timer.id)).toBeNull();
    });

    it('returns error for missing timer_id', async () => {
        const result = (await tool.execute({}))[0]!;
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('returns error for nonexistent timer_id', async () => {
        const result = (await tool.execute({ timer_id: 'nonexistent' }))[0]!;
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('returns error when remove throws', async () => {
        vi.spyOn(timerPool, 'remove').mockRejectedValue(new Error('remove failed'));
        const result = (await tool.execute({ timer_id: 'any' }))[0]!;
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toBe('remove failed');
    });
});
