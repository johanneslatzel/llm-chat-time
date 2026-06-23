import {
    PartialToolResult,
    ResultStatus,
    Tool,
    ToolParameters,
    ToolParameterProperty
} from '@johannes.latzel/llm-chat';
import { TimerPool } from '../../lib/timer-pool.js';

/** Tool that cancels and removes a timer by id. */
export class CancelTimerTool extends Tool {
    /**
     * @param timerPool - The pool to remove the timer from.
     */
    constructor(private timerPool: TimerPool) {
        super(
            'cancel_timer',
            'Cancels and removes a timer by id. If the timer is running, it will be stopped first.',
            new ToolParameters(
                {
                    timer_id: ToolParameterProperty.string('The ID of the timer to cancel.')
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
            await this.timerPool.remove(timerId);
            return {
                result: JSON.stringify({ timer_id: timerId, status: 'cancelled' }),
                status: ResultStatus.Success
            };
        } catch (e) {
            return { result: (e as Error).message, status: ResultStatus.Error };
        }
    }
}
