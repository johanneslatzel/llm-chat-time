import { ToolPackage } from '@johannes.latzel/llm-chat';
import { StopwatchPool } from '../lib/stopwatch-pool.js';
import { StartStopwatchTool } from '../tools/stopwatch/start-stopwatch.js';
import { StopStopwatchTool } from '../tools/stopwatch/stop-stopwatch.js';
import { ListStopwatchesTool } from '../tools/stopwatch/list-stopwatches.js';

/**
 * {@link ToolPackage} that bundles all three stopwatch tools.
 * Creates a default {@link StopwatchPool} when none is provided.
 */
export class StopwatchPackage extends ToolPackage {
    /**
     * @param pool - Optional stopwatch pool. A new {@link StopwatchPool} is created when omitted.
     */
    constructor(pool?: StopwatchPool) {
        const p = pool ?? new StopwatchPool();
        super([new StartStopwatchTool(p), new StopStopwatchTool(p), new ListStopwatchesTool(p)]);
    }
}
