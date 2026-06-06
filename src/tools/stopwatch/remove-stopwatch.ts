import {
    PartialToolResult,
    ResultStatus,
    Tool,
    ToolParameters,
    ToolParameterProperty
} from '@johannes.latzel/llm-chat';
import { StopwatchPool } from '../../lib/stopwatch-pool.js';

/** Tool that removes a stopwatch by id. */
export class RemoveStopwatchTool extends Tool {
    /**
     * @param stopwatchPool - The pool to remove the stopwatch from.
     */
    constructor(private stopwatchPool: StopwatchPool) {
        super(
            'remove_stopwatch',
            'Removes a stopwatch by id. If the stopwatch is running, it will be stopped first.',
            new ToolParameters(
                {
                    stopwatch_id: new ToolParameterProperty('The ID of the stopwatch to remove.')
                },
                ['stopwatch_id']
            )
        );
    }

    /** @inheritdoc */
    protected async onExecute(args: Record<string, unknown>): Promise<PartialToolResult> {
        const swId = args.stopwatch_id;
        if (typeof swId !== 'string' || !swId.trim()) {
            return {
                result: 'stopwatch_id must be a non-empty string.',
                status: ResultStatus.Error
            };
        }

        try {
            await this.stopwatchPool.remove(swId);
            return {
                result: JSON.stringify({ stopwatch_id: swId, status: 'removed' }),
                status: ResultStatus.Success
            };
        } catch (e) {
            return { result: (e as Error).message, status: ResultStatus.Error };
        }
    }
}
