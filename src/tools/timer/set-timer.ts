import {
    PartialToolResult,
    ResultStatus,
    Tool,
    ToolParameters,
    ToolParameterProperty
} from '@johannes.latzel/llm-chat';
import { TimerPool } from '../../lib/timer-pool.js';
import parseDuration from 'parse-duration-ms';

/** Tool that sets the duration of a non-running timer. */
export class SetTimerTool extends Tool {
    /**
     * @param timerPool - The pool containing the timer to configure.
     */
    constructor(private timerPool: TimerPool) {
        super(
            'set_timer',
            'Sets the duration of a non-running timer. Accepts strings like "5m", "1h30m", "2 days 5 hours". The timer must have been created first with create_timer.',
            new ToolParameters(
                {
                    timer_id: new ToolParameterProperty('The ID of the timer to set.'),
                    time: new ToolParameterProperty(
                        'Duration string (e.g. "5m", "1h30m", "2 days 5 hours").'
                    )
                },
                ['timer_id', 'time']
            )
        );
    }

    /** @inheritdoc */
    protected async onExecute(args: Record<string, unknown>): Promise<PartialToolResult> {
        const timerId = args.timer_id;
        if (typeof timerId !== 'string' || !timerId.trim()) {
            return { result: 'timer_id must be a non-empty string.', status: ResultStatus.Error };
        }

        const time = args.time;
        if (typeof time !== 'string' || !time.trim()) {
            return {
                result: 'time must be a non-empty duration string.',
                status: ResultStatus.Error
            };
        }

        const ms = parseDuration(time);
        if (ms === undefined || ms <= 0) {
            return { result: 'Invalid or non-positive duration.', status: ResultStatus.Error };
        }

        try {
            const timer = await this.timerPool.get(timerId);
            if (!timer) {
                return {
                    result: `Error: No timer found with id '${timerId}'`,
                    status: ResultStatus.Error
                };
            }

            await timer.set(time);
            return {
                result: JSON.stringify({ timer_id: timerId, duration: time }),
                status: ResultStatus.Success
            };
        } catch (e) {
            return { result: (e as Error).message, status: ResultStatus.Error };
        }
    }
}
