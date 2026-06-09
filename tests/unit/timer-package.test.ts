import { describe, it, expect, vi, afterEach } from 'vitest';
import { TimerPackage, TimerPool, CreateTimerTool, SetTimerTool, StartTimerTool } from '../../src/index.js';
import { ResultStatus } from '@johannes.latzel/llm-chat';

const mockService = { notifyUser: vi.fn().mockResolvedValue(undefined) };

describe('TimerPackage', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('creates tools without pool', () => {
        const pkg = new TimerPackage();
        const tools = pkg.tools();
        expect(tools).toHaveLength(7);
        expect(tools[0]!.constructor.name).toBe('CreateTimerTool');
        expect(tools[6]!.constructor.name).toBe('RemoveTimerTool');
    });

    it('creates tools with provided pool', () => {
        const pool = new TimerPool(mockService);
        const pkg = new TimerPackage(pool);
        const tools = pkg.tools();
        expect(tools).toHaveLength(7);
    });

    it('default timer service handles expiry without error', async () => {
        vi.useFakeTimers();
        const pkg = new TimerPackage();
        const tools = pkg.tools();
        const createTool = tools[0] as unknown as CreateTimerTool;
        const setTool = tools[1] as unknown as SetTimerTool;
        const startTool = tools[2] as unknown as StartTimerTool;

        const createResult = await createTool.execute({});
        const { timer_id } = JSON.parse(createResult.result);
        expect(createResult.status).toBe(ResultStatus.Success);

        const setResult = await setTool.execute({ timer_id, time: '1s' });
        expect(setResult.status).toBe(ResultStatus.Success);

        const startResult = await startTool.execute({ timer_id, reminder: 'done' });
        expect(startResult.status).toBe(ResultStatus.Success);

        vi.advanceTimersByTime(1000);
        // Timer expired via defaultTimerService.notifyUser (console.log) — no error expected
    });
});
