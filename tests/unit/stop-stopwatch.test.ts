import { describe, it, expect, beforeEach } from 'vitest';
import { StopStopwatchTool, StopwatchPool } from '../../src/index.js';
import { ResultStatus } from '@johannes.latzel/llm-chat';

describe('StopStopwatchTool', () => {
    let stopwatchPool: StopwatchPool;
    let tool: StopStopwatchTool;

    beforeEach(() => {
        stopwatchPool = new StopwatchPool();
        tool = new StopStopwatchTool(stopwatchPool);
    });

    it('stops a running stopwatch', async () => {
        const sw = await stopwatchPool.create();
        await sw.start();

        const result = await tool.execute({ stopwatch_id: sw.id });
        expect(result.status).toBe(ResultStatus.Success);
        expect(result.tool).toBe('stop_stopwatch');

        const data = JSON.parse(result.result);
        expect(data.stopwatch_id).toBe(sw.id);
        expect(data.status).toBe('stopped');
    });

    it('returns error for missing stopwatch_id', async () => {
        const result = await tool.execute({});
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('returns error for nonexistent stopwatch_id', async () => {
        const result = await tool.execute({ stopwatch_id: 'nonexistent' });
        expect(result.status).toBe(ResultStatus.Error);
    });

    it('returns error when stopping a non-running stopwatch', async () => {
        const sw = await stopwatchPool.create();
        const result = await tool.execute({ stopwatch_id: sw.id });
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toContain('not running');
    });
});
