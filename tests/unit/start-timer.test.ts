import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StartTimerTool, TimerPool } from '../../src/index.js';
import { ResultStatus } from '@johannes.latzel/llm-chat';

const mockService = { notify: vi.fn().mockResolvedValue(undefined) };

describe('StartTimerTool', () => {
    let timerPool: TimerPool;
    let tool: StartTimerTool;

    beforeEach(() => {
        timerPool = new TimerPool(mockService);
        tool = new StartTimerTool(timerPool);
    });

    it('creates and starts a timer with time and reminder', async () => {
        const result = (await tool.execute({ time: '5m', reminder: 'done' }))[0]!;
        expect(result.status).toBe(ResultStatus.Success);
        expect(result.tool).toBe('start_timer');

        const data = JSON.parse(result.result);
        expect(data.timer_id).toBe('timer-1');
        expect(data.scheduled_end_at).toBeTruthy();

        const timer = await timerPool.get('timer-1');
        expect(timer).not.toBeNull();
        expect(timer!.running).toBe(true);
        expect(timer!.durationMs).toBe(300_000);
        expect(timer!.reminder).toBe('done');
    });

    it('creates and starts a timer without reminder', async () => {
        const result = (await tool.execute({ time: '1m' }))[0]!;
        expect(result.status).toBe(ResultStatus.Success);

        const data = JSON.parse(result.result);
        expect(data.timer_id).toBe('timer-1');

        const timer = await timerPool.get('timer-1');
        expect(timer!.reminder).toBeUndefined();
    });

    it('returns error for missing time', async () => {
        const result = (await tool.execute({}))[0]!;
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('returns error for empty time', async () => {
        const result = (await tool.execute({ time: '' }))[0]!;
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('returns error for invalid time format', async () => {
        const result = (await tool.execute({ time: 'abc' }))[0]!;
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('returns error for non-positive duration', async () => {
        const result = (await tool.execute({ time: '0m' }))[0]!;
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('returns error for non-string reminder', async () => {
        const result = (await tool.execute({ time: '1m', reminder: 42 }))[0]!;
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toContain('reminder must be a string');
    });

    it('returns error when pool.start throws', async () => {
        vi.spyOn(timerPool, 'start').mockRejectedValue(new Error('start failed'));
        const result = (await tool.execute({ time: '1m' }))[0]!;
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toBe('start failed');
    });

    it('increments timer id on each call', async () => {
        await tool.execute({ time: '1m' });
        const result = (await tool.execute({ time: '2m' }))[0]!;
        const data = JSON.parse(result.result);
        expect(data.timer_id).toBe('timer-2');
    });
});
