import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PauseTimerTool, TimerPool } from '../../src/index.js';
import { ResultStatus } from '@johannes.latzel/llm-chat';

describe('PauseTimerTool', () => {
    let timerPool: TimerPool;
    let tool: PauseTimerTool;

    beforeEach(() => {
        timerPool = new TimerPool();
        tool = new PauseTimerTool(timerPool);
    });

    it('pauses a running timer', async () => {
        const timer = await timerPool.create();
        await timer.set('1m');
        await timer.start();

        const result = await tool.execute({ timer_id: timer.id });
        expect(result.status).toBe(ResultStatus.Success);
        expect(result.tool).toBe('pause_timer');

        const data = JSON.parse(result.result);
        expect(data.timer_id).toBe(timer.id);
        expect(data.status).toBe('paused');
    });

    it('returns error for missing timer_id', async () => {
        const result = await tool.execute({});
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('returns error for nonexistent timer_id', async () => {
        const result = await tool.execute({ timer_id: 'nonexistent' });
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('returns error when pausing a non-running timer', async () => {
        const timer = await timerPool.create();
        const result = await tool.execute({ timer_id: timer.id });
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toContain('not running');
    });

    it('returns error when pause throws', async () => {
        const timer = await timerPool.create();
        await timer.set('1m');
        await timer.start();
        vi.spyOn(timer, 'pause').mockRejectedValue(new Error('pause failed'));
        const result = await tool.execute({ timer_id: timer.id });
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toBe('pause failed');
    });
});
