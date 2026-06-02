import { describe, it, expect, vi, afterEach } from 'vitest';
import { Timer } from '../../src/index.js';

describe('Timer', () => {
    it('creates a stopped timer with given id', () => {
        const timer = new Timer('timer-1');
        expect(timer.id).toBe('timer-1');
        expect(timer.running).toBe(false);
        expect(timer.durationMs).toBe(0);
        expect(timer.remaining).toBe(0);
    });

    it('sets duration from human-readable string', async () => {
        const timer = new Timer('timer-1');
        await timer.set('5m');
        expect(timer.durationMs).toBe(300_000);
        expect(timer.remaining).toBe(300_000);
    });

    it('throws on invalid time format', async () => {
        const timer = new Timer('timer-1');
        await expect(timer.set('abc')).rejects.toThrow('Duration must be greater than 0');
    });

    it('starts a timer with duration set', async () => {
        const timer = new Timer('timer-1');
        await timer.set('30s');
        await timer.start();
        expect(timer.running).toBe(true);
    });

    it('stores reminder text', async () => {
        const timer = new Timer('timer-1');
        await timer.set('1m');
        await timer.start('pasta is ready');
        expect(timer.reminder).toBe('pasta is ready');
    });

    it('throws setting time while running', async () => {
        const timer = new Timer('timer-1');
        await timer.set('1m');
        await timer.start();
        await expect(timer.set('2m')).rejects.toThrow('running');
    });

    it('throws on zero duration', async () => {
        const timer = new Timer('timer-1');
        await expect(timer.set('0m')).rejects.toThrow('greater than 0');
    });

    it('throws starting without duration set', async () => {
        const timer = new Timer('timer-1');
        await expect(timer.start()).rejects.toThrow('no duration');
    });

    it('ignores start on already running timer', async () => {
        const timer = new Timer('timer-1');
        await timer.set('1m');
        await timer.start();
        await timer.start();
        expect(timer.running).toBe(true);
    });

    it('pauses a running timer', async () => {
        const timer = new Timer('timer-1');
        await timer.set('1m');
        await timer.start();
        await timer.pause();
        expect(timer.running).toBe(false);
        expect(timer.remaining).toBeGreaterThan(0);
        expect(timer.remaining).toBeLessThanOrEqual(60_000);
    });

    it('throws pause on non-running timer', async () => {
        const timer = new Timer('timer-1');
        await expect(timer.pause()).rejects.toThrow('not running');
    });

    it('remainingMs returns remaining after pause', async () => {
        const timer = new Timer('timer-1');
        await timer.set('1m');
        await timer.start();
        await timer.pause();
        const remaining = await timer.remainingMs();
        expect(remaining).toBeGreaterThan(0);
        expect(remaining).toBeLessThanOrEqual(60_000);
    });

    it('remainingMs returns correct while running', async () => {
        const timer = new Timer('timer-1');
        await timer.set('1m');
        await timer.start();
        const remaining = await timer.remainingMs();
        expect(remaining).toBeGreaterThan(0);
        expect(remaining).toBeLessThanOrEqual(60_000);
    });

    it('resets timer state', async () => {
        const timer = new Timer('timer-1');
        await timer.set('5m');
        await timer.start();
        await timer.pause();
        await timer.reset();
        expect(timer.durationMs).toBe(0);
        expect(timer.remaining).toBe(0);
        expect(timer.running).toBe(false);
    });

    it('does not call service interrupt when paused', async () => {
        const timer = new Timer('timer-1');
        await timer.set('1s');
        const interrupt = vi.fn();
        timer.service = { interrupt, chatImpl: { user: vi.fn() } };
        await timer.start();
        await timer.pause();
        await new Promise((resolve) => setTimeout(resolve, 200));
        expect(interrupt).not.toHaveBeenCalled();
    });

    it('does not call service interrupt when reset', async () => {
        const timer = new Timer('timer-1');
        await timer.set('1s');
        const interrupt = vi.fn();
        timer.service = { interrupt, chatImpl: { user: vi.fn() } };
        await timer.start();
        await timer.reset();
        await new Promise((resolve) => setTimeout(resolve, 200));
        expect(interrupt).not.toHaveBeenCalled();
    });

    it('calls service interrupt with reminder on expiry', async () => {
        const user = vi.fn();
        const interrupt = vi.fn(async (fn: () => void) => { fn(); });
        const timer = new Timer('timer-1');
        timer.service = { interrupt, chatImpl: { user } };
        await timer.set('1s');
        await timer.start('pasta is ready');
        await new Promise((resolve) => setTimeout(resolve, 1200));
        expect(interrupt).toHaveBeenCalledTimes(1);
        expect(user).toHaveBeenCalledWith('Timer "timer-1" expired. Reminder: pasta is ready');
    });

    it('calls service interrupt without reminder', async () => {
        const user = vi.fn();
        const interrupt = vi.fn(async (fn: () => void) => { fn(); });
        const timer = new Timer('timer-1');
        timer.service = { interrupt, chatImpl: { user } };
        await timer.set('1s');
        await timer.start();
        await new Promise((resolve) => setTimeout(resolve, 1200));
        expect(user).toHaveBeenCalledWith('Timer "timer-1" expired.');
    });

    it('does not call interrupt without service set', async () => {
        const timer = new Timer('timer-1');
        await timer.set('1s');
        await timer.start();
        await new Promise((resolve) => setTimeout(resolve, 1200));
    });

    describe('interval callback coverage', () => {
        afterEach(() => {
            vi.useRealTimers();
        });

        it('fires tick and timer expires naturally', async () => {
            vi.useFakeTimers();
            const timer = new Timer('timer-1');
            await timer.set('1s');
            await timer.start('done');
            vi.advanceTimersByTime(1000);
            expect(timer.running).toBe(false);
            expect(timer.remaining).toBe(0);
        });

        it('guard returns early when timer not running', async () => {
            vi.useFakeTimers();
            const timer = new Timer('timer-1');
            await timer.set('1m');
            await timer.start();
            await timer.pause();
            vi.advanceTimersByTime(100);
            expect(timer.running).toBe(false);
        });
    });
});
