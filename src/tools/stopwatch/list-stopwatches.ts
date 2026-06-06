import { PartialToolResult, ResultStatus, Tool, ToolParameters } from '@johannes.latzel/llm-chat';
import { StopwatchPool } from '../../lib/stopwatch-pool.js';
import prettyMilliseconds from 'pretty-ms';

/** Tool that lists all stopwatches with their current state and elapsed time. */
export class ListStopwatchesTool extends Tool {
    /**
     * @param stopwatchPool - The pool to list stopwatches from.
     */
    constructor(private stopwatchPool: StopwatchPool) {
        super(
            'list_stopwatches',
            'Lists all stopwatches with their current state and elapsed time.',
            new ToolParameters({})
        );
    }

    /** @inheritdoc */
    protected async onExecute(_args: Record<string, unknown>): Promise<PartialToolResult> {
        try {
            const stopwatches = await this.stopwatchPool.list();

            const list = await Promise.all(
                stopwatches.map(async (sw) => {
                    const elapsed = await sw.elapsedMs();
                    return {
                        id: sw.id,
                        running: await sw.isRunning(),
                        elapsed: prettyMilliseconds(elapsed)
                    };
                })
            );

            return {
                result: JSON.stringify({ stopwatches: list }, null, 2),
                status: ResultStatus.Success
            };
        } catch (e) {
            return { result: (e as Error).message, status: ResultStatus.Error };
        }
    }
}
