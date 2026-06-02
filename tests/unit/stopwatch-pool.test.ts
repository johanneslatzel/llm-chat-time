import { describe, it, expect, beforeEach } from 'vitest';
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
