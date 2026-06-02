import { Pool } from './pool.js';
import { Timer } from './timer.js';

export class TimerPool extends Pool<Timer> {
    constructor() {
        super('timer');
    }

    protected _create(id: string): Timer {
        return new Timer(id);
    }

    protected async onRemove(timer: Timer): Promise<void> {
        await timer.reset();
    }
}
