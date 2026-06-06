import { PartialToolResult, ResultStatus, Tool, ToolParameters } from '@johannes.latzel/llm-chat';
import { TimerPool } from '../../lib/timer-pool.js';
import prettyMilliseconds from 'pretty-ms';

/** Tool that lists all timers with their current state and remaining time. */
export class ListTimersTool extends Tool {
    /**
     * @param timerPool - The pool to list timers from.
     */
    constructor(private timerPool: TimerPool) {
        super(
            'list_timers',
            'Lists all timers with their current state and remaining time.',
            new ToolParameters({})
        );
    }

    /** @inheritdoc */
    protected async onExecute(_args: Record<string, unknown>): Promise<PartialToolResult> {
        try {
            const timers = await this.timerPool.list();

            const timerList = await Promise.all(
                timers.map(async (timer) => {
                    const base: Record<string, unknown> = {
                        id: timer.id,
                        running: timer.running,
                        duration: prettyMilliseconds(timer.durationMs),
                        remaining: prettyMilliseconds(timer.remaining)
                    };
                    if (timer.reminder) {
                        base.reminder = timer.reminder;
                    }
                    return base;
                })
            );

            return {
                result: JSON.stringify({ timers: timerList }, null, 2),
                status: ResultStatus.Success
            };
        } catch (e) {
            return { result: (e as Error).message, status: ResultStatus.Error };
        }
    }
}
