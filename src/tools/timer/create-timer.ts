import { PartialToolResult, ResultStatus, Tool, ToolParameters } from '@johannes.latzel/llm-chat';
import { TimerPool } from '../../lib/timer-pool.js';

/** Tool that creates a new stopped timer with an auto-incremented id. */
export class CreateTimerTool extends Tool {
    /**
     * @param timerPool - The pool that will manage created timers.
     */
    constructor(private timerPool: TimerPool) {
        super(
            'create_timer',
            'Creates a new stopped timer with an auto-incremented name (e.g. timer-1). Use set_timer to set the duration and then start_timer to begin the countdown.',
            new ToolParameters({})
        );
    }

    /** @inheritdoc */
    protected async onExecute(_args: Record<string, unknown>): Promise<PartialToolResult> {
        try {
            const timer = await this.timerPool.create();
            return {
                result: JSON.stringify({ timer_id: timer.id }),
                status: ResultStatus.Success
            };
        } catch (e) {
            return { result: (e as Error).message, status: ResultStatus.Error };
        }
    }
}
