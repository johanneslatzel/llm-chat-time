import { type MessageWriter, type ToolCall } from '@johannes.latzel/llm-chat';
import { type TimerService, type TimerEvent } from './timer.js';
import { TimerExpiredTool } from '../tools/timer/timer-expired.js';

const RANDOM_RANGE = 1_000_000_000;

/**
 * {@link TimerService} that imitates a tool call when a timer expires.
 *
 * Queues an assistant message with a synthetic `timer_expired` tool call,
 * followed by a tool-role message with the result from
 * {@link TimerExpiredTool.fakeCall}.
 *
 * @example
 * ```ts
 * import { TimerPool, TimerExpiryService } from 'llm-chat-time';
 * const pool = new TimerPool(new TimerExpiryService(service));
 * ```
 */
export class TimerExpiryService implements TimerService {
    private tool = new TimerExpiredTool();

    constructor(
        private chat: {
            queue(): MessageWriter;
            interrupt(needsResend?: boolean): void;
            send(): Promise<void>;
        },
        private assistantMessage?: string
    ) {}

    async notify(event: TimerEvent): Promise<void> {
        const content =
            this.assistantMessage ?? process.env.LLM_CHAT_TIME_TIMER_EXPIRED_MESSAGE ?? '';
        const toolCallId = `${event.timerId}-expired-${Math.floor(Math.random() * RANDOM_RANGE)}`;

        const toolCall: ToolCall = {
            id: toolCallId,
            type: 'function',
            function: { name: 'timer_expired', arguments: '{}' }
        };

        await this.chat.queue().assistant(content, [toolCall]);
        await this.chat.queue().tool(this.tool.fakeCall(event), toolCallId);
        this.chat.interrupt(true);
        await this.chat.send();
    }
}
