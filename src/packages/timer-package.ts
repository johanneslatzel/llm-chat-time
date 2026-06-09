import { type ToolPackage, type Tool } from '@johannes.latzel/llm-chat';
import { TimerPool } from '../lib/timer-pool.js';
import { type TimerService } from '../lib/timer.js';
import { CreateTimerTool } from '../tools/timer/create-timer.js';
import { SetTimerTool } from '../tools/timer/set-timer.js';
import { StartTimerTool } from '../tools/timer/start-timer.js';
import { PauseTimerTool } from '../tools/timer/pause-timer.js';
import { GetTimerTool } from '../tools/timer/get-timer.js';
import { ListTimersTool } from '../tools/timer/list-timers.js';
import { RemoveTimerTool } from '../tools/timer/cancel-timer.js';

const defaultTimerService: TimerService = {
    notifyUser: async (content: string) => {
        console.log(`[timer] ${content}`);
    }
};

/**
 * {@link ToolPackage} that bundles all seven timer tools.
 * Creates a default {@link TimerPool} (with a `console.log`-based expiry handler)
 * when none is provided. Does not implement {@link ToolPackage.dispose}.
 *
 * @example
 * ```ts
 * import { TimerPackage, TimerPool } from 'llm-chat-time';
 * const pkg = new TimerPackage();
 * const tools = pkg.tools(); // 7 timer tools
 *
 * // With a custom pool:
 * const pool = new TimerPool(myService);
 * const pkg2 = new TimerPackage(pool);
 * ```
 */
export class TimerPackage implements ToolPackage {
    private _tools: Tool[];

    /**
     * @param pool - Optional timer pool. A new {@link TimerPool} with a default
     *               `console.log`-based service is created when omitted.
     */
    constructor(pool?: TimerPool) {
        const p = pool ?? new TimerPool(defaultTimerService);
        this._tools = [
            new CreateTimerTool(p),
            new SetTimerTool(p),
            new StartTimerTool(p),
            new PauseTimerTool(p),
            new GetTimerTool(p),
            new ListTimersTool(p),
            new RemoveTimerTool(p)
        ];
    }

    tools(): Tool[] {
        return this._tools;
    }
}
