import { describe, it, expect, vi } from 'vitest';
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
