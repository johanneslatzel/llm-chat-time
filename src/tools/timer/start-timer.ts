import {
    PartialToolResult,
    ResultStatus,
    Tool,
    ToolParameters,
    ToolParameterProperty
} from '@johannes.latzel/llm-chat';
import { TimerPool } from '../../lib/timer-pool.js';
import parseDuration from 'parse-duration-ms';

/** Tool that creates, configures, and starts a countdown timer in one call. */
export class StartTimerTool extends Tool {
    /**
     * @param timerPool - The pool that will manage the new timer.
     */
    constructor(private timerPool: TimerPool) {
        super(
            'start_timer',
            'Creates and starts a countdown timer. Provide a duration string like "5m" or "1h30m". ' +
                'The timer will automatically notify when it expires.',
            new ToolParameters(
                {
                    time: ToolParameterProperty.string(
                        'Duration string (e.g. "5m", "1h30m", "2 days 5 hours").'
                    ),
                    reminder: ToolParameterProperty.string(
                        'Optional text to surface when the timer expires.'
                    )
                },
                ['time']
            )
        );
    }

    /** @inheritdoc */
    protected async onExecute(args: Record<string, unknown>): Promise<PartialToolResult> {
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

        const reminder = args.reminder;
        if (reminder !== undefined && typeof reminder !== 'string') {
            return { result: 'reminder must be a string.', status: ResultStatus.Error };
        }

        try {
            const timer = await this.timerPool.start(time, reminder as string | undefined);

            return {
                result: JSON.stringify({
                    timer_id: timer.id,
                    scheduled_end_at: new Date(Date.now() + timer.remaining).toISOString()
                }),
                status: ResultStatus.Success
            };
        } catch (e) {
            return { result: (e as Error).message, status: ResultStatus.Error };
        }
    }
}
