# Architecture

## Overview

`llm-chat-time` is a consumer tool package that extends the `llm-chat` framework with time-related tools. It provides datetime retrieval, stopwatch timing, and countdown timers.

## Structure

```
src/
├── index.ts               barrel exports
├── lib/
│   ├── stopwatch.ts       Stopwatch domain class
│   ├── stopwatch-pool.ts  StopwatchPool (manages stopwatches)
│   ├── timer.ts           Timer domain class
│   └── timer-pool.ts      TimerPool (manages timers)
├── packages/
│   ├── date-time-package.ts  DateTimePackage (2 tools)
│   ├── stopwatch-package.ts  StopwatchPackage (7 tools)
│   ├── timer-package.ts      TimerPackage (7 tools)
│   └── time-package.ts       TimePackage (composite, 16 tools)
└── tools/                 15 tool classes (one per file)
```

## Design

### Tool classes

Each tool extends `Tool` from `llm-chat`:

1. Constructor accepts dependencies (pools) and calls `super(name, description, params)`
2. `onExecute()` validates parameters (`typeof` guards), delegates to the pool, returns `PartialToolResult`
3. All errors are caught and returned as plain-string messages — tools never throw

### Pools and concurrency

Both `TimerPool` and `StopwatchPool` use `async-mutex` to protect shared `Map` state, since tools can be invoked in parallel. Each domain object also owns its own `Mutex` for internal state mutations.

### Stopwatch lifecycle

```
create_stopwatch → STOPPED → start_stopwatch → RUNNING ──→ pause_stopwatch → PAUSED
                              ↑                                │
                              └──────────────── start_stopwatch ┘
                                                │
                                                └──→ stop_stopwatch → STOPPED
                                                                       ↓
                                                             remove_stopwatch
```

Stopwatches count up from 0. Starting always resets elapsed to 0.

### Timer lifecycle

```
create_timer → IDLE → set_timer → STOPPED → start_timer → RUNNING ──→ pause_timer → PAUSED
                                        ↑                            │
                                        │   (timer expires)          │ start_timer
                                        └──── timer expires ←────────┴────────────┘
                                              │
                                              ├── Timer.service.notifyUser(...) (if set)
                                              │
                                              ↓
                                       stays in pool (running=false, remaining=0)
                                              │
                                              ↓
                                       remove_timer (removes from pool)
```

Timers count down from the set duration. On expiry they remain in the pool in a stopped state (`running=false`, `remaining=0`) for inspection.

### Timer expiry

The `Timer` class has a `readonly service` property of type `TimerService`. When the timer expires, it calls `service.notifyUser(msg)`. The service is injected via `TimerPool` — each timer created by the pool receives the same service instance.

`TimerPool` accepts either a `TimerService` object or a callback function (shorthand for `{ notifyUser: fn }`). See the [Quick Start](quickstart.md#wire-timer-expiry-to-chatservice) for usage examples.

### Package classes

The `ToolPackage` interface (from `@johannes.latzel/llm-chat`) groups related tools for registration:

```typescript
interface ToolPackage {
    tools(): Tool[];
    dispose?(): void | Promise<void>;
}
```

Four implementations exist:

| Class | Tools | Constructor | `dispose()` |
|-------|-------|-------------|-------------|
| `DateTimePackage` | 2 (`GetDateTime`, `DiffDateTime`) | none | not implemented |
| `StopwatchPackage` | 7 (create, start, stop, pause, get, list, remove) | optional `StopwatchPool` | not implemented |
| `TimerPackage` | 7 (create, set, start, pause, get, list, remove) | optional `TimerPool` | not implemented |
| `TimePackage` | 16 (all of the above) | optional `TimerPool`, `StopwatchPool` | implemented — delegates to sub-packages |

`TimePackage` is a composite that wraps the other three. It aggregates all 16 tools via `flatMap` and provides `dispose()` for lifecycle cleanup.

### Tick accuracy

Both `Timer` and `Stopwatch` use a closure-based tick pattern. On each tick, elapsed is computed as `Date.now() - startedAt`, compensating for `setInterval` drift.

## Dependencies

- `llm-chat` — framework providing `Tool`, `ToolParameters`, etc.
- `async-mutex` — concurrency protection for shared state
