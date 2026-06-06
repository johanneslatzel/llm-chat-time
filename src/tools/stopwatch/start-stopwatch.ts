import {
    PartialToolResult,
    ResultStatus,
    Tool,
    ToolParameters,
    ToolParameterProperty
} from '@johannes.latzel/llm-chat';
import { StopwatchPool } from '../../lib/stopwatch-pool.js';

/** Tool that starts an existing stopped or paused stopwatch. */
export class StartStopwatchTool extends Tool {
    /**
     * @param stopwatchPool - The pool containing the stopwatch to start.
     */
    constructor(private stopwatchPool: StopwatchPool) {
        super(
            'start_stopwatch',
            'Starts an existing stopped or paused stopwatch by ID.',
            new ToolParameters(
                {
                    stopwatch_id: new ToolParameterProperty('The ID of the stopwatch to start.')
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
            const sw = await this.stopwatchPool.get(swId);
            if (!sw) {
                return {
                    result: `No stopwatch found with id '${swId}'`,
                    status: ResultStatus.Error
                };
            }
            await sw.start();
            return {
                result: JSON.stringify({ stopwatch_id: swId, status: 'started' }),
                status: ResultStatus.Success
            };
        } catch (e) {
            return { result: (e as Error).message, status: ResultStatus.Error };
        }
    }
}
