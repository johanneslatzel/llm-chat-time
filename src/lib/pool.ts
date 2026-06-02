import { Mutex } from 'async-mutex';

export interface Poolable {
    readonly id: string;
    readonly running: boolean;
    reset(): Promise<void>;
}

export abstract class Pool<T extends Poolable> {
    protected readonly mutex = new Mutex();
    protected _items = new Map<string, T>();
    private _counter = 0;
    private _prefix: string;

    constructor(prefix: string) {
        this._prefix = prefix;
    }

    protected abstract _create(id: string): T;

    protected abstract onRemove(item: T): Promise<void>;

    async create(): Promise<T> {
        return this.mutex.runExclusive(() => {
            this._counter++;
            const item = this._create(`${this._prefix}-${this._counter}`);
            this._items.set(item.id, item);
            return item;
        });
    }

    async get(id: string): Promise<T | null> {
        return this.mutex.runExclusive(() => {
            return this._items.get(id) ?? null;
        });
    }

    async list(): Promise<T[]> {
        return this.mutex.runExclusive(() => {
            return Array.from(this._items.values());
        });
    }

    async clearAll(): Promise<void> {
        return this.mutex.runExclusive(async () => {
            for (const item of this._items.values()) {
                await item.reset();
            }
            this._items.clear();
        });
    }

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
