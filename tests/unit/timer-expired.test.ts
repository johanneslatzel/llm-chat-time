import { describe, it, expect } from 'vitest';
import { TimerExpiredTool } from '../../src/index.js';
import { ResultStatus } from '@johannes.latzel/llm-chat';

describe('TimerExpiredTool', () => {
    it('returns expired false on normal invocation', async () => {
        const tool = new TimerExpiredTool();
        const result = (await tool.execute({ timer_id: 'timer-1' }))[0]!;
        expect(result.status).toBe(ResultStatus.Success);
        expect(result.tool).toBe('timer_expired');
        const data = JSON.parse(result.result);
        expect(data.expired).toBe(false);
        expect(data.message).toBe('No timer expired at this moment.');
    });

    it('returns expired true from fakeCall with reminder', () => {
        const tool = new TimerExpiredTool();
        const result = tool.fakeCall({ timerId: 'timer-1', reminder: 'pasta is ready' });
        const data = JSON.parse(result);
        expect(data.timer_id).toBe('timer-1');
        expect(data.expired).toBe(true);
        expect(data.reminder).toBe('pasta is ready');
    });

    it('returns expired true from fakeCall without reminder', () => {
        const tool = new TimerExpiredTool();
        const result = tool.fakeCall({ timerId: 'timer-2', reminder: undefined });
        const data = JSON.parse(result);
        expect(data.timer_id).toBe('timer-2');
        expect(data.expired).toBe(true);
        expect(data.reminder).toBeUndefined();
    });

    it('returns error for missing timer_id', async () => {
        const tool = new TimerExpiredTool();
        const result = (await tool.execute({}))[0]!;
        expect(result.status).toBe(ResultStatus.Error);
    });
});
