import { ToolPackage } from '@johannes.latzel/llm-chat';
import { TimerPool } from '../lib/timer-pool.js';
import { type TimerService } from '../lib/timer.js';
import { StartTimerTool } from '../tools/timer/start-timer.js';
import { CancelTimerTool } from '../tools/timer/cancel-timer.js';
import { GetTimerTool } from '../tools/timer/get-timer.js';
import { ListTimersTool } from '../tools/timer/list-timers.js';
import { TimerExpiredTool } from '../tools/timer/timer-expired.js';

const defaultTimerService: TimerService = {
    notify: async (event) => {
        const parts = [`[timer] "${event.timerId}" expired`];
        if (event.reminder) parts.push(`Reminder: ${event.reminder}`);
        console.log(parts.join('. '));
    }
};

/**
 * {@link ToolPackage} that bundles all five timer tools.
 * Creates a default {@link TimerPool} (with a `console.log`-based expiry handler)
 * when none is provided.
 *
 * @example
 * ```ts
 * import { TimerPackage, TimerPool } from 'llm-chat-time';
 * const pkg = new TimerPackage();
 * const tools = pkg.tools(); // 5 timer tools
 *
 * // With a custom pool:
 * const pool = new TimerPool(myService);
 * const pkg2 = new TimerPackage(pool);
 * ```
 */
export class TimerPackage extends ToolPackage {
    /**
     * @param pool - Optional timer pool. A new {@link TimerPool} with a default
     *               `console.log`-based service is created when omitted.
     */
    constructor(pool?: TimerPool) {
        const p = pool ?? new TimerPool(defaultTimerService);
        super([
            new StartTimerTool(p),
            new GetTimerTool(p),
            new ListTimersTool(p),
            new CancelTimerTool(p),
            new TimerExpiredTool()
        ]);
    }
}
