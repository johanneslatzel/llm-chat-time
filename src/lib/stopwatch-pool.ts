import { Pool } from './pool.js';
import { Stopwatch } from './stopwatch.js';

export class StopwatchPool extends Pool<Stopwatch> {
    constructor() {
        super('stopwatch');
    }

    protected _create(id: string): Stopwatch {
        return new Stopwatch(id);
    }

    protected async onRemove(sw: Stopwatch): Promise<void> {
        if (sw.running) await sw.stop();
        await sw.reset();
    }
}
