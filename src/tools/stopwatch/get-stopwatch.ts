import {
    PartialToolResult,
    ResultStatus,
    Tool,
    ToolParameters,
    ToolParameterProperty
} from '@johannes.latzel/llm-chat';
import { StopwatchPool } from '../../lib/stopwatch-pool.js';
import prettyMilliseconds from 'pretty-ms';

/** Tool that returns the current elapsed time of a stopwatch. */
export class GetStopwatchTool extends Tool {
    /**
     * @param stopwatchPool - The pool to look up the stopwatch from.
     */
    constructor(private stopwatchPool: StopwatchPool) {
        super(
            'get_stopwatch',
            'Returns the current elapsed time of a stopwatch as a human-readable string (e.g. "1h 30m").',
            new ToolParameters(
                {
                    stopwatch_id: new ToolParameterProperty('The ID of the stopwatch to check.')
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
                    result: `Error: No stopwatch found with id '${swId}'`,
                    status: ResultStatus.Error
                };
            }

            const elapsed = await sw.elapsedMs();

            return {
                result: JSON.stringify({
                    stopwatch_id: swId,
                    elapsed: prettyMilliseconds(elapsed)
                }),
                status: ResultStatus.Success
            };
        } catch (e) {
            return { result: (e as Error).message, status: ResultStatus.Error };
        }
    }
}
