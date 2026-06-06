import {
    PartialToolResult,
    ResultStatus,
    Tool,
    ToolParameters,
    ToolParameterProperty
} from '@johannes.latzel/llm-chat';
import { StopwatchPool } from '../../lib/stopwatch-pool.js';

/** Tool that stops a running stopwatch. */
export class StopStopwatchTool extends Tool {
    /**
     * @param stopwatchPool - The pool containing the stopwatch to stop.
     */
    constructor(private stopwatchPool: StopwatchPool) {
        super(
            'stop_stopwatch',
            'Stops a running stopwatch and returns success or an error message.',
            new ToolParameters(
                {
                    stopwatch_id: new ToolParameterProperty('The ID of the stopwatch to stop.')
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
            await sw.stop();
            return {
                result: JSON.stringify({ stopwatch_id: swId, status: 'stopped' }),
                status: ResultStatus.Success
            };
        } catch (e) {
            return { result: (e as Error).message, status: ResultStatus.Error };
        }
    }
}
