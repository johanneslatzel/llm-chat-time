import { describe, it, expect } from 'vitest';
import { SleepRegistry } from '../../src/index.js';

describe('SleepRegistry', () => {
    it('registers sleeps and reports the active count', () => {
        const registry = new SleepRegistry();
        expect(registry.active).toBe(0);

        const signal = registry.register();
        expect(signal.aborted).toBe(false);
        expect(registry.active).toBe(1);

        registry.register();
        expect(registry.active).toBe(2);

        registry.unregister(signal);
        expect(registry.active).toBe(1);
    });

    it('unregister for a missing signal is a no-op', () => {
        const registry = new SleepRegistry();
        registry.unregister(new AbortController().signal);
        expect(registry.active).toBe(0);
    });

    it('abortAll aborts every registered signal and clears the registry', () => {
        const registry = new SleepRegistry();
        const first = registry.register();
        const second = registry.register();

        expect(registry.abortAll()).toBe(2);
        expect(first.aborted).toBe(true);
        expect(second.aborted).toBe(true);
        expect(registry.active).toBe(0);
    });

    it('abortAll with no registered sleeps returns 0', () => {
        const registry = new SleepRegistry();
        expect(registry.abortAll()).toBe(0);
        expect(registry.active).toBe(0);
    });
});
