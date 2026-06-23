import { describe, it, expect, vi, afterEach } from 'vitest';
import { TimerExpiryService, TimerExpiredTool } from '../../src/index.js';
import type { ToolCall } from '@johannes.latzel/llm-chat';

describe('TimerExpiryService', () => {
    const originalEnv = process.env.LLM_CHAT_TIME_TIMER_EXPIRED_MESSAGE;

    afterEach(() => {
        vi.restoreAllMocks();
        if (originalEnv === undefined) {
            delete process.env.LLM_CHAT_TIME_TIMER_EXPIRED_MESSAGE;
        } else {
            process.env.LLM_CHAT_TIME_TIMER_EXPIRED_MESSAGE = originalEnv;
        }
    });

    function createChat() {
        const queue = {
            assistant: vi.fn(),
            tool: vi.fn(),
        };
        const chat = {
            queue: vi.fn().mockReturnValue(queue),
            interrupt: vi.fn(),
            send: vi.fn()
        };
        return { chat, queue };
    }

    it('queues assistant message with tool call and tool result', async () => {
        const { chat, queue } = createChat();
        const service = new TimerExpiryService(chat);

        await service.notify({ timerId: 'timer-1', reminder: 'pasta is ready' });

        const assistantArgs = queue.assistant.mock.calls[0] as [string, ToolCall[]];
        expect(assistantArgs[0]).toBe('');
        const toolCalls = assistantArgs[1];
        expect(toolCalls).toHaveLength(1);
        expect(toolCalls[0]!.type).toBe('function');
        expect(toolCalls[0]!.function.name).toBe('timer_expired');
        expect(toolCalls[0]!.function.arguments).toBe('{}');
        expect(toolCalls[0]!.id).toMatch(/^timer-1-expired-\d+$/);

        const toolCallId = toolCalls[0]!.id;
        const toolArgs = queue.tool.mock.calls[0] as [string, string];
        expect(toolArgs[1]).toBe(toolCallId);

        const toolData = JSON.parse(toolArgs[0]);
        expect(toolData.timer_id).toBe('timer-1');
        expect(toolData.expired).toBe(true);
        expect(toolData.reminder).toBe('pasta is ready');
    });

    it('uses configured assistant message', async () => {
        const { chat, queue } = createChat();
        const service = new TimerExpiryService(chat, 'A timer expired.');

        await service.notify({ timerId: 'timer-1', reminder: undefined });

        expect((queue.assistant.mock.calls[0] as [string])[0]).toBe('A timer expired.');
    });

    it('falls back to env var when no message arg given', async () => {
        process.env.LLM_CHAT_TIME_TIMER_EXPIRED_MESSAGE = 'Timer expired!';
        const { chat, queue } = createChat();
        const service = new TimerExpiryService(chat);

        await service.notify({ timerId: 'timer-1', reminder: undefined });

        expect((queue.assistant.mock.calls[0] as [string])[0]).toBe('Timer expired!');
    });

    it('message arg takes priority over env var', async () => {
        process.env.LLM_CHAT_TIME_TIMER_EXPIRED_MESSAGE = 'from env';
        const { chat, queue } = createChat();
        const service = new TimerExpiryService(chat, 'from arg');

        await service.notify({ timerId: 'timer-1', reminder: undefined });

        expect((queue.assistant.mock.calls[0] as [string])[0]).toBe('from arg');
    });

    it('calls interrupt and send', async () => {
        const { chat } = createChat();
        const service = new TimerExpiryService(chat);

        await service.notify({ timerId: 'timer-1', reminder: undefined });

        expect(chat.interrupt).toHaveBeenCalledWith(true);
        expect(chat.send).toHaveBeenCalledTimes(1);
    });

    it('tool result matches TimerExpiredTool.fakeCall output', async () => {
        const { chat, queue } = createChat();
        const service = new TimerExpiryService(chat);
        const tool = new TimerExpiredTool();

        await service.notify({ timerId: 'timer-1', reminder: 'test' });

        const expected = tool.fakeCall({ timerId: 'timer-1', reminder: 'test' });
        expect((queue.tool.mock.calls[0] as [string])[0]).toBe(expected);
    });

    it('generates different tool call IDs for consecutive expiries', async () => {
        const { chat: chat1, queue: queue1 } = createChat();
        const { chat: chat2, queue: queue2 } = createChat();
        const s1 = new TimerExpiryService(chat1);
        const s2 = new TimerExpiryService(chat2);

        await s1.notify({ timerId: 'timer-1', reminder: undefined });
        await s2.notify({ timerId: 'timer-1', reminder: undefined });

        const id1 = (queue1.assistant.mock.calls[0] as [string, ToolCall[]])[1][0]!.id;
        const id2 = (queue2.assistant.mock.calls[0] as [string, ToolCall[]])[1][0]!.id;
        expect(id1).not.toBe(id2);
    });
});
