import {
    PartialToolResult,
    ResultStatus,
    Tool,
    ToolParameters,
    ToolParameterProperty
} from '@johannes.latzel/llm-chat';
import { TimerPool } from '../../lib/timer-pool.js';
import prettyMilliseconds from 'pretty-ms';

/** Tool that returns the current state of a timer by id. */
export class GetTimerTool extends Tool {
    /**
     * @param timerPool - The pool to look up the timer from.
     */
    constructor(private timerPool: TimerPool) {
        super(
            'get_timer',
            'Returns the current state of a timer, including whether it is running, its duration, remaining time, and optional reminder.',
            new ToolParameters(
                {
                    timer_id: new ToolParameterProperty('The ID of the timer to get.')
                },
                ['timer_id']
            )
        );
    }

    /** @inheritdoc */
    protected async onExecute(args: Record<string, unknown>): Promise<PartialToolResult> {
        const timerId = args.timer_id;
        if (typeof timerId !== 'string' || !timerId.trim()) {
            return { result: 'timer_id must be a non-empty string.', status: ResultStatus.Error };
        }

        try {
            const timer = await this.timerPool.get(timerId);
            if (!timer) {
                return {
                    result: `Error: No timer found with id '${timerId}'`,
                    status: ResultStatus.Error
                };
            }

            const result: Record<string, unknown> = {
                timer_id: timerId,
                running: timer.running,
                duration: prettyMilliseconds(timer.durationMs),
                remaining: prettyMilliseconds(timer.remaining)
            };

            if (timer.reminder) {
                result.reminder = timer.reminder;
            }

            return {
                result: JSON.stringify(result),
                status: ResultStatus.Success
            };
        } catch (e) {
            return { result: (e as Error).message, status: ResultStatus.Error };
        }
    }
}
