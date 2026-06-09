import { type ToolPackage, type Tool } from '@johannes.latzel/llm-chat';
import { TimerPool } from '../lib/timer-pool.js';
import { StopwatchPool } from '../lib/stopwatch-pool.js';
import { DateTimePackage } from './date-time-package.js';
import { StopwatchPackage } from './stopwatch-package.js';
import { TimerPackage } from './timer-package.js';

/**
 * Composite {@link ToolPackage} that wraps {@link DateTimePackage},
 * {@link StopwatchPackage}, and {@link TimerPackage} and aggregates all 16 tools.
 * Implements {@link ToolPackage.dispose} to clean up sub-packages.
 *
 * @example
 * ```ts
 * import { TimePackage } from 'llm-chat-time';
 * const pkg = new TimePackage();
 * const tools = pkg.tools(); // 16 tools
 * await pkg.dispose();
 * ```
 */
export class TimePackage implements ToolPackage {
    private _subPackages: ToolPackage[];

    /**
     * @param timerPool    - Optional timer pool, forwarded to {@link TimerPackage}.
     * @param stopwatchPool - Optional stopwatch pool, forwarded to {@link StopwatchPackage}.
     */
    constructor(timerPool?: TimerPool, stopwatchPool?: StopwatchPool) {
        this._subPackages = [
            new DateTimePackage(),
            new StopwatchPackage(stopwatchPool),
            new TimerPackage(timerPool)
        ];
    }

    tools(): Tool[] {
        return this._subPackages.flatMap((p) => p.tools());
    }

    async dispose(): Promise<void> {
        await Promise.all(this._subPackages.map((p) => p.dispose?.()));
    }
}
