import { PartialToolResult, ResultStatus, Tool, ToolParameters } from '@johannes.latzel/llm-chat';
import { StopwatchPool } from '../../lib/stopwatch-pool.js';

/** Tool that creates a new stopped stopwatch with an auto-incremented id. */
export class CreateStopwatchTool extends Tool {
    /**
     * @param stopwatchPool - The pool that will manage created stopwatches.
     */
    constructor(private stopwatchPool: StopwatchPool) {
        super(
            'create_stopwatch',
            'Creates a new stopped stopwatch with an auto-incremented name (e.g. stopwatch-1). Use start_stopwatch to begin timing.',
            new ToolParameters({})
        );
    }

    /** @inheritdoc */
    protected async onExecute(_args: Record<string, unknown>): Promise<PartialToolResult> {
        try {
            const sw = await this.stopwatchPool.create();
            return {
                result: JSON.stringify({ stopwatch_id: sw.id }),
                status: ResultStatus.Success
            };
        } catch (e) {
            return { result: (e as Error).message, status: ResultStatus.Error };
        }
    }
}
