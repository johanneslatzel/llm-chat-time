import { Hook, HookBuilderBase } from '@johannes.latzel/llm-chat-tool';

class RegistrationHook extends Hook {
    constructor(private readonly unsubscribe: () => void) {
        super();
    }

    protected onDispose(): void {
        this.unsubscribe();
    }
}

/**
 * Best-effort event emitter for pool lifecycle hooks. Callbacks run
 * synchronously and must never break the operation that emitted the event:
 * thrown errors and rejected promises are logged.
 */
export class HookEmitter<TCallback extends (...args: never[]) => unknown> {
    private readonly callbacks = new Set<TCallback>();

    /** Register a callback and return a {@link Hook} to unsubscribe it. */
    add(callback: TCallback): Hook {
        this.callbacks.add(callback);
        return new RegistrationHook(() => {
            this.callbacks.delete(callback);
        });
    }

    /** Invoke every registered callback with the given arguments. */
    emit(...args: Parameters<TCallback>): void {
        for (const callback of this.callbacks) {
            try {
                const result = callback(...args);
                if (result instanceof Promise) {
                    result.catch((error: unknown) => {
                        console.error('Hook callback error:', error);
                    });
                }
            } catch (error) {
                console.error('Hook callback error:', error);
            }
        }
    }
}

/** Fluent selector for a single event type. Call {@link do} to register a callback. */
export class EventHookBuilder<TEvent> extends HookBuilderBase<(event: TEvent) => void> {
    constructor(private readonly register: (fn: (event: TEvent) => void) => Hook) {
        super();
    }

    /** Register the callback and return the {@link Hook}. */
    do(callback: (event: TEvent) => void): Hook {
        return this.register(callback);
    }
}
