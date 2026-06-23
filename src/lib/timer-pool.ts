import { Pool } from './pool.js';
import { Timer, type TimerService, type TimerEvent } from './timer.js';

type TimerServiceOrCallback = TimerService | ((event: TimerEvent) => Promise<void>);

/** A pool that manages {@link Timer} instances with auto-incremented ids. */
export class TimerPool extends Pool<Timer> {
    private timerService: TimerService;

    /**
     * @param service - A {@link TimerService} instance or a callback that will be
     *                  used as `notify`. The callback shorthand lets consumers
     *                  skip writing a full adapter class.
     *
     * @example
     * ```ts
     * // Callback shorthand (recommended)
     * const pool = new TimerPool(async (event) => {
     *     await service.queue().tool(
     *         JSON.stringify({ timer_id: event.timerId, reminder: event.reminder }),
     *         'timer_expired'
     *     );
     *     service.interrupt(true);
     *     await service.send();
     * });
     *
     * // Full interface
     * const pool = new TimerPool({ notify: async (event) => { ... } });
     * ```
     */
    constructor(service: TimerServiceOrCallback) {
        super('timer');
        this.timerService = typeof service === 'function' ? { notify: service } : service;
    }

    /**
     * Creates, configures, and starts a timer in one call.
     *
     * @param time     - Human-readable duration string (e.g. `"5m"`, `"1h30m"`).
     * @param reminder - Optional text to surface when the timer expires.
     * @returns The started timer.
     */
    async start(time: string, reminder?: string): Promise<Timer> {
        const timer = await this.create();
        await timer.set(time);
        await timer.start(reminder);
        return timer;
    }

    /** @inheritdoc */
    protected _create(id: string): Timer {
        const timer = new Timer(id, this.timerService);
        timer.onExpiry = async () => {
            try {
                await this.remove(id);
            } catch {
                // Timer was already removed (e.g. via cancel_timer)
            }
        };
        return timer;
    }

    /** Resets the timer before it is removed from the pool. */
    protected async onRemove(timer: Timer): Promise<void> {
        await timer.reset();
    }
}
