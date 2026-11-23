import { envString } from '@johannes.latzel/env';
import { type MessageWriter, type ToolCall } from '@johannes.latzel/llm-chat-message';
import { type TimerService, type TimerEvent } from './timer.js';
import { TimerExpiredTool } from '../tools/timer/timer-expired.js';

const RANDOM_RANGE = 1_000_000_000;

/** Callback facade used by {@link TimerExpiryService}. */
export interface TimerChatFacade {
    queue(): MessageWriter;
    interrupt(needsResend?: boolean): void;
    send(): Promise<void>;
}

/**
 * {@link TimerService} that queues a synthetic `timer_expired` tool call when
 * a timer expires and interrupts the chat so the model resumes.
 */
export class TimerExpiryService implements TimerService {
    private tool = new TimerExpiredTool();

    constructor(
        private chat: TimerChatFacade,
        private assistantMessage?: string
    ) {}

    async notify(event: TimerEvent): Promise<void> {
        const content =
            this.assistantMessage ?? envString('LLM_CHAT_TIME_TIMER_EXPIRED_MESSAGE', '');
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
