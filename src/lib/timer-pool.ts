import { type HasHooks, type Hook } from '@johannes.latzel/llm-chat';
import { Pool } from './pool.js';
import { Timer, type TimerService, type TimerEvent } from './timer.js';
import { EventHookBuilder, HookEmitter } from './hooks.js';

type TimerServiceOrCallback = TimerService | ((event: TimerEvent) => Promise<void>);

/** Event data emitted when a timer starts. */
export type TimerStartEvent = {
    /** The id of the timer that started. */
    id: string;
    /** Total duration in milliseconds. */
    durationMs: number;
    /** Optional reminder text set when the timer was started. */
    reminder?: string;
    /** Epoch milliseconds at which the countdown is scheduled to end. */
    scheduledEndAt: number;
};

/** Event data emitted when a timer expires. */
export type TimerExpireEvent = {
    /** The id of the timer that expired. */
    id: string;
    /** Optional reminder text set when the timer was started. */
    reminder?: string;
};

/** Event data emitted when a timer is cancelled before expiring. */
export type TimerCancelEvent = {
    /** The id of the timer that was cancelled. */
    id: string;
};

type TimerHookRegistrations = {
    onStart: (fn: (event: TimerStartEvent) => void) => Hook;
    onExpire: (fn: (event: TimerExpireEvent) => void) => Hook;
    onCancel: (fn: (event: TimerCancelEvent) => void) => Hook;
};

/** Fluent entry point for registering {@link TimerPool} lifecycle hooks. */
export class TimerHookBuilder {
    constructor(private readonly registrations: TimerHookRegistrations) {}

    /** Register a callback for when a timer starts. */
    onStart(): EventHookBuilder<TimerStartEvent> {
        return new EventHookBuilder(this.registrations.onStart);
    }

    /** Register a callback for when a timer expires. */
    onExpire(): EventHookBuilder<TimerExpireEvent> {
        return new EventHookBuilder(this.registrations.onExpire);
    }

    /** Register a callback for when a timer is cancelled before expiring. */
    onCancel(): EventHookBuilder<TimerCancelEvent> {
        return new EventHookBuilder(this.registrations.onCancel);
    }
}

/** A pool that manages {@link Timer} instances with auto-incremented ids. */
export class TimerPool extends Pool<Timer> implements HasHooks<TimerHookBuilder> {
    private timerService: TimerService;
    private readonly onStartEmitter = new HookEmitter<(event: TimerStartEvent) => void>();
    private readonly onExpireEmitter = new HookEmitter<(event: TimerExpireEvent) => void>();
    private readonly onCancelEmitter = new HookEmitter<(event: TimerCancelEvent) => void>();

    /**
     * @param service - A {@link TimerService} instance or a callback that will be
     *                  used as `notify`. The callback shorthand lets consumers
     *                  skip writing a full adapter class.
     *
     * @example
     * ```ts
     * // Callback shorthand (recommended)
     * const pool = new TimerPool(async (event) => {
     *     await service.queue().tool(
     *         JSON.stringify({ timer_id: event.timerId, reminder: event.reminder }),
     *         'timer_expired'
     *     );
     *     service.interrupt(true);
     *     await service.send();
     * });
     *
     * // Full interface
     * const pool = new TimerPool({ notify: async (event) => { ... } });
     * ```
     */
    constructor(service: TimerServiceOrCallback) {
        super('timer');
        this.timerService = typeof service === 'function' ? { notify: service } : service;
    }

    /**
     * Access the hook builder for this pool.
     * @example
     * ```ts
     * const hook = pool.hook().onStart().do((event) => console.log(event));
     * // later: hook.dispose();
     * ```
     */
    hook(): TimerHookBuilder {
        return new TimerHookBuilder({
            onStart: (fn) => this.onStartEmitter.add(fn),
            onExpire: (fn) => this.onExpireEmitter.add(fn),
            onCancel: (fn) => this.onCancelEmitter.add(fn)
        });
    }

    /**
     * Creates, configures, and starts a timer in one call.
     *
     * @param time     - Human-readable duration string (e.g. `"5m"`, `"1h30m"`).
     * @param reminder - Optional text to surface when the timer expires.
     * @returns The started timer.
     */
    async start(time: string, reminder?: string): Promise<Timer> {
        const timer = await this.create();
        await timer.set(time);
        await timer.start(reminder);
        this.onStartEmitter.emit({
            id: timer.id,
            durationMs: timer.durationMs,
            ...(timer.reminder !== undefined ? { reminder: timer.reminder } : {}),
            scheduledEndAt: Date.now() + timer.remaining
        });
        return timer;
    }

    /** @inheritdoc */
    protected _create(id: string): Timer {
        const timer = new Timer(id, this.timerService);
        timer.onExpiry = async () => {
            const reminder = timer.reminder;
            try {
                await this.remove(id);
            } catch {
                // Timer was already removed (e.g. via cancel_timer)
            }
            this.onExpireEmitter.emit({
                id,
                ...(reminder !== undefined ? { reminder } : {})
            });
        };
        return timer;
    }

    /** Resets the timer before it is removed from the pool. */
    protected async onRemove(timer: Timer): Promise<void> {
        const expired = timer.expired;
        await timer.reset();
        if (!expired) {
            this.onCancelEmitter.emit({ id: timer.id });
        }
    }
}
