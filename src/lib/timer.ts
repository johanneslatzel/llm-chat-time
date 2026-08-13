import { Mutex } from 'async-mutex';
import parseDuration from 'parse-duration-ms';

/** Event data passed to {@link TimerService.notify} when a timer expires. */
export interface TimerEvent {
    /** The id of the timer that expired. */
    timerId: string;
    /** Optional reminder text that was set when the timer was started. */
    reminder: string | undefined;
}

/** Service object that allows a {@link Timer} to interact with the chat layer. */
export interface TimerService {
    /** Notify the chat layer that a timer has expired. */
    notify(event: TimerEvent): Promise<void>;
}

/**
 * A countdown timer backed by a {@link TimerService} so that it can surface
 * a message when time runs out.
 */
export class Timer {
    /** Total duration of the timer in milliseconds. */
    durationMs = 0;
    /** Remaining time in milliseconds. */
    remaining = 0;
    /** Whether the timer is currently counting down. */
    running = false;
    /** Optional text to surface when the timer expires. */
    reminder: string | undefined = undefined;
    /** Whether this timer has reached zero. Set when the countdown expires. */
    expired = false;
    /** Callback invoked when the timer expires (after {@link service.notify}). */
    onExpiry?: () => void | Promise<void>;
    private _startedAt: number | null = null;
    private _tickInterval: ReturnType<typeof setInterval> | null = null;
    private readonly mutex = new Mutex();

    /**
     * @param id      - Unique identifier for this timer.
     * @param service - Service used to interrupt the chat when the timer expires.
     */
    constructor(
        readonly id: string,
        readonly service: TimerService
    ) {}

    /**
     * Sets the timer duration from a human-readable string (e.g. `"5m"`, `"1h30m"`).
     * @throws If the timer is already running.
     * @throws If the parsed duration is zero or negative.
     */
    async set(timeStr: string): Promise<void> {
        return this.mutex.runExclusive(() => {
            if (this.running) {
                throw new Error('Cannot set time on a running timer');
            }
            const ms = parseDuration(timeStr);
            if (ms === undefined || ms <= 0) {
                throw new Error('Duration must be greater than 0');
            }
            this.durationMs = ms;
            this.remaining = ms;
        });
    }

    /**
     * Starts (or resumes) the countdown.
     * @param reminder - Optional text to surface when the timer expires.
     * @throws If no duration has been set or the timer has already expired.
     */
    async start(reminder?: string): Promise<void> {
        return this.mutex.runExclusive(() => {
            if (this.running) return;
            if (this.remaining <= 0) {
                throw new Error('Timer has expired or has no duration set');
            }
            if (reminder !== undefined) {
                this.reminder = reminder;
            }
            this._startedAt = Date.now();
            this.running = true;
            this._startTick();
        });
    }

    /**
     * Pauses the countdown, preserving the remaining time so it can be resumed later.
     * @throws If the timer is not currently running.
     */
    async pause(): Promise<void> {
        return this.mutex.runExclusive(() => {
            if (!this.running) {
                throw new Error('Timer is not running');
            }
            this._stopTick();
            this.remaining -= Date.now() - this._startedAt!;
            if (this.remaining < 0) this.remaining = 0;
            this._startedAt = null;
            this.running = false;
        });
    }

    /** Returns the remaining time in milliseconds. */
    async remainingMs(): Promise<number> {
        return this.mutex.runExclusive(() => {
            if (!this.running) return this.remaining;
            return Math.max(0, this.remaining);
        });
    }

    /** Resets the timer to its initial (idle) state. */
    async reset(): Promise<void> {
        return this.mutex.runExclusive(() => {
            this._stopTick();
            this.durationMs = 0;
            this.remaining = 0;
            this.reminder = undefined;
            this._startedAt = null;
            this.running = false;
            this.expired = false;
        });
    }

    private _startTick(): void {
        const startedAt = this._startedAt!;
        const remainingAtStart = this.remaining;
        this._tickInterval = setInterval(() => {
            if (!this.running) return;
            const elapsed = Date.now() - startedAt;
            this.remaining = Math.max(0, remainingAtStart - elapsed);
            if (this.remaining <= 0) {
                clearInterval(this._tickInterval!);
                this._tickInterval = null;
                this.running = false;
                this._handleExpiry().catch(console.error);
            }
        }, 100);
    }

    private async _handleExpiry(): Promise<void> {
        this.expired = true;
        await this.service.notify({ timerId: this.id, reminder: this.reminder });
        await this.onExpiry?.();
    }

    private _stopTick(): void {
        if (this._tickInterval !== null) {
            clearInterval(this._tickInterval);
            this._tickInterval = null;
        }
    }
}
