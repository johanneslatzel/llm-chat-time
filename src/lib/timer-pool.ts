import { Pool } from './pool.js';
import { Timer, type TimerService } from './timer.js';

/** A pool that manages {@link Timer} instances with auto-incremented ids. */
export class TimerPool extends Pool<Timer> {
    /**
     * @param timerService - Service passed to every new {@link Timer} so it
     *                       can interrupt the chat when it expires.
     */
    constructor(private timerService: TimerService) {
        super('timer');
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
