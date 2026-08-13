import {
    PartialToolResult,
    ResultStatus,
    Tool,
    ToolParameters,
    ToolParameterProperty
} from '@johannes.latzel/llm-chat';
import parseDuration from 'parse-duration-ms';
import prettyMilliseconds from 'pretty-ms';
import { SleepRegistry } from '../../lib/sleep-registry.js';

/** Longest delay a single `setTimeout` can handle (~24.8 days). */
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

/** Error thrown when an in-flight sleep is aborted via its signal. */
const INTERRUPTED = 'Sleep was interrupted.';

/** Sleeps for the given duration, rejecting early when the signal aborts. */
function sleep(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const onAbort = () => {
            clearTimeout(timer);
            reject(new Error(INTERRUPTED));
        };
        const timer = setTimeout(() => {
            signal.removeEventListener('abort', onAbort);
            resolve();
        }, ms);
        signal.addEventListener('abort', onAbort, { once: true });
    });
}

/**
 * Tool that blocks until a duration has passed or an absolute datetime is
 * reached. Lets an agent wait without looping and polling the {@link TimeTool}.
 *
 * The sleep is registered with the given {@link SleepRegistry} so it can be
 * aborted early (for example on shutdown). An aborted sleep returns an error
 * result instead of blocking until completion.
 */
export class SleepTool extends Tool {
    private readonly registry: SleepRegistry;

    /** @param registry - Registry that tracks in-flight sleeps for interruption. */
    constructor(registry: SleepRegistry) {
        super(
            'sleep',
            'Blocks until the given duration has passed or the given datetime is reached, then returns. ' +
                'Use to wait without polling. Provide exactly one of "time" (duration string like "5m" or "1h30m") ' +
                'or "until" (an ISO 8601 datetime).',
            new ToolParameters(
                {
                    time: ToolParameterProperty.string(
                        'Duration to block for (e.g. "5m", "1h30m", "2 days 5 hours"). Mutually exclusive with "until".'
                    ),
                    until: ToolParameterProperty.string(
                        'ISO 8601 datetime to block until. Mutually exclusive with "time".'
                    )
                },
                []
            )
        );
        this.registry = registry;
    }

    /** @inheritdoc */
    protected async onExecute(args: Record<string, unknown>): Promise<PartialToolResult> {
        const time = args.time;
        const until = args.until;
        if (time !== undefined && typeof time !== 'string') {
            return { result: 'time must be a string.', status: ResultStatus.Error };
        }
        if (until !== undefined && typeof until !== 'string') {
            return { result: 'until must be a string.', status: ResultStatus.Error };
        }

        const timeStr = (time ?? '').trim();
        const untilStr = (until ?? '').trim();
        if (!timeStr && !untilStr) {
            return {
                result: 'Provide either a duration in "time" or a datetime in "until".',
                status: ResultStatus.Error
            };
        }
        if (timeStr && untilStr) {
            return {
                result: 'Provide only one of "time" or "until".',
                status: ResultStatus.Error
            };
        }

        let ms: number;
        if (timeStr) {
            const parsed = parseDuration(timeStr);
            if (parsed === undefined || parsed <= 0) {
                return { result: 'Invalid or non-positive duration.', status: ResultStatus.Error };
            }
            ms = parsed;
        } else {
            const target = Date.parse(untilStr);
            if (isNaN(target)) {
                return {
                    result: `'${untilStr}' is not a valid ISO 8601 datetime.`,
                    status: ResultStatus.Error
                };
            }
            ms = target - Date.now();
            if (ms <= 0) {
                return {
                    result: `'${untilStr}' is in the past.`,
                    status: ResultStatus.Error
                };
            }
        }

        if (ms > MAX_TIMEOUT_MS) {
            return {
                result: `Duration exceeds the maximum supported sleep of ${MAX_TIMEOUT_MS} ms (~24.8 days).`,
                status: ResultStatus.Error
            };
        }

        const startedAt = Date.now();
        const signal = this.registry.register();
        try {
            await sleep(ms, signal);
        } catch {
            return {
                result: INTERRUPTED,
                status: ResultStatus.Error
            };
        } finally {
            this.registry.unregister(signal);
        }
        const elapsedMs = Date.now() - startedAt;

        return {
            result: JSON.stringify({
                ...(timeStr ? { time: timeStr } : { until: untilStr }),
                duration_ms: ms,
                elapsed: prettyMilliseconds(elapsedMs)
            }),
            status: ResultStatus.Success
        };
    }
}
