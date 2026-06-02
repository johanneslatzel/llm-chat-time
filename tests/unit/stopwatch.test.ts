import { describe, it, expect, vi, afterEach } from 'vitest';
import { Stopwatch } from '../../src/index.js';

describe('Stopwatch', () => {
    it('creates a stopped stopwatch with given id', () => {
        const sw = new Stopwatch('stopwatch-1');
        expect(sw.id).toBe('stopwatch-1');
        expect(sw.running).toBe(false);
    });

    it('starts and begins timing', async () => {
        const sw = new Stopwatch('sw-1');
        await sw.start();
        expect(sw.running).toBe(true);
    });

    it('throws if already running', async () => {
        const sw = new Stopwatch('sw-1');
        await sw.start();
        await expect(sw.start()).rejects.toThrow('already running');
    });

    it('pauses a running stopwatch', async () => {
        const sw = new Stopwatch('sw-1');
        await sw.start();
        await sw.pause();
        expect(sw.running).toBe(false);
    });

    it('throws if pause on non-running', async () => {
        const sw = new Stopwatch('sw-1');
        await expect(sw.pause()).rejects.toThrow('not running');
    });

    it('stops a running stopwatch', async () => {
        const sw = new Stopwatch('sw-1');
        await sw.start();
        await sw.stop();
        expect(sw.running).toBe(false);
    });

    it('throws if stop on non-running', async () => {
        const sw = new Stopwatch('sw-1');
        await expect(sw.stop()).rejects.toThrow('not running');
    });

    it('elapsedMs returns 0 before start', async () => {
        const sw = new Stopwatch('sw-1');
        expect(await sw.elapsedMs()).toBe(0);
    });

    it('elapsedMs returns positive while running', async () => {
        const sw = new Stopwatch('sw-1');
        await sw.start();
        expect(await sw.elapsedMs()).toBeGreaterThanOrEqual(0);
    });

    it('elapsedMs returns accumulated after stop', async () => {
        const sw = new Stopwatch('sw-1');
        await sw.start();
        await new Promise((resolve) => setTimeout(resolve, 15));
        await sw.stop();
        const elapsed = await sw.elapsedMs();
        expect(elapsed).toBeGreaterThanOrEqual(10);
    });

    it('reset clears all state', async () => {
        const sw = new Stopwatch('sw-1');
        await sw.start();
        await sw.stop();
        await sw.reset();
        expect(await sw.elapsedMs()).toBe(0);
        expect(sw.running).toBe(false);
    });

    it('isRunning returns correct state', async () => {
        const sw = new Stopwatch('sw-1');
        expect(await sw.isRunning()).toBe(false);
        await sw.start();
        expect(await sw.isRunning()).toBe(true);
    });

    describe('interval callback coverage', () => {
        afterEach(() => {
            vi.useRealTimers();
        });

        it('fires tick and updates elapsedMs', async () => {
            vi.useFakeTimers();
            const sw = new Stopwatch('sw-1');
            await sw.start();
            vi.advanceTimersByTime(100);
            expect(await sw.elapsedMs()).toBe(100);
        });

        it('guard returns early when stopwatch not running', async () => {
            vi.useFakeTimers();
            const sw = new Stopwatch('sw-1');
            await sw.start();
            const before = await sw.elapsedMs();
            await sw.stop();
            vi.advanceTimersByTime(100);
            expect(await sw.elapsedMs()).toBe(before);
        });
    });
});
