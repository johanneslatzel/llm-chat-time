import { describe, it, expect, vi } from 'vitest';
import { TimerPool } from '../../src/index.js';

const mockService = { notifyUser: vi.fn().mockResolvedValue(undefined) };

describe('TimerPool', () => {

    it('creates timers with auto-incremented names', async () => {
        const pool = new TimerPool(mockService);
        const t1 = await pool.create();
        expect(t1.id).toBe('timer-1');
        const t2 = await pool.create();
        expect(t2.id).toBe('timer-2');
    });

    it('gets a timer by id', async () => {
        const pool = new TimerPool(mockService);
        const timer = await pool.create();
        expect(await pool.get(timer.id)).toBe(timer);
    });

    it('removes a non-running timer', async () => {
        const pool = new TimerPool(mockService);
        const timer = await pool.create();
        await pool.remove(timer.id);
        expect(await pool.get(timer.id)).toBeNull();
    });

    it('reset and remove a running timer', async () => {
        const pool = new TimerPool(mockService);
        const timer = await pool.create();
        await timer.set('1m');
        await timer.start();
        await pool.remove(timer.id);
        expect(await pool.get(timer.id)).toBeNull();
    });

    it('remove throws for nonexistent id', async () => {
        const pool = new TimerPool(mockService);
        await expect(pool.remove('nonexistent')).rejects.toThrow('nonexistent');
    });

    it('lists all timers', async () => {
        const pool = new TimerPool(mockService);
        await pool.create();
        await pool.create();
        expect(await pool.list()).toHaveLength(2);
    });

    it('clears all timers', async () => {
        const pool = new TimerPool(mockService);
        await pool.create();
        await pool.create();
        await pool.clearAll();
        expect(await pool.list()).toHaveLength(0);
    });

    it('accepts callback shorthand and wraps it as notifyUser', async () => {
        const fn = vi.fn().mockResolvedValue(undefined);
        const pool = new TimerPool(fn);
        const timer = await pool.create();
        await timer.service.notifyUser('hello');
        expect(fn).toHaveBeenCalledWith('hello');
    });
});
