import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StopwatchPool } from '../../src/index.js';

describe('StopwatchPool', () => {
    let pool: StopwatchPool;

    beforeEach(() => {
        pool = new StopwatchPool();
    });

    it('creates stopwatches with auto-incremented names', async () => {
        const sw1 = await pool.create();
        expect(sw1.id).toBe('stopwatch-1');
        const sw2 = await pool.create();
        expect(sw2.id).toBe('stopwatch-2');
    });

    it('starts a stopwatch', async () => {
        const sw = await pool.create();
        await sw.start();
        expect(sw.running).toBe(true);
    });

    it('pauses a stopwatch', async () => {
        const sw = await pool.create();
        await sw.start();
        await sw.pause();
        expect(sw.running).toBe(false);
    });

    it('stops a stopwatch', async () => {
        const sw = await pool.create();
        await sw.start();
        await sw.stop();
        expect(sw.running).toBe(false);
    });

    it('get returns null for nonexistent id', async () => {
        expect(await pool.get('nonexistent')).toBeNull();
    });

    it('removes a stopped stopwatch', async () => {
        const sw = await pool.create();
        await pool.remove(sw.id);
        expect(await pool.get(sw.id)).toBeNull();
    });

    it('remove stops and removes running stopwatch', async () => {
        const sw = await pool.create();
        await sw.start();
        await pool.remove(sw.id);
        expect(await pool.get(sw.id)).toBeNull();
    });

    it('remove throws for nonexistent id', async () => {
        await expect(pool.remove('nonexistent')).rejects.toThrow('nonexistent');
    });

    it('lists all stopwatches', async () => {
        await pool.create();
        await pool.create();
        expect(await pool.list()).toHaveLength(2);
    });


});


describe('StopwatchPool hooks', () => {
    it('onStart fires when a stopwatch starts', async () => {
        const pool = new StopwatchPool();
        const onStart = vi.fn();
        pool.hook().onStart().do(onStart);
        const sw = await pool.create();
        await sw.start();
        expect(onStart).toHaveBeenCalledWith({ id: 'stopwatch-1' });
    });

    it('onStop fires with the elapsed time when a stopwatch stops', async () => {
        const pool = new StopwatchPool();
        const onStop = vi.fn();
        pool.hook().onStop().do(onStop);
        const sw = await pool.create();
        await sw.start();
        await sw.stop();
        expect(onStop).toHaveBeenCalledTimes(1);
        const event = onStop.mock.calls[0]![0]! as { id: string; elapsedMs: number };
        expect(event.id).toBe('stopwatch-1');
        expect(event.elapsedMs).toBeGreaterThanOrEqual(0);
    });

    it('does not fire onStop for a stopwatch that was paused', async () => {
        const pool = new StopwatchPool();
        const onStop = vi.fn();
        pool.hook().onStop().do(onStop);
        const sw = await pool.create();
        await sw.start();
        await sw.pause();
        expect(onStop).not.toHaveBeenCalled();
    });

    it('dispose unsubscribes a registered hook', async () => {
        const pool = new StopwatchPool();
        const onStart = vi.fn();
        const hook = pool.hook().onStart().do(onStart);
        hook.dispose();
        const sw = await pool.create();
        await sw.start();
        expect(onStart).not.toHaveBeenCalled();
    });

    it('a throwing callback does not break other callbacks', async () => {
        const pool = new StopwatchPool();
        const bad = vi.fn(() => {
            throw new Error('boom');
        });
        const good = vi.fn();
        pool.hook().onStop().do(bad);
        pool.hook().onStop().do(good);
        const sw = await pool.create();
        await sw.start();
        await sw.stop();
        expect(good).toHaveBeenCalledTimes(1);
    });
});
