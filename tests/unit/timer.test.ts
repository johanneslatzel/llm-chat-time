import { describe, it, expect, vi, afterEach } from 'vitest';
import { Timer } from '../../src/index.js';

const mockService = { notifyUser: vi.fn().mockResolvedValue(undefined) };

describe('Timer', () => {
    it('creates a stopped timer with given id', () => {
        const timer = new Timer('timer-1', mockService);
        expect(timer.id).toBe('timer-1');
        expect(timer.running).toBe(false);
        expect(timer.durationMs).toBe(0);
        expect(timer.remaining).toBe(0);
    });

    it('sets duration from human-readable string', async () => {
        const timer = new Timer('timer-1', mockService);
        await timer.set('5m');
        expect(timer.durationMs).toBe(300_000);
        expect(timer.remaining).toBe(300_000);
    });

    it('throws on invalid time format', async () => {
        const timer = new Timer('timer-1', mockService);
        await expect(timer.set('abc')).rejects.toThrow('Duration must be greater than 0');
    });

    it('starts a timer with duration set', async () => {
        const timer = new Timer('timer-1', mockService);
        await timer.set('30s');
        await timer.start();
        expect(timer.running).toBe(true);
    });

    it('stores reminder text', async () => {
        const timer = new Timer('timer-1', mockService);
        await timer.set('1m');
        await timer.start('pasta is ready');
        expect(timer.reminder).toBe('pasta is ready');
    });

    it('throws setting time while running', async () => {
        const timer = new Timer('timer-1', mockService);
        await timer.set('1m');
        await timer.start();
        await expect(timer.set('2m')).rejects.toThrow('running');
    });

    it('throws on zero duration', async () => {
        const timer = new Timer('timer-1', mockService);
        await expect(timer.set('0m')).rejects.toThrow('greater than 0');
    });

    it('throws starting without duration set', async () => {
        const timer = new Timer('timer-1', mockService);
        await expect(timer.start()).rejects.toThrow('no duration');
    });

    it('ignores start on already running timer', async () => {
        const timer = new Timer('timer-1', mockService);
        await timer.set('1m');
        await timer.start();
        await timer.start();
        expect(timer.running).toBe(true);
    });

    it('pauses a running timer', async () => {
        const timer = new Timer('timer-1', mockService);
        await timer.set('1m');
        await timer.start();
        await timer.pause();
        expect(timer.running).toBe(false);
        expect(timer.remaining).toBeGreaterThan(0);
        expect(timer.remaining).toBeLessThanOrEqual(60_000);
    });

    it('throws pause on non-running timer', async () => {
        const timer = new Timer('timer-1', mockService);
        await expect(timer.pause()).rejects.toThrow('not running');
    });

    it('remainingMs returns remaining after pause', async () => {
        const timer = new Timer('timer-1', mockService);
        await timer.set('1m');
        await timer.start();
        await timer.pause();
        const remaining = await timer.remainingMs();
        expect(remaining).toBeGreaterThan(0);
        expect(remaining).toBeLessThanOrEqual(60_000);
    });

    it('remainingMs returns correct while running', async () => {
        const timer = new Timer('timer-1', mockService);
        await timer.set('1m');
        await timer.start();
        const remaining = await timer.remainingMs();
        expect(remaining).toBeGreaterThan(0);
        expect(remaining).toBeLessThanOrEqual(60_000);
    });

    it('remainingMs does not double-count elapsed time', async () => {
        const timer = new Timer('timer-1', mockService);
        await timer.set('10s');
        await timer.start();
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const remaining = await timer.remainingMs();
        expect(remaining).toBeGreaterThan(6_000);
        expect(remaining).toBeLessThanOrEqual(7_500);
    });

    it('resets timer state', async () => {
        const timer = new Timer('timer-1', mockService);
        await timer.set('5m');
        await timer.start();
        await timer.pause();
        await timer.reset();
        expect(timer.durationMs).toBe(0);
        expect(timer.remaining).toBe(0);
        expect(timer.running).toBe(false);
    });

    it('does not call notifyUser when paused before expiry', async () => {
        const notifyUser = vi.fn().mockResolvedValue(undefined);
        const timer = new Timer('timer-1', { notifyUser });
        await timer.set('1s');
        await timer.start();
        await timer.pause();
        await new Promise((resolve) => setTimeout(resolve, 200));
        expect(notifyUser).not.toHaveBeenCalled();
    });

    it('does not call notifyUser when reset before expiry', async () => {
        const notifyUser = vi.fn().mockResolvedValue(undefined);
        const timer = new Timer('timer-1', { notifyUser });
        await timer.set('1s');
        await timer.start();
        await timer.reset();
        await new Promise((resolve) => setTimeout(resolve, 200));
        expect(notifyUser).not.toHaveBeenCalled();
    });

    it('calls notifyUser with reminder on expiry', async () => {
        const notifyUser = vi.fn().mockResolvedValue(undefined);
        const timer = new Timer('timer-1', { notifyUser });
        await timer.set('1s');
        await timer.start('pasta is ready');
        await new Promise((resolve) => setTimeout(resolve, 1200));
        expect(notifyUser).toHaveBeenCalledTimes(1);
        expect(notifyUser).toHaveBeenCalledWith(
            'Timer "timer-1" expired. Reminder: pasta is ready'
        );
    });

    it('calls notifyUser without reminder', async () => {
        const notifyUser = vi.fn().mockResolvedValue(undefined);
        const timer = new Timer('timer-1', { notifyUser });
        await timer.set('1s');
        await timer.start();
        await new Promise((resolve) => setTimeout(resolve, 1200));
        expect(notifyUser).toHaveBeenCalledTimes(1);
        expect(notifyUser).toHaveBeenCalledWith('Timer "timer-1" expired.');
    });

    describe('interval callback coverage', () => {
        afterEach(() => {
            vi.useRealTimers();
        });

        it('fires tick and timer expires naturally', async () => {
            vi.useFakeTimers();
            const timer = new Timer('timer-1', mockService);
            await timer.set('1s');
            await timer.start('done');
            vi.advanceTimersByTime(1000);
            expect(timer.running).toBe(false);
            expect(timer.remaining).toBe(0);
        });

        it('guard returns early when timer not running', async () => {
            vi.useFakeTimers();
            const timer = new Timer('timer-1', mockService);
            await timer.set('1m');
            await timer.start();
            await timer.pause();
            vi.advanceTimersByTime(100);
            expect(timer.running).toBe(false);
        });

        it('clamps remaining to 0 when pause exceeds remaining', async () => {
            vi.useFakeTimers();
            const timer = new Timer('timer-1', mockService);
            await timer.set('50ms');
            await timer.start();
            vi.advanceTimersByTime(60);
            await timer.pause();
            expect(timer.remaining).toBe(0);
        });

        it('tick callback early return when interval fires after stop', async () => {
            let tickCallback: () => void;
            vi.spyOn(globalThis, 'setInterval').mockImplementation((cb: () => void) => {
                tickCallback = cb;
                return 123 as unknown as ReturnType<typeof setInterval>;
            });

            const timer = new Timer('timer-1', mockService);
            await timer.set('1m');
            await timer.start();

            await timer.pause();
            tickCallback!();

            expect(timer.running).toBe(false);
            vi.restoreAllMocks();
        });
    });
});
