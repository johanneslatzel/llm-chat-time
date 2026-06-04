import { Pool } from './pool.js';
import { Timer, type TimerService } from './timer.js';

export class TimerPool extends Pool<Timer> {
    constructor(private timerService: TimerService) {
        super('timer');
    }

    protected _create(id: string): Timer {
        return new Timer(id, this.timerService);
    }

    protected async onRemove(timer: Timer): Promise<void> {
        await timer.reset();
    }
}
