import {
    PartialToolResult,
    ResultStatus,
    Tool,
    ToolParameters,
    ToolParameterProperty
} from '@johannes.latzel/llm-chat';
import { TimerPool } from '../../lib/timer-pool.js';

export class RemoveTimerTool extends Tool {
    constructor(private timerPool: TimerPool) {
        super(
            'remove_timer',
            'Removes a timer by id. If the timer is running, it will be stopped first.',
            new ToolParameters(
                {
                    timer_id: new ToolParameterProperty('The ID of the timer to remove.')
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

        try {
            await this.timerPool.remove(timerId);
            return {
                result: JSON.stringify({ timer_id: timerId, status: 'removed' }),
                status: ResultStatus.Success
            };
        } catch (e) {
            return { result: (e as Error).message, status: ResultStatus.Error };
        }
    }
}
