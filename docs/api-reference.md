# API Reference

## Common patterns

All tools return a `PartialToolResult` with shape:

```typescript
{
    status: ResultStatus.Success | ResultStatus.Error;
    result: string; // JSON string on success, error message on failure
    tool: string; // tool name, e.g. "start_stopwatch"
}
```

Time values (`duration`, `remaining`, `elapsed`) are returned as human-readable strings via `pretty-ms` (e.g. `"5m"`, `"1h 30m"`, `"12.34s"`).

## TimeTool

Returns the current date/time information or calculates a timespan between two ISO 8601 datetimes.

**Tool name:** `time`

**Parameters:**

| Parameter | Type   | Required | Description                                                       |
| --------- | ------ | -------- | ----------------------------------------------------------------- |
| `from`    | string | no       | Start datetime (ISO 8601). Required if `to` is given.             |
| `to`      | string | no       | End datetime (ISO 8601). Requires `from`.                         |

**Returns (no params):** JSON with `iso`, `locale`, `date`, `time`, `timezone`, `unix_ms`, `year`, `month`, `month_name`, `day_of_month`, `day_of_week`, `day_of_week_name`, `day_of_year`, `hours`, `minutes`, `seconds`, `milliseconds`.

**Returns (from only):** `{ from, now, elapsed }` where `elapsed` is a human-readable duration (e.g. `"1h 30m"`).

**Returns (from + to):** `{ from, to, timespan }` where `timespan` is a human-readable duration (e.g. `"1d 1h 30m"`).

---

## Sleep Tool

Blocks until a duration has passed or an absolute datetime is reached, then returns. Lets an agent wait without looping and polling the time.

**Tool name:** `sleep`

**Parameters:**

| Parameter | Type   | Required | Description                                                             |
| --------- | ------ | -------- | ----------------------------------------------------------------------- |
| `time`    | string | no       | Duration string (e.g. `"5m"`, `"1h30m"`, `"2 days 5 hours"`). Mutually exclusive with `until`. |
| `until`   | string | no       | ISO 8601 datetime to block until. Must be in the future. Mutually exclusive with `time`.      |

Exactly one of `time` or `until` must be provided.

**Returns:** `{ time | until, duration_ms, elapsed }` where `elapsed` is the actual time slept as a human-readable duration (e.g. `"5.01s"`). Durations are limited to Node's maximum `setTimeout` delay of `2**31 - 1` ms (~24.8 days); anything longer is rejected with an error.

**Interruption:** every sleep is registered with a `SleepRegistry`. Pass your own instance to the `SleepTool`/`TimePackage` constructor to abort sleeps early (e.g. on shutdown); when omitted, an internal registry is created and sleeps simply run to completion. Aborting a sleep clears the pending timer and the tool returns an error result (`"Sleep was interrupted."`) instead of blocking until completion.

---

## Stopwatch Tools

Three tools for measuring elapsed time. Stopwatches start from 0 and count up.

### StopwatchPool

Manages stopwatch instances. Pass an instance to tool constructors.

```typescript
import { StopwatchPool } from 'llm-chat-time';
const pool = new StopwatchPool();
```

### StartStopwatchTool

Creates and immediately starts a new stopwatch.

**Tool name:** `start_stopwatch`

**Parameters:** None

**Returns:** `{ stopwatch_id: "stopwatch-N" }`

### StopStopwatchTool

Stops and removes a stopwatch, returning the elapsed time.

**Tool name:** `stop_stopwatch`

**Parameters:**

| Parameter      | Type   | Required | Description                            |
| -------------- | ------ | -------- | -------------------------------------- |
| `stopwatch_id` | string | yes      | ID of the stopwatch to stop and remove. |

**Returns:** `{ stopwatch_id, elapsed: "5m 30s" }`

### ListStopwatchesTool

Lists all stopwatches with their current state and elapsed time.

**Tool name:** `list_stopwatches`

**Parameters:** None

**Returns:** `{ stopwatches: [{ id, running, elapsed }] }`

---

## Timer Tools

Five tools for countdown timers. `start_timer` creates, configures, and starts a timer in a single call. On expiry the timer auto-removes from the pool. Use `cancel_timer` to stop and remove a timer early.

### TimerPool

Manages all timers — create, list, get, remove, clear.

```typescript
import { TimerPool } from 'llm-chat-time';
const pool = new TimerPool(myTimerService);
```

### Timer

The `Timer` domain class handles countdown state, expiry notification, and auto-removal.

```typescript
import { Timer } from 'llm-chat-time';
const timer = new Timer('my-timer', myService);
```

**Properties:**

| Property     | Type                        | Description                                               |
| ------------ | --------------------------- | --------------------------------------------------------- |
| `id`         | `string`                    | Timer identifier.                                         |
| `durationMs` | `number`                    | Duration in milliseconds.                                 |
| `remaining`  | `number`                    | Remaining milliseconds.                                   |
| `running`    | `boolean`                   | Whether the timer is currently counting down.             |
| `reminder`   | `string \| undefined`       | Reminder text set at start.                               |
| `service`    | `TimerService`              | Service injected via `TimerPool` for expiry notification. |

**`TimerService` interface:**

```typescript
interface TimerService {
    notify(event: TimerEvent): Promise<void>;
}
```

When the timer expires, it calls `service.notify(event)`. See the [Quick Start](quickstart.md#wire-timer-expiry-to-chatservice) for wiring examples.

### StartTimerTool

Creates, configures, and starts a countdown timer in a single call. The timer auto-removes when it expires.

**Tool name:** `start_timer`

**Parameters:**

| Parameter  | Type   | Required | Description                                                    |
| ---------- | ------ | -------- | -------------------------------------------------------------- |
| `time`     | string | yes      | Duration string (e.g. `"5m"`, `"1h30m"`, `"2 days 5 hours"`). |
| `reminder` | string | no       | Text to surface when the timer expires.                        |

**Returns:** `{ timer_id, scheduled_end_at }`

### CancelTimerTool

Cancels and removes a timer by id. Running timers are stopped first.

**Tool name:** `cancel_timer`

**Parameters:**

| Parameter  | Type   | Required | Description                 |
| ---------- | ------ | -------- | --------------------------- |
| `timer_id` | string | yes      | ID of the timer to cancel. |

**Returns:** `{ timer_id, status: "cancelled" }`

### GetTimerTool

Returns the current state of a timer by id.

**Tool name:** `get_timer`

**Parameters:**

| Parameter  | Type   | Required | Description              |
| ---------- | ------ | -------- | ------------------------ |
| `timer_id` | string | yes      | ID of the timer to get. |

**Returns:** `{ timer_id, running, duration, remaining, reminder? }`

### ListTimersTool

Lists all timers with their current state and remaining time.

**Tool name:** `list_timers`

**Parameters:** None

**Returns:** `{ timers: [{ id, running, duration, remaining, reminder? }] }`

---

## Package classes

The package classes group related tools for registration with the `llm-chat` framework. All implement the `ToolPackage` interface from `@johannes.latzel/llm-chat`.

### StopwatchPackage

Groups the three stopwatch tools. Creates a default `StopwatchPool` if none is provided.

```typescript
import { StopwatchPackage } from 'llm-chat-time';
const pkg = new StopwatchPackage();
// or with an existing pool:
const pkg = new StopwatchPackage(myPool);
```

- **Tools:** start, stop, list (3 tools)
- **Constructor:** optional `StopwatchPool`
- **`dispose()`:** not implemented

### TimerPackage

Groups the five timer tools. Creates a default `TimerPool` (with a `console.log`-based expiry handler) if none is provided.

```typescript
import { TimerPackage } from 'llm-chat-time';
const pkg = new TimerPackage();
// or with an existing pool:
const pkg = new TimerPackage(myPool);
```

- **Tools:** start, get, list, cancel, timer_expired (5 tools)
- **Constructor:** optional `TimerPool`
- **`dispose()`:** not implemented

### TimePackage

Composite package that bundles the time and sleep tools together with the stopwatch and timer sub-packages. Aggregates all 10 tools.

```typescript
import { TimePackage } from 'llm-chat-time';
const pkg = new TimePackage();
// or with existing pools and a sleep registry:
const pkg = new TimePackage(timerPool, stopwatchPool, sleepRegistry);
```

- **Tools:** time, sleep, start_stopwatch, stop_stopwatch, list_stopwatches, start_timer, get_timer, list_timers, cancel_timer, timer_expired (10 tools)
- **Constructor:** optional `TimerPool`, optional `StopwatchPool`, optional `SleepRegistry` (forwarded to the sleep tool; an internal registry is created when omitted)
- **`dispose()`:** implemented — calls `dispose?.()` on each sub-package
