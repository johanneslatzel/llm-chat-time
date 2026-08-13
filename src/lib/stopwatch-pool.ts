import { type HasHooks, type Hook } from '@johannes.latzel/llm-chat';
import { Pool } from './pool.js';
import { Stopwatch } from './stopwatch.js';
import { EventHookBuilder, HookEmitter } from './hooks.js';

/** Event data emitted when a stopwatch starts. */
export type StopwatchStartEvent = {
    /** The id of the stopwatch that started. */
    id: string;
};

/** Event data emitted when a stopwatch stops. */
export type StopwatchStopEvent = {
    /** The id of the stopwatch that stopped. */
    id: string;
    /** Elapsed time in milliseconds at the moment it stopped. */
    elapsedMs: number;
};

type StopwatchHookRegistrations = {
    onStart: (fn: (event: StopwatchStartEvent) => void) => Hook;
    onStop: (fn: (event: StopwatchStopEvent) => void) => Hook;
};

/** Fluent entry point for registering {@link StopwatchPool} lifecycle hooks. */
export class StopwatchHookBuilder {
    constructor(private readonly registrations: StopwatchHookRegistrations) {}

    /** Register a callback for when a stopwatch starts. */
    onStart(): EventHookBuilder<StopwatchStartEvent> {
        return new EventHookBuilder(this.registrations.onStart);
    }

    /** Register a callback for when a stopwatch stops. */
    onStop(): EventHookBuilder<StopwatchStopEvent> {
        return new EventHookBuilder(this.registrations.onStop);
    }
}

/** A pool that manages {@link Stopwatch} instances with auto-incremented ids. */
export class StopwatchPool extends Pool<Stopwatch> implements HasHooks<StopwatchHookBuilder> {
    private readonly onStartEmitter = new HookEmitter<(event: StopwatchStartEvent) => void>();
    private readonly onStopEmitter = new HookEmitter<(event: StopwatchStopEvent) => void>();

    constructor() {
        super('stopwatch');
    }

    /**
     * Access the hook builder for this pool.
     * @example
     * ```ts
     * const hook = pool.hook().onStop().do((event) => console.log(event));
     * // later: hook.dispose();
     * ```
     */
    hook(): StopwatchHookBuilder {
        return new StopwatchHookBuilder({
            onStart: (fn) => this.onStartEmitter.add(fn),
            onStop: (fn) => this.onStopEmitter.add(fn)
        });
    }

    /** @inheritdoc */
    protected _create(id: string): Stopwatch {
        const sw = new Stopwatch(id);
        sw.onStart = () => {
            this.onStartEmitter.emit({ id: sw.id });
        };
        sw.onStop = (elapsedMs) => {
            this.onStopEmitter.emit({ id: sw.id, elapsedMs });
        };
        return sw;
    }

    /** Stops (if running) and resets the stopwatch before it is removed. */
    protected async onRemove(sw: Stopwatch): Promise<void> {
        if (sw.running) await sw.stop();
        await sw.reset();
    }
}
