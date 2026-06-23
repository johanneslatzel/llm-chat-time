import { ToolPackage } from '@johannes.latzel/llm-chat';
import { TimeTool } from '../tools/datetime/time-tool.js';
import { TimerPool } from '../lib/timer-pool.js';
import { StopwatchPool } from '../lib/stopwatch-pool.js';
import { StopwatchPackage } from './stopwatch-package.js';
import { TimerPackage } from './timer-package.js';

/**
 * Composite {@link ToolPackage} that bundles the time tool, three stopwatch tools,
 * and five timer tools for a total of 9 tools.
 *
 * @example
 * ```ts
 * import { TimePackage } from 'llm-chat-time';
 * const pkg = new TimePackage();
 * const tools = pkg.tools(); // 9 tools
 * ```
 */
export class TimePackage extends ToolPackage {
    /**
     * @param timerPool    - Optional timer pool, forwarded to {@link TimerPackage}.
     * @param stopwatchPool - Optional stopwatch pool, forwarded to {@link StopwatchPackage}.
     */
    constructor(timerPool?: TimerPool, stopwatchPool?: StopwatchPool) {
        super([
            new TimeTool(),
            ...new StopwatchPackage(stopwatchPool).tools(),
            ...new TimerPackage(timerPool).tools()
        ]);
    }
}
