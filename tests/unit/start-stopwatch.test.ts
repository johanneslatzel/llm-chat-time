import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StartStopwatchTool, StopwatchPool } from '../../src/index.js';
import { ResultStatus } from '@johannes.latzel/llm-chat';

describe('StartStopwatchTool', () => {
    let stopwatchPool: StopwatchPool;
    let tool: StartStopwatchTool;

    beforeEach(() => {
        stopwatchPool = new StopwatchPool();
        tool = new StartStopwatchTool(stopwatchPool);
    });

    it('creates and starts a new stopwatch with auto-incremented id', async () => {
        const result = (await tool.execute({}))[0]!;
        expect(result.status).toBe(ResultStatus.Success);
        expect(result.tool).toBe('start_stopwatch');

        const data = JSON.parse(result.result);
        expect(data.stopwatch_id).toBe('stopwatch-1');
    });

    it('increments id on each creation', async () => {
        await tool.execute({});
        const result = (await tool.execute({}))[0]!;
        const data = JSON.parse(result.result);
        expect(data.stopwatch_id).toBe('stopwatch-2');
    });

    it('creates a running stopwatch', async () => {
        const result = (await tool.execute({}))[0]!;
        const data = JSON.parse(result.result);
        const sw = await stopwatchPool.get(data.stopwatch_id);
        expect(await sw?.isRunning()).toBe(true);
    });

    it('returns error when create throws', async () => {
        vi.spyOn(stopwatchPool, 'create').mockRejectedValue(new Error('pool error'));
        const result = (await tool.execute({}))[0]!;
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toBe('pool error');
    });
});
