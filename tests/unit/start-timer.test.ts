import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StartTimerTool, TimerPool } from '../../src/index.js';
import { ResultStatus } from '@johannes.latzel/llm-chat';

describe('StartTimerTool', () => {
    let timerPool: TimerPool;
    let tool: StartTimerTool;

    beforeEach(() => {
        timerPool = new TimerPool();
        tool = new StartTimerTool(timerPool);
    });

    it('starts a timer with reminder', async () => {
        const timer = await timerPool.create();
        await timer.set('1m');

        const result = await tool.execute({ timer_id: timer.id, reminder: 'done' });
        expect(result.status).toBe(ResultStatus.Success);
        expect(result.tool).toBe('start_timer');

        const data = JSON.parse(result.result);
        expect(data.timer_id).toBe(timer.id);
        expect(data.status).toBe('started');
        expect(data.scheduled_end_at).toBeTruthy();
        expect(timer.reminder).toBe('done');
    });

    it('starts a timer without reminder', async () => {
        const timer = await timerPool.create();
        await timer.set('1m');

        const result = await tool.execute({ timer_id: timer.id });
        expect(result.status).toBe(ResultStatus.Success);
        expect(timer.reminder).toBeUndefined();
    });

    it('returns error for missing timer_id', async () => {
        const result = await tool.execute({});
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('returns error for nonexistent timer_id', async () => {
        const result = await tool.execute({ timer_id: 'nonexistent' });
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('returns error for non-string reminder', async () => {
        const timer = await timerPool.create();
        const result = await tool.execute({ timer_id: timer.id, reminder: 42 });
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toContain('reminder must be a string');
    });

    it('returns error when start throws', async () => {
        const timer = await timerPool.create();
        vi.spyOn(timer, 'start').mockRejectedValue(new Error('start failed'));
        const result = await tool.execute({ timer_id: timer.id });
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toBe('start failed');
    });
});
