/**
 * Tracks in-flight sleeps so they can be aborted collectively, for example
 * during application shutdown. Each registered sleep gets its own
 * {@link AbortSignal}; aborting that signal rejects the pending sleep with an
 * error instead of keeping the event loop alive until it finishes.
 */
export class SleepRegistry {
    private readonly controllers = new Map<AbortSignal, AbortController>();

    /**
     * Register a new sleep and return the abort signal tied to it.
     *
     * @example
     * ```ts
     * const signal = registry.register();
     * sleep(10_000, signal).catch(() => console.log('interrupted'));
     * ```
     */
    register(): AbortSignal {
        const controller = new AbortController();
        this.controllers.set(controller.signal, controller);
        return controller.signal;
    }

    /**
     * Remove a registered sleep. The given signal is released once its sleep
     * settles; calling {@link unregister} again for the same signal is a no-op.
     */
    unregister(signal: AbortSignal): void {
        this.controllers.delete(signal);
    }

    /**
     * Abort every registered sleep and clear the registry. Returns the number
     * of sleeps that were aborted.
     */
    abortAll(): number {
        const count = this.controllers.size;
        for (const controller of this.controllers.values()) {
            controller.abort();
        }
        this.controllers.clear();
        return count;
    }

    /** Number of currently registered (in-flight) sleeps. */
    get active(): number {
        return this.controllers.size;
    }
}
