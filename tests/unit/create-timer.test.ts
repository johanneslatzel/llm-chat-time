import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateTimerTool, TimerPool } from '../../src/index.js';
import { ResultStatus } from '@johannes.latzel/llm-chat';

const mockService = { notifyUser: vi.fn().mockResolvedValue(undefined) };

describe('CreateTimerTool', () => {
    let timerPool: TimerPool;
    let tool: CreateTimerTool;

    beforeEach(() => {
        timerPool = new TimerPool(mockService);
        tool = new CreateTimerTool(timerPool);
    });

    it('creates a new timer with auto-incremented id', async () => {
        const result = await tool.execute({});
        expect(result.status).toBe(ResultStatus.Success);
        expect(result.tool).toBe('create_timer');

        const data = JSON.parse(result.result);
        expect(data.timer_id).toBe('timer-1');
    });

    it('increments id on each creation', async () => {
        await tool.execute({});
        const result = await tool.execute({});
        const data = JSON.parse(result.result);
        expect(data.timer_id).toBe('timer-2');
    });

    it('returns error when create throws', async () => {
        vi.spyOn(timerPool, 'create').mockRejectedValue(new Error('pool error'));
        const result = await tool.execute({});
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toBe('pool error');
    });
});
