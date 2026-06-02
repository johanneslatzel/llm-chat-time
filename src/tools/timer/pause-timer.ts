import {
    PartialToolResult,
    ResultStatus,
    Tool,
    ToolParameters,
    ToolParameterProperty
} from '@johannes.latzel/llm-chat';
import { TimerPool } from '../../lib/timer-pool.js';

export class PauseTimerTool extends Tool {
    constructor(private timerPool: TimerPool) {
        super(
            'pause_timer',
            'Pauses a running countdown timer. Resume later with start_timer using the same timer_id.',
            new ToolParameters(
                {
                    timer_id: new ToolParameterProperty('The ID of the timer to pause.')
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
            const timer = await this.timerPool.get(timerId);
            if (!timer) {
                return {
                    result: `Error: No timer found with id '${timerId}'`,
                    status: ResultStatus.Error
                };
            }

            await timer.pause();
            return {
                result: JSON.stringify({ timer_id: timerId, status: 'paused' }),
                status: ResultStatus.Success
            };
        } catch (e) {
            return { result: (e as Error).message, status: ResultStatus.Error };
        }
    }
}
