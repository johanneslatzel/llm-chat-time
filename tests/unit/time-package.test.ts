import { describe, it, expect, vi } from 'vitest';
import { TimePackage, TimerPool, StopwatchPool } from '../../src/index.js';

const mockService = { notify: vi.fn().mockResolvedValue(undefined) };

describe('TimePackage', () => {
    it('creates all tools without pools', () => {
        const pkg = new TimePackage();
        const tools = pkg.tools();
        expect(tools).toHaveLength(9);
        expect(tools[0]!.constructor.name).toBe('TimeTool');
        expect(tools[1]!.constructor.name).toBe('StartStopwatchTool');
        expect(tools[4]!.constructor.name).toBe('StartTimerTool');
        expect(tools[8]!.constructor.name).toBe('TimerExpiredTool');
    });

    it('creates all tools with provided pools', () => {
        const timerPool = new TimerPool(mockService);
        const stopwatchPool = new StopwatchPool();
        const pkg = new TimePackage(timerPool, stopwatchPool);
        expect(pkg.tools()).toHaveLength(9);
    });
});
