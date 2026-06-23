import {
    PartialToolResult,
    ResultStatus,
    Tool,
    ToolParameters,
    ToolParameterProperty
} from '@johannes.latzel/llm-chat';
import { type TimerEvent } from '../../lib/timer.js';

/**
 * Tool that exists solely to support fake tool calls from {@link TimerExpiryService}.
 *
 * When invoked normally (`onExecute`) it always returns `{ expired: false }` so
 * that the LLM never observes a real expiry through this path. Use `fakeCall(event)`
 * to generate the real expiry payload for a synthetic tool-role result message.
 */
export class TimerExpiredTool extends Tool {
    constructor() {
        super(
            'timer_expired',
            'Returns whether a timer has expired at this moment. If true, the model should handle the expiry.',
            new ToolParameters(
                {
                    timer_id: ToolParameterProperty.string('The ID of the timer to check.')
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

        return {
            result: JSON.stringify({ expired: false, message: 'No timer expired at this moment.' }),
            status: ResultStatus.Success
        };
    }

    /**
     * Generates the real expiry JSON for a synthetic tool-role response.
     * Returns `{ timer_id, expired: true }` with optional `reminder` — the opposite of {@link onExecute}.
     */
    fakeCall(event: TimerEvent): string {
        return JSON.stringify({
            timer_id: event.timerId,
            expired: true,
            reminder: event.reminder
        });
    }
}
