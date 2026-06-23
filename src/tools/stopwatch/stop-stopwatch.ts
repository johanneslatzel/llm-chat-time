import {
    PartialToolResult,
    ResultStatus,
    Tool,
    ToolParameters,
    ToolParameterProperty
} from '@johannes.latzel/llm-chat';
import { StopwatchPool } from '../../lib/stopwatch-pool.js';
import prettyMilliseconds from 'pretty-ms';

export class StopStopwatchTool extends Tool {
    constructor(private stopwatchPool: StopwatchPool) {
        super(
            'stop_stopwatch',
            'Stops and removes a stopwatch, returning the elapsed time.',
            new ToolParameters(
                {
                    stopwatch_id: ToolParameterProperty.string(
                        'The ID of the stopwatch to stop and remove.'
                    )
                },
                ['stopwatch_id']
            )
        );
    }

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
            const elapsed = prettyMilliseconds(await sw.elapsedMs());
            await this.stopwatchPool.remove(swId);
            return {
                result: JSON.stringify({ stopwatch_id: swId, elapsed }),
                status: ResultStatus.Success
            };
        } catch (e) {
            return { result: (e as Error).message, status: ResultStatus.Error };
        }
    }
}
