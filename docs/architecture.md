# Architecture

## Overview

`llm-chat-time` is a consumer tool package that extends the `llm-chat` framework with time-related tools. It provides datetime retrieval, stopwatch timing, and countdown timers.

## Structure

```
src/
├── index.ts               barrel exports (15 tools, 4 domain classes, 2 utilities)
├── lib/
│   ├── duration.ts        parseTime / formatDuration utilities
│   ├── stopwatch.ts       Stopwatch domain class
│   ├── stopwatch-pool.ts  StopwatchPool (manages stopwatches)
│   ├── timer.ts           Timer domain class
│   └── timer-pool.ts      TimerPool (manages timers)
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
                                              ├── Timer.service.interrupt(...) (if set)
                                              │
                                              ↓
                                       stays in pool (running=false, remaining=0)
                                              │
                                              ↓
                                       remove_timer (removes from pool)
```

Timers count down from the set duration. On expiry they remain in the pool in a stopped state (`running=false`, `remaining=0`) for inspection.

### Timer expiry

The `Timer` class has an optional `service` property. When set, expiry calls `service.interrupt()` which injects a user message and triggers the LLM to respond. `TimerPool` has no involvement in expiry — it is purely a container.

```typescript
const pool = new TimerPool();
const timer = await pool.createTimer();
timer.service = {
    interrupt: (fn) => service.interrupt(fn),
    chatImpl: service.chatImpl,
};
```

When using tools, get the `Timer` from the pool after creation:

```typescript
const createResult = await createTimer.execute({});
const { timer_id } = JSON.parse(createResult.result);
const timer = await pool.getTimer(timer_id);
timer.service = { interrupt, chatImpl };
```

### Tick accuracy

Both `Timer` and `Stopwatch` use a closure-based tick pattern. On each tick, elapsed is computed as `Date.now() - startedAt`, compensating for `setInterval` drift.

## Dependencies

- `llm-chat` — framework providing `Tool`, `ToolParameters`, etc.
- `async-mutex` — concurrency protection for shared state
