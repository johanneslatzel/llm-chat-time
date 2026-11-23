import { describe, it, expect, vi, afterEach } from 'vitest';
import { TimerPackage, TimerPool, StartTimerTool } from '../../src/index.js';
import { ResultStatus } from '@johannes.latzel/llm-chat-tool';

const mockService = { notify: vi.fn().mockResolvedValue(undefined) };

describe('TimerPackage', () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('creates tools without pool', () => {
        const pkg = new TimerPackage();
        const tools = pkg.tools();
        expect(tools).toHaveLength(5);
        expect(tools[0]!.constructor.name).toBe('StartTimerTool');
        expect(tools[4]!.constructor.name).toBe('TimerExpiredTool');
    });

    it('creates tools with provided pool', () => {
        const pool = new TimerPool(mockService);
        const pkg = new TimerPackage(pool);
        const tools = pkg.tools();
        expect(tools).toHaveLength(5);
    });

    it('default timer service handles expiry without error', async () => {
        vi.useFakeTimers();
        const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
        const pkg = new TimerPackage();
        const tools = pkg.tools();
        const startTool = tools[0] as unknown as StartTimerTool;

        const startResult = (await startTool.execute({ time: '1s', reminder: 'done' }))[0]!;
        expect(startResult.status).toBe(ResultStatus.Success);

        vi.advanceTimersByTime(1000);
        expect(log).toHaveBeenCalledWith(expect.stringContaining('Reminder: done'));
    });

    it('default timer service handles expiry without reminder', async () => {
        vi.useFakeTimers();
        const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
        const pkg = new TimerPackage();
        const tools = pkg.tools();
        const startTool = tools[0] as unknown as StartTimerTool;

        await startTool.execute({ time: '1s' });

        vi.advanceTimersByTime(1000);
        expect(log).toHaveBeenCalledWith(expect.stringContaining('expired'));
    });
});
