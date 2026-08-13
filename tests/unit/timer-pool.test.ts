import { describe, it, expect, vi, afterEach } from 'vitest';
import { TimerPool } from '../../src/index.js';

const mockService = { notify: vi.fn().mockResolvedValue(undefined) };

describe('TimerPool', () => {

    it('creates timers with auto-incremented names', async () => {
        const pool = new TimerPool(mockService);
        const t1 = await pool.create();
        expect(t1.id).toBe('timer-1');
        const t2 = await pool.create();
        expect(t2.id).toBe('timer-2');
    });

    it('start() creates, configures, and starts a timer', async () => {
        const pool = new TimerPool(mockService);
        const timer = await pool.start('5m', 'done');
        expect(timer.id).toBe('timer-1');
        expect(timer.durationMs).toBe(300_000);
        expect(timer.remaining).toBe(300_000);
        expect(timer.running).toBe(true);
        expect(timer.reminder).toBe('done');
    });

    it('start() without reminder', async () => {
        const pool = new TimerPool(mockService);
        const timer = await pool.start('5m');
        expect(timer.running).toBe(true);
        expect(timer.reminder).toBeUndefined();
    });

    it('gets a timer by id', async () => {
        const pool = new TimerPool(mockService);
        const timer = await pool.create();
        expect(await pool.get(timer.id)).toBe(timer);
    });

    it('removes a timer', async () => {
        const pool = new TimerPool(mockService);
        const timer = await pool.create();
        await pool.remove(timer.id);
        expect(await pool.get(timer.id)).toBeNull();
    });

    it('remove throws for nonexistent id', async () => {
        const pool = new TimerPool(mockService);
        await expect(pool.remove('nonexistent')).rejects.toThrow('nonexistent');
    });

    it('lists all timers', async () => {
        const pool = new TimerPool(mockService);
        await pool.start('5m');
        await pool.start('10m');
        expect(await pool.list()).toHaveLength(2);
    });

    it('clears all timers', async () => {
        const pool = new TimerPool(mockService);
        await pool.start('5m');
        await pool.start('10m');
        await pool.clearAll();
        expect(await pool.list()).toHaveLength(0);
    });

    it('accepts callback shorthand and wraps it as notify', async () => {
        const fn = vi.fn().mockResolvedValue(undefined);
        const pool = new TimerPool(fn);
        const timer = await pool.create();
        await timer.service.notify({ timerId: 'timer-1', reminder: undefined });
        expect(fn).toHaveBeenCalledWith({ timerId: 'timer-1', reminder: undefined });
    });
});

describe('TimerPool hooks', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('onStart fires with timer details when a timer starts', async () => {
        const pool = new TimerPool(mockService);
        const onStart = vi.fn();
        pool.hook().onStart().do(onStart);
        await pool.start('5m', 'done');
        expect(onStart).toHaveBeenCalledTimes(1);
        const event = onStart.mock.calls[0]![0]! as {
            id: string;
            durationMs: number;
            reminder: string;
            scheduledEndAt: number;
        };
        expect(event.id).toBe('timer-1');
        expect(event.durationMs).toBe(300_000);
        expect(event.reminder).toBe('done');
        expect(event.scheduledEndAt).toBeGreaterThan(Date.now() - 1000);
        expect(event.scheduledEndAt).toBeLessThanOrEqual(Date.now() + 300_000);
    });

    it('onStart omits reminder when none is set', async () => {
        const pool = new TimerPool(mockService);
        const onStart = vi.fn();
        pool.hook().onStart().do(onStart);
        await pool.start('5m');
        expect(onStart.mock.calls[0]![0]).toMatchObject({
            id: 'timer-1',
            durationMs: 300_000
        });
        expect(onStart.mock.calls[0]![0].reminder).toBeUndefined();
    });

    it('onCancel fires when a timer is cancelled before expiring', async () => {
        const pool = new TimerPool(mockService);
        const onCancel = vi.fn();
        pool.hook().onCancel().do(onCancel);
        const timer = await pool.start('5m');
        await pool.remove(timer.id);
        expect(onCancel).toHaveBeenCalledWith({ id: 'timer-1' });
    });

    it('onExpire fires with the reminder when a timer expires', async () => {
        vi.useFakeTimers();
        const pool = new TimerPool(mockService);
        const onExpire = vi.fn();
        pool.hook().onExpire().do(onExpire);
        await pool.start('1s', 'done');
        await vi.advanceTimersByTimeAsync(1200);
        expect(onExpire).toHaveBeenCalledTimes(1);
        expect(onExpire).toHaveBeenCalledWith({ id: 'timer-1', reminder: 'done' });
    });

    it('onExpire omits the reminder when none is set', async () => {
        vi.useFakeTimers();
        const pool = new TimerPool(mockService);
        const onExpire = vi.fn();
        pool.hook().onExpire().do(onExpire);
        await pool.start('1s');
        await vi.advanceTimersByTimeAsync(1200);
        expect(onExpire).toHaveBeenCalledWith({ id: 'timer-1' });
    });

    it('does not fire onCancel for a timer that expired', async () => {
        vi.useFakeTimers();
        const pool = new TimerPool(mockService);
        const onCancel = vi.fn();
        const onExpire = vi.fn();
        pool.hook().onCancel().do(onCancel);
        pool.hook().onExpire().do(onExpire);
        await pool.start('1s');
        await vi.advanceTimersByTimeAsync(1200);
        expect(onExpire).toHaveBeenCalledTimes(1);
        expect(onCancel).not.toHaveBeenCalled();
    });

    it('dispose unsubscribes a registered hook', async () => {
        const pool = new TimerPool(mockService);
        const onStart = vi.fn();
        const hook = pool.hook().onStart().do(onStart);
        hook.dispose();
        await pool.start('5m');
        expect(onStart).not.toHaveBeenCalled();
    });

    it('a throwing callback does not break other callbacks', async () => {
        const pool = new TimerPool(mockService);
        const bad = vi.fn(() => {
            throw new Error('boom');
        });
        const good = vi.fn();
        pool.hook().onStart().do(bad);
        pool.hook().onStart().do(good);
        await pool.start('5m');
        expect(good).toHaveBeenCalledTimes(1);
    });

    it('a rejected async callback is swallowed', async () => {
        const pool = new TimerPool(mockService);
        const bad = vi.fn(() => Promise.reject(new Error('boom')));
        const good = vi.fn();
        pool.hook().onStart().do(bad);
        pool.hook().onStart().do(good);
        await pool.start('5m');
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(good).toHaveBeenCalledTimes(1);
    });
});

