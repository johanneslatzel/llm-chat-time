import { describe, it, expect, vi } from 'vitest';
import { TimePackage, TimerPool, StopwatchPool } from '../../src/index.js';

const mockService = { notifyUser: vi.fn().mockResolvedValue(undefined) };

describe('TimePackage', () => {
    it('creates all tools without pools', () => {
        const pkg = new TimePackage();
        const tools = pkg.tools();
        expect(tools).toHaveLength(16);
        expect(tools[0]!.constructor.name).toBe('GetDateTimeTool');
        expect(tools[1]!.constructor.name).toBe('DiffDateTimeTool');
        expect(tools[2]!.constructor.name).toBe('CreateStopwatchTool');
        expect(tools[9]!.constructor.name).toBe('CreateTimerTool');
    });

    it('creates all tools with provided pools', () => {
        const timerPool = new TimerPool(mockService);
        const stopwatchPool = new StopwatchPool();
        const pkg = new TimePackage(timerPool, stopwatchPool);
        expect(pkg.tools()).toHaveLength(16);
    });

    it('dispose completes successfully', async () => {
        const pkg = new TimePackage();
        await pkg.dispose();
        // sub-packages have no dispose, so this is a no-op that completes
    });
});
