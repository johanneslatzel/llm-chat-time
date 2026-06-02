import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateStopwatchTool, StopwatchPool } from '../../src/index.js';
import { ResultStatus } from '@johannes.latzel/llm-chat';

describe('CreateStopwatchTool', () => {
    let stopwatchPool: StopwatchPool;
    let tool: CreateStopwatchTool;

    beforeEach(() => {
        stopwatchPool = new StopwatchPool();
        tool = new CreateStopwatchTool(stopwatchPool);
    });

    it('creates a new stopwatch with auto-incremented id', async () => {
        const result = await tool.execute({});
        expect(result.status).toBe(ResultStatus.Success);
        expect(result.tool).toBe('create_stopwatch');

        const data = JSON.parse(result.result);
        expect(data.stopwatch_id).toBe('stopwatch-1');
    });

    it('increments id on each creation', async () => {
        await tool.execute({});
        const result = await tool.execute({});
        const data = JSON.parse(result.result);
        expect(data.stopwatch_id).toBe('stopwatch-2');
    });

    it('returns error when create throws', async () => {
        vi.spyOn(stopwatchPool, 'create').mockRejectedValue(new Error('pool error'));
        const result = await tool.execute({});
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toBe('pool error');
    });
});
