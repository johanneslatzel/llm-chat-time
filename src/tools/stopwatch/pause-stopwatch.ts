import {
    PartialToolResult,
    ResultStatus,
    Tool,
    ToolParameters,
    ToolParameterProperty
} from '@johannes.latzel/llm-chat';
import { StopwatchPool } from '../../lib/stopwatch-pool.js';

export class PauseStopwatchTool extends Tool {
    constructor(private stopwatchPool: StopwatchPool) {
        super(
            'pause_stopwatch',
            'Pauses a running stopwatch. The elapsed time is preserved and can be resumed with start_stopwatch.',
            new ToolParameters(
                {
                    stopwatch_id: new ToolParameterProperty('The ID of the stopwatch to pause.')
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
            await sw.pause();
            return {
                result: JSON.stringify({ stopwatch_id: swId, status: 'paused' }),
                status: ResultStatus.Success
            };
        } catch (e) {
            return { result: (e as Error).message, status: ResultStatus.Error };
        }
    }
}
