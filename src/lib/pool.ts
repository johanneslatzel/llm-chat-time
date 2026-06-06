import { Mutex } from 'async-mutex';

/** A minimal contract for objects that can be managed by a {@link Pool}. */
export interface Poolable {
    /** Unique identifier of this item. */
    readonly id: string;
    /** Whether the item is currently active/running. */
    readonly running: boolean;
    /** Resets the item back to its initial (idle) state. */
    reset(): Promise<void>;
}

/**
 * A thread-safe, auto-incrementing pool for {@link Poolable} items.
 *
 * @template T - The concrete item type managed by this pool.
 */
export abstract class Pool<T extends Poolable> {
    /** Mutex used to serialise all read/write access to the pool. */
    protected readonly mutex = new Mutex();
    /** Internal storage for managed items, keyed by their unique id. */
    protected _items = new Map<string, T>();
    private _counter = 0;
    private _prefix: string;

    /**
     * @param prefix - String used as the base for auto-generated item ids
     *                 (e.g. `"stopwatch"` produces ids like `"stopwatch-1"`).
     */
    constructor(prefix: string) {
        this._prefix = prefix;
    }

    /** Factory method – subclasses must return a new item for the given id. */
    protected abstract _create(id: string): T;

    /** Cleanup hook invoked right before an item is removed from the pool. */
    protected abstract onRemove(item: T): Promise<void>;

    /** Creates a new item, assigns it an auto-incremented id, and stores it. */
    async create(): Promise<T> {
        return this.mutex.runExclusive(() => {
            this._counter++;
            const item = this._create(`${this._prefix}-${this._counter}`);
            this._items.set(item.id, item);
            return item;
        });
    }

    /**
     * Retrieves an item by its id.
     * @returns The item, or `null` when no item with the given id exists.
     */
    async get(id: string): Promise<T | null> {
        return this.mutex.runExclusive(() => {
            return this._items.get(id) ?? null;
        });
    }

    /** Returns a snapshot of all items currently in the pool. */
    async list(): Promise<T[]> {
        return this.mutex.runExclusive(() => {
            return Array.from(this._items.values());
        });
    }

    /** Resets and removes every item from the pool. */
    async clearAll(): Promise<void> {
        return this.mutex.runExclusive(async () => {
            for (const item of this._items.values()) {
                await item.reset();
            }
            this._items.clear();
        });
    }

    /**
     * Removes a single item by id. Calls {@link onRemove} before deleting.
     * @throws When no item with the given id exists.
     */
    async remove(id: string): Promise<void> {
        return this.mutex.runExclusive(async () => {
            const item = this._items.get(id);
            if (!item) {
                throw new Error(`No item found with id '${id}'`);
            }
            await this.onRemove(item);
            this._items.delete(id);
        });
    }
}
