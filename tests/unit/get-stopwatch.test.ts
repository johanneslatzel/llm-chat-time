import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetStopwatchTool, StopwatchPool } from '../../src/index.js';
import { ResultStatus } from '@johannes.latzel/llm-chat';

describe('GetStopwatchTool', () => {
    let stopwatchPool: StopwatchPool;
    let tool: GetStopwatchTool;

    beforeEach(() => {
        stopwatchPool = new StopwatchPool();
        tool = new GetStopwatchTool(stopwatchPool);
    });

    it('returns elapsed time of a running stopwatch', async () => {
        const sw = await stopwatchPool.create();
        await sw.start();

        const result = await tool.execute({ stopwatch_id: sw.id });
        expect(result.status).toBe(ResultStatus.Success);
        expect(result.tool).toBe('get_stopwatch');

        const data = JSON.parse(result.result);
        expect(data.stopwatch_id).toBe(sw.id);
        expect(data.elapsed).toMatch(/^-?\d+(\.\d+)?(ms|s|m|h|d)(\s+\d+(\.\d+)?(ms|s|m|h|d))*$/);
    });

    it('returns error for missing stopwatch_id', async () => {
        const result = await tool.execute({});
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('returns error for nonexistent stopwatch_id', async () => {
        const result = await tool.execute({ stopwatch_id: 'nonexistent' });
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('returns elapsed time for values >= 100 hours', async () => {
        const sw = await stopwatchPool.create();
        vi.spyOn(sw, 'elapsedMs').mockResolvedValue(360_000_000);
        const result = await tool.execute({ stopwatch_id: sw.id });
        expect(result.status).toBe(ResultStatus.Success);
        const data = JSON.parse(result.result);
        expect(data.stopwatch_id).toBe(sw.id);
        expect(data.elapsed).toMatch(/^\d+d \d+h/);
    });

    it('returns error when elapsedMs throws', async () => {
        const sw = await stopwatchPool.create();
        vi.spyOn(sw, 'elapsedMs').mockRejectedValue(new Error('elapsed failed'));
        const result = await tool.execute({ stopwatch_id: sw.id });
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toBe('elapsed failed');
    });
});
