import { Mutex } from 'async-mutex';

/**
 * A simple stopwatch that can be started, paused, stopped, and reset.
 * Elapsed time is updated in-memory every 100 ms while running.
 */
export class Stopwatch {
    /** Unique identifier for this stopwatch. */
    readonly id: string;
    private _elapsedMs = 0;
    private _startedAt: number | null = null;
    private _running = false;
    private _tickInterval: ReturnType<typeof setInterval> | null = null;
    private readonly mutex = new Mutex();

    /** @param id - Unique identifier for this stopwatch. */
    constructor(id: string) {
        this.id = id;
    }

    /** Whether the stopwatch is currently timing. */
    get running(): boolean {
        return this._running;
    }

    /**
     * Starts (or restarts) the stopwatch. Any previous elapsed time is reset to zero.
     * @throws If the stopwatch is already running.
     */
    async start(): Promise<void> {
        return this.mutex.runExclusive(() => {
            if (this._running) {
                throw new Error('Stopwatch is already running');
            }
            this._elapsedMs = 0;
            this._startedAt = Date.now();
            this._running = true;
            this._startTick();
        });
    }

    /**
     * Pauses the stopwatch, preserving the elapsed time so far.
     * @throws If the stopwatch is not running.
     */
    async pause(): Promise<void> {
        return this.mutex.runExclusive(() => {
            if (!this._running) {
                throw new Error('Stopwatch is not running');
            }
            this._stopTick();
            this._elapsedMs = Date.now() - this._startedAt!;
            this._startedAt = null;
            this._running = false;
        });
    }

    /**
     * Stops the stopwatch, preserving the elapsed time so far.
     * @throws If the stopwatch is not running.
     */
    async stop(): Promise<void> {
        return this.mutex.runExclusive(() => {
            if (!this._running) {
                throw new Error('Stopwatch is not running');
            }
            this._stopTick();
            this._elapsedMs = Date.now() - this._startedAt!;
            this._startedAt = null;
            this._running = false;
        });
    }

    /** Returns the current elapsed time in milliseconds. */
    async elapsedMs(): Promise<number> {
        return this.mutex.runExclusive(() => {
            if (!this._running) return this._elapsedMs;
            return Date.now() - this._startedAt!;
        });
    }

    /** Returns `true` while the stopwatch is actively timing. */
    async isRunning(): Promise<boolean> {
        return this.mutex.runExclusive(() => this._running);
    }

    /** Resets the stopwatch to its initial (stopped) state. */
    async reset(): Promise<void> {
        return this.mutex.runExclusive(() => {
            this._stopTick();
            this._elapsedMs = 0;
            this._startedAt = null;
            this._running = false;
        });
    }

    private _startTick(): void {
        const startedAt = this._startedAt!;
        this._tickInterval = setInterval(() => {
            this._elapsedMs = Date.now() - startedAt;
        }, 100);
    }

    private _stopTick(): void {
        if (this._tickInterval !== null) {
            clearInterval(this._tickInterval);
            this._tickInterval = null;
        }
    }
}
