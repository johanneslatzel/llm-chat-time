import { PartialToolResult, ResultStatus, Tool, ToolParameters } from '@johannes.latzel/llm-chat';
import { StopwatchPool } from '../../lib/stopwatch-pool.js';

export class StartStopwatchTool extends Tool {
    constructor(private stopwatchPool: StopwatchPool) {
        super(
            'start_stopwatch',
            'Creates and immediately starts a new stopwatch with an auto-incremented name (e.g. stopwatch-1).',
            new ToolParameters({})
        );
    }

    protected async onExecute(_args: Record<string, unknown>): Promise<PartialToolResult> {
        try {
            const sw = await this.stopwatchPool.create();
            await sw.start();
            return {
                result: JSON.stringify({ stopwatch_id: sw.id }),
                status: ResultStatus.Success
            };
        } catch (e) {
            return { result: (e as Error).message, status: ResultStatus.Error };
        }
    }
}
