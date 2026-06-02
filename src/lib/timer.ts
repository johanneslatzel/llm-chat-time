import { Mutex } from 'async-mutex';
import parseDuration from 'parse-duration-ms';

export interface TimerService {
    interrupt(fn: () => void | Promise<void>, sendAfter?: boolean): Promise<void>;
    chatImpl: { user(content: string): void };
}

export class Timer {
    readonly id: string;
    durationMs = 0;
    remaining = 0;
    running = false;
    reminder: string | undefined = undefined;
    service?: TimerService;
    private _startedAt: number | null = null;
    private _tickInterval: ReturnType<typeof setInterval> | null = null;
    private readonly mutex = new Mutex();

    constructor(id: string) {
        this.id = id;
    }

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

    async remainingMs(): Promise<number> {
        return this.mutex.runExclusive(() => {
            if (!this.running) return this.remaining;
            const elapsed = Date.now() - this._startedAt!;
            return Math.max(0, this.remaining - elapsed);
        });
    }

    async reset(): Promise<void> {
        return this.mutex.runExclusive(() => {
            this._stopTick();
            this.durationMs = 0;
            this.remaining = 0;
            this.reminder = undefined;
            this._startedAt = null;
            this.running = false;
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
                const svc = this.service;
                if (svc) {
                    svc.interrupt(() => {
                        const msg =
                            this.reminder !== undefined
                                ? `Timer "${this.id}" expired. Reminder: ${this.reminder}`
                                : `Timer "${this.id}" expired.`;
                        svc.chatImpl.user(msg);
                    });
                }
            }
        }, 100);
    }

    private _stopTick(): void {
        if (this._tickInterval !== null) {
            clearInterval(this._tickInterval);
            this._tickInterval = null;
        }
    }
}
