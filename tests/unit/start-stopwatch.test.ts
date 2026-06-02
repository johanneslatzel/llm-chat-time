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

    it('starts an existing stopped stopwatch by id', async () => {
        const sw = await stopwatchPool.create();

        const result = await tool.execute({ stopwatch_id: sw.id });
        expect(result.status).toBe(ResultStatus.Success);
        expect(result.tool).toBe('start_stopwatch');

        const data = JSON.parse(result.result);
        expect(data.stopwatch_id).toBe(sw.id);
        expect(data.status).toBe('started');
    });

    it('returns error for nonexistent stopwatch_id', async () => {
        const result = await tool.execute({ stopwatch_id: 'nonexistent' });
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toContain('nonexistent');
    });

    it('returns error for missing stopwatch_id', async () => {
        const result = await tool.execute({});
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toContain('stopwatch_id');
    });

    it('returns error for non-string stopwatch_id', async () => {
        const result = await tool.execute({ stopwatch_id: 42 });
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toContain('stopwatch_id must be a');
    });

    it('returns error when start throws', async () => {
        const sw = await stopwatchPool.create();
        vi.spyOn(sw, 'start').mockRejectedValue(new Error('start failed'));
        const result = await tool.execute({ stopwatch_id: sw.id });
        expect(result.status).toBe(ResultStatus.Error);
        expect(result.result).toBe('start failed');
    });
});
