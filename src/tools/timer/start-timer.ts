import {
    PartialToolResult,
    ResultStatus,
    Tool,
    ToolParameters,
    ToolParameterProperty
} from '@johannes.latzel/llm-chat';
import { TimerPool } from '../../lib/timer-pool.js';

export class StartTimerTool extends Tool {
    constructor(private timerPool: TimerPool) {
        super(
            'start_timer',
            'Starts a countdown timer. Provide a reminder text to have it surfaced when the timer expires.',
            new ToolParameters(
                {
                    timer_id: new ToolParameterProperty('The ID of the timer to start.'),
                    reminder: new ToolParameterProperty(
                        'Optional text to surface when the timer expires.'
                    )
                },
                ['timer_id']
            )
        );
    }

    protected async onExecute(args: Record<string, unknown>): Promise<PartialToolResult> {
        const timerId = args.timer_id;
        if (typeof timerId !== 'string' || !timerId.trim()) {
            return { result: 'timer_id must be a non-empty string.', status: ResultStatus.Error };
        }

        const reminder = args.reminder;
        if (reminder !== undefined && typeof reminder !== 'string') {
            return { result: 'reminder must be a string.', status: ResultStatus.Error };
        }

        try {
            const timer = await this.timerPool.get(timerId);
            if (!timer) {
                return {
                    result: `Error: No timer found with id '${timerId}'`,
                    status: ResultStatus.Error
                };
            }

            await timer.start(reminder as string | undefined);

            return {
                result: JSON.stringify({
                    timer_id: timerId,
                    status: 'started',
                    scheduled_end_at: new Date(Date.now() + timer.remaining).toISOString()
                }),
                status: ResultStatus.Success
            };
        } catch (e) {
            return { result: (e as Error).message, status: ResultStatus.Error };
        }
    }
}
