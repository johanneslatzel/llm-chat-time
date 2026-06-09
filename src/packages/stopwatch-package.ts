import { type ToolPackage, type Tool } from '@johannes.latzel/llm-chat';
import { StopwatchPool } from '../lib/stopwatch-pool.js';
import { CreateStopwatchTool } from '../tools/stopwatch/create-stopwatch.js';
import { StartStopwatchTool } from '../tools/stopwatch/start-stopwatch.js';
import { StopStopwatchTool } from '../tools/stopwatch/stop-stopwatch.js';
import { PauseStopwatchTool } from '../tools/stopwatch/pause-stopwatch.js';
import { GetStopwatchTool } from '../tools/stopwatch/get-stopwatch.js';
import { ListStopwatchesTool } from '../tools/stopwatch/list-stopwatches.js';
import { RemoveStopwatchTool } from '../tools/stopwatch/remove-stopwatch.js';

/**
 * {@link ToolPackage} that bundles all seven stopwatch tools.
 * Creates a default {@link StopwatchPool} when none is provided.
 * Does not implement {@link ToolPackage.dispose}.
 */
export class StopwatchPackage implements ToolPackage {
    private _tools: Tool[];

    /**
     * @param pool - Optional stopwatch pool. A new {@link StopwatchPool} is created when omitted.
     */
    constructor(pool?: StopwatchPool) {
        const p = pool ?? new StopwatchPool();
        this._tools = [
            new CreateStopwatchTool(p),
            new StartStopwatchTool(p),
            new StopStopwatchTool(p),
            new PauseStopwatchTool(p),
            new GetStopwatchTool(p),
            new ListStopwatchesTool(p),
            new RemoveStopwatchTool(p)
        ];
    }

    tools(): Tool[] {
        return this._tools;
    }
}
