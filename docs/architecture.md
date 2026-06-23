# Architecture

## Overview

`llm-chat-time` is a consumer tool package that extends the `llm-chat` framework with time-related tools. It provides datetime retrieval, stopwatch timing, and countdown timers.

## Design

### Tool classes

Each tool extends `Tool` from `llm-chat`:

1. Constructor accepts dependencies (pools) and calls `super(name, description, params)`
2. `onExecute()` validates parameters (`typeof` guards), delegates to the pool, returns `PartialToolResult`
3. All errors are caught and returned as plain-string messages — tools never throw

### Pools and concurrency

Both `TimerPool` and `StopwatchPool` use `async-mutex` to protect shared `Map` state, since tools can be invoked in parallel. Each domain object also owns its own `Mutex` for internal state mutations.

### Stopwatch lifecycle

`start_stopwatch` creates and immediately starts a stopwatch. `stop_stopwatch` stops, removes, and returns the elapsed time. `list_stopwatches` returns all active stopwatches with their current elapsed time.

### Timer lifecycle

`start_timer({ time, reminder? })` creates, configures, and starts a timer in one call. When the countdown reaches zero, the timer calls `TimerService.notify(event)` and then auto-removes from the pool. `cancel_timer({ timer_id })` stops and removes a timer early.

### Timer expiry

The `Timer` class has a `readonly service` property of type `TimerService`. When the timer expires, it calls `service.notify(event)`. The service is injected via `TimerPool` — each timer created by the pool receives the same service instance.

`TimerPool` accepts either a `TimerService` object or a callback function (shorthand for `(event: TimerEvent) => Promise<void>`). See the [Quick Start](quickstart.md#wire-timer-expiry-to-chatservice) for usage examples.

### TimerExpiredTool and TimerExpiryService

`timer_expired` is a dummy tool that always returns `{ expired: false }` when the LLM invokes it directly. It exists solely to be registered alongside the other timer tools so that `TimerExpiryService` can synthesize a fake tool call — `TimerExpiryService.notify()` queues an assistant message with a synthetic `timer_expired` tool call, followed by a tool-role result from `TimerExpiredTool.fakeCall()` which returns the real `{ timer_id, expired: true }` payload.

### Package classes

The `ToolPackage` interface (from `@johannes.latzel/llm-chat`) groups related tools for registration:

```typescript
interface ToolPackage {
    tools(): Tool[];
    dispose?(): void | Promise<void>;
}
```

Three implementations exist:

| Class              | Tools                                                           | Constructor                           | `dispose()`     |
| ------------------ | --------------------------------------------------------------- | ------------------------------------- | --------------- |
| `StopwatchPackage` | 3 (start, stop, list)                                           | optional `StopwatchPool`              | not implemented |
| `TimerPackage`     | 5 (start, get, list, cancel, timer_expired)                     | optional `TimerPool`                  | not implemented |
| `TimePackage`      | 9 (time, stopwatch × 3, timer × 5)                              | optional `TimerPool`, `StopwatchPool` | not implemented |

`TimePackage` is the top-level composite. It includes the `TimeTool` directly plus the tools from `StopwatchPackage` and `TimerPackage`.

### Tick accuracy

Both `Timer` and `Stopwatch` use a closure-based tick pattern. On each tick, elapsed is computed as `Date.now() - startedAt`, compensating for `setInterval` drift.

## Dependencies

- `llm-chat` — framework providing `Tool`, `ToolParameters`, etc.
- `async-mutex` — concurrency protection for shared state
