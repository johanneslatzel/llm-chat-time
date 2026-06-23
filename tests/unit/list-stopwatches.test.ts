import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListStopwatchesTool, StopwatchPool } from '../../src/index.js';
import { ResultStatus } from '@johannes.latzel/llm-chat';

describe('ListStopwatchesTool', () => {
    let stopwatchPool: StopwatchPool;
    let tool: ListStopwatchesTool;

    beforeEach(() => {
        stopwatchPool = new StopwatchPool();
        tool = new ListStopwatchesTool(stopwatchPool);
    });

    it('returns empty list when no stopwatches exist', async () => {
        const result = (await tool.execute({}))[0]!;
        expect(result.status).toBe(ResultStatus.Success);

        const data = JSON.parse(result.result);
        expect(data.stopwatches).toEqual([]);
    });

    it('lists all stopwatches', async () => {
        await stopwatchPool.create();
        await stopwatchPool.create();

        const result = (await tool.execute({}))[0]!;
        const data = JSON.parse(result.result);
        expect(data.stopwatches).toHaveLength(2);
        expect(data.stopwatches[0].id).toBe('stopwatch-1');
        expect(data.stopwatches[1].id).toBe('stopwatch-2');
    });

    it('includes running state and elapsed time', async () => {
        const sw = await stopwatchPool.create();
        await sw.start();

        const result = (await tool.execute({}))[0]!;
        const data = JSON.parse(result.result);
        expect(data.stopwatches[0]).toHaveProperty('id');
        expect(data.stopwatches[0]).toHaveProperty('running');
        expect(data.stopwatches[0]).toHaveProperty('elapsed');
    });

    it('returns error when list throws', async () => {
        vi.spyOn(stopwatchPool, 'list').mockRejectedValue(new Error('list failed'));
        const result = (await tool.execute({}))[0]!;
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toBe('list failed');
    });
});
