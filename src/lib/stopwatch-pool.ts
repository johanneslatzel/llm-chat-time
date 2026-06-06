import { Pool } from './pool.js';
import { Stopwatch } from './stopwatch.js';

/** A pool that manages {@link Stopwatch} instances with auto-incremented ids. */
export class StopwatchPool extends Pool<Stopwatch> {
    constructor() {
        super('stopwatch');
    }

    /** @inheritdoc */
    protected _create(id: string): Stopwatch {
        return new Stopwatch(id);
    }

    /** Stops (if running) and resets the stopwatch before it is removed. */
    protected async onRemove(sw: Stopwatch): Promise<void> {
        if (sw.running) await sw.stop();
        await sw.reset();
    }
}
