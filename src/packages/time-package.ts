import { ToolPackage } from '@johannes.latzel/llm-chat';
import { TimeTool } from '../tools/datetime/time-tool.js';
import { SleepTool } from '../tools/sleep/sleep-tool.js';
import { SleepRegistry } from '../lib/sleep-registry.js';
import { TimerPool } from '../lib/timer-pool.js';
import { StopwatchPool } from '../lib/stopwatch-pool.js';
import { StopwatchPackage } from './stopwatch-package.js';
import { TimerPackage } from './timer-package.js';

/**
 * Composite {@link ToolPackage} that bundles the time tool, the sleep tool,
 * three stopwatch tools, and five timer tools for a total of 10 tools.
 * Creates a default {@link SleepRegistry} when none is provided.
 *
 * @example
 * ```ts
 * import { TimePackage } from 'llm-chat-time';
 * const pkg = new TimePackage();
 * const tools = pkg.tools(); // 10 tools
 * ```
 */
export class TimePackage extends ToolPackage {
    /**
     * @param timerPool    - Optional timer pool, forwarded to {@link TimerPackage}.
     * @param stopwatchPool - Optional stopwatch pool, forwarded to {@link StopwatchPackage}.
     * @param sleepRegistry - Optional registry that tracks in-flight sleeps for interruption.
     *                        A new {@link SleepRegistry} is created when omitted.
     */
    constructor(
        timerPool?: TimerPool,
        stopwatchPool?: StopwatchPool,
        sleepRegistry?: SleepRegistry
    ) {
        const registry = sleepRegistry ?? new SleepRegistry();
        super([
            new TimeTool(),
            new SleepTool(registry),
            ...new StopwatchPackage(stopwatchPool).tools(),
            ...new TimerPackage(timerPool).tools()
        ]);
    }
}
