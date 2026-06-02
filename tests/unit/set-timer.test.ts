import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SetTimerTool, TimerPool } from '../../src/index.js';
import { ResultStatus } from '@johannes.latzel/llm-chat';

describe('SetTimerTool', () => {
    let timerPool: TimerPool;
    let tool: SetTimerTool;

    beforeEach(() => {
        timerPool = new TimerPool();
        tool = new SetTimerTool(timerPool);
    });

    it('sets duration on an existing timer', async () => {
        const timer = await timerPool.create();

        const result = await tool.execute({ timer_id: timer.id, time: '5m' });
        expect(result.status).toBe(ResultStatus.Success);
        expect(result.tool).toBe('set_timer');

        const data = JSON.parse(result.result);
        expect(data.timer_id).toBe(timer.id);
        expect(data.duration).toBe('5m');
    });

    it('returns error for missing timer_id', async () => {
        const result = await tool.execute({ time: '1m' });
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('returns error for missing time', async () => {
        const timer = await timerPool.create();
        const result = await tool.execute({ timer_id: timer.id });
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('returns error for invalid time format', async () => {
        const timer = await timerPool.create();
        const result = await tool.execute({ timer_id: timer.id, time: 'abc' });
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('returns error for nonexistent timer_id', async () => {
        const result = await tool.execute({ timer_id: 'nonexistent', time: '1m' });
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('returns error when set throws', async () => {
        const timer = await timerPool.create();
        vi.spyOn(timer, 'set').mockRejectedValue(new Error('set failed'));
        const result = await tool.execute({ timer_id: timer.id, time: '1m' });
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toBe('set failed');
    });
});
