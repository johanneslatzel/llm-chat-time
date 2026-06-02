import { Mutex } from 'async-mutex';

export class Stopwatch {
    readonly id: string;
    private _elapsedMs = 0;
    private _startedAt: number | null = null;
    private _running = false;
    private _tickInterval: ReturnType<typeof setInterval> | null = null;
    private readonly mutex = new Mutex();

    constructor(id: string) {
        this.id = id;
    }

    get running(): boolean {
        return this._running;
    }

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

    async elapsedMs(): Promise<number> {
        return this.mutex.runExclusive(() => {
            if (!this._running) return this._elapsedMs;
            return Date.now() - this._startedAt!;
        });
    }

    async isRunning(): Promise<boolean> {
        return this.mutex.runExclusive(() => this._running);
    }

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
