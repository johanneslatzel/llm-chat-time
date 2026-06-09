import { Pool } from './pool.js';
import { Timer, type TimerService } from './timer.js';

type TimerServiceOrCallback = TimerService | ((content: string) => Promise<void>);

/** A pool that manages {@link Timer} instances with auto-incremented ids. */
export class TimerPool extends Pool<Timer> {
    private timerService: TimerService;

    /**
     * @param service - A {@link TimerService} instance or a callback that will be
     *                  used as `notifyUser`. The callback shorthand lets consumers
     *                  skip writing a full adapter class.
     *
     * @example
     * ```ts
     * // Callback shorthand (recommended)
     * const pool = new TimerPool(async (content) => {
     *     await service.queue().user(content);
     *     service.interrupt(true);
     *     if (service.needsResend()) await service.send();
     * });
     *
     * // Full interface
     * const pool = new TimerPool({ notifyUser: async (content) => { ... } });
     * ```
     */
    constructor(service: TimerServiceOrCallback) {
        super('timer');
        this.timerService = typeof service === 'function' ? { notifyUser: service } : service;
    }

    /** @inheritdoc */
    protected _create(id: string): Timer {
        return new Timer(id, this.timerService);
    }

    /** Resets the timer before it is removed from the pool. */
    protected async onRemove(timer: Timer): Promise<void> {
        await timer.reset();
    }
}
