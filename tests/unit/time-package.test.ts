import { describe, it, expect, afterEach, vi } from 'vitest';
import { TimePackage, TimerPool, StopwatchPool, SleepRegistry } from '../../src/index.js';
import { ResultStatus } from '@johannes.latzel/llm-chat';

const mockService = { notify: vi.fn().mockResolvedValue(undefined) };

describe('TimePackage', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('creates all tools without pools', () => {
        const pkg = new TimePackage();
        const tools = pkg.tools();
        expect(tools).toHaveLength(10);
        expect(tools[0]!.constructor.name).toBe('TimeTool');
        expect(tools[1]!.constructor.name).toBe('SleepTool');
        expect(tools[2]!.constructor.name).toBe('StartStopwatchTool');
        expect(tools[5]!.constructor.name).toBe('StartTimerTool');
        expect(tools[9]!.constructor.name).toBe('TimerExpiredTool');
    });

    it('creates all tools with provided pools', () => {
        const timerPool = new TimerPool(mockService);
        const stopwatchPool = new StopwatchPool();
        const pkg = new TimePackage(timerPool, stopwatchPool);
        expect(pkg.tools()).toHaveLength(10);
    });

    it('forwards a sleep registry to the sleep tool', async () => {
        vi.useFakeTimers();
        const registry = new SleepRegistry();
        const pkg = new TimePackage(undefined, undefined, registry);
        const sleepTool = pkg.tools()[1]!;

        const promise = sleepTool.execute({ time: '20ms' });
        expect(registry.active).toBe(1);

        await vi.advanceTimersByTimeAsync(20);
        await promise;
        expect(registry.active).toBe(0);
    });

    it('creates an internal sleep registry when none is provided', async () => {
        vi.useFakeTimers();
        const pkg = new TimePackage();
        const sleepTool = pkg.tools()[1]!;

        const promise = sleepTool.execute({ time: '20ms' });
        await vi.advanceTimersByTimeAsync(20);
        const result = (await promise)[0]!;
        expect(result.status).toBe(ResultStatus.Success);
    });
});
