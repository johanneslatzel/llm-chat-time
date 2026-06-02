import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RemoveStopwatchTool, StopwatchPool } from '../../src/index.js';
import { ResultStatus } from '@johannes.latzel/llm-chat';

describe('RemoveStopwatchTool', () => {
    let stopwatchPool: StopwatchPool;
    let tool: RemoveStopwatchTool;

    beforeEach(() => {
        stopwatchPool = new StopwatchPool();
        tool = new RemoveStopwatchTool(stopwatchPool);
    });

    it('removes a stopped stopwatch', async () => {
        const sw = await stopwatchPool.create();

        const result = await tool.execute({ stopwatch_id: sw.id });
        expect(result.status).toBe(ResultStatus.Success);
        expect(result.tool).toBe('remove_stopwatch');

        const data = JSON.parse(result.result);
        expect(data.stopwatch_id).toBe(sw.id);
        expect(data.status).toBe('removed');

        expect(await stopwatchPool.get(sw.id)).toBeNull();
    });

    it('returns error for missing stopwatch_id', async () => {
        const result = await tool.execute({});
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('returns error for nonexistent stopwatch_id', async () => {
        const result = await tool.execute({ stopwatch_id: 'nonexistent' });
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('stops and removes a running stopwatch', async () => {
        const sw = await stopwatchPool.create();
        await sw.start();
        const result = await tool.execute({ stopwatch_id: sw.id });
        expect(result.status).toBe(ResultStatus.Success);
        const data = JSON.parse(result.result);
        expect(data.status).toBe('removed');
        expect(await stopwatchPool.get(sw.id)).toBeNull();
    });

    it('returns error when remove throws', async () => {
        vi.spyOn(stopwatchPool, 'remove').mockRejectedValue(new Error('remove failed'));
        const result = await tool.execute({ stopwatch_id: 'any' });
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toBe('remove failed');
    });
});
