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

## GetDateTimeTool

Returns the current date, time, and timezone.

**Tool name:** `get_datetime`

**Parameters:** None

**Returns:** JSON with `iso`, `locale`, `date`, `time`, `timezone`, `unix_ms`, `year`, `month`, `month_name`, `day_of_month`, `day_of_week`, `day_of_week_name`, `day_of_year`, `hours`, `minutes`, `seconds`, `milliseconds`.

---

## DiffDateTimeTool

Calculates the difference between two ISO 8601 datetime strings (`a - b`).

**Tool name:** `diff_datetime`

**Parameters:**

| Parameter | Type   | Required | Description                                    |
| --------- | ------ | -------- | ---------------------------------------------- |
| `a`       | string | yes      | First datetime (ISO 8601).                     |
| `b`       | string | yes      | Second datetime (ISO 8601). Result is `a - b`. |

**Returns:** `{ a, b, difference }` where `difference` is a human-readable duration string (e.g. `"1d 1h 30m"`).

---

## Stopwatch Tools

Seven tools for measuring elapsed time. Stopwatches start from 0 and count up.

### StopwatchPool

Manages stopwatch instances. Pass an instance to tool constructors.

```typescript
import { StopwatchPool } from 'llm-chat-time';
const pool = new StopwatchPool();
```

### CreateStopwatchTool

Creates a new stopped stopwatch.

**Tool name:** `create_stopwatch`

**Parameters:** None

**Returns:** `{ stopwatch_id: "stopwatch-N" }`

### StartStopwatchTool

Starts an existing stopped or paused stopwatch by ID.

**Tool name:** `start_stopwatch`

**Parameters:**

| Parameter      | Type   | Required | Description                   |
| -------------- | ------ | -------- | ----------------------------- |
| `stopwatch_id` | string | yes      | ID of the stopwatch to start. |

**Returns:** `{ stopwatch_id, status: "started" }`

### StopStopwatchTool

Stops a running stopwatch.

**Tool name:** `stop_stopwatch`

**Parameters:**

| Parameter      | Type   | Required | Description                  |
| -------------- | ------ | -------- | ---------------------------- |
| `stopwatch_id` | string | yes      | ID of the stopwatch to stop. |

**Returns:** `{ stopwatch_id, status: "stopped" }`

### PauseStopwatchTool

Pauses a running stopwatch. Elapsed time is preserved; resume with `start_stopwatch`.

**Tool name:** `pause_stopwatch`

**Parameters:**

| Parameter      | Type   | Required | Description                   |
| -------------- | ------ | -------- | ----------------------------- |
| `stopwatch_id` | string | yes      | ID of the stopwatch to pause. |

**Returns:** `{ stopwatch_id, status: "paused" }`

### GetStopwatchTool

Returns the current elapsed time of a stopwatch as a human-readable string.

**Tool name:** `get_stopwatch`

**Parameters:**

| Parameter      | Type   | Required | Description                   |
| -------------- | ------ | -------- | ----------------------------- |
| `stopwatch_id` | string | yes      | ID of the stopwatch to check. |

**Returns:** `{ stopwatch_id, elapsed: "5m 30s" }`

### ListStopwatchesTool

Lists all stopwatches with their current state and elapsed time.

**Tool name:** `list_stopwatches`

**Parameters:** None

**Returns:** `{ stopwatches: [{ id, running, elapsed }] }`

### RemoveStopwatchTool

Removes a stopped or paused stopwatch. Cannot remove a running stopwatch.

**Tool name:** `remove_stopwatch`

**Parameters:**

| Parameter      | Type   | Required | Description                    |
| -------------- | ------ | -------- | ------------------------------ |
| `stopwatch_id` | string | yes      | ID of the stopwatch to remove. |

**Returns:** `{ stopwatch_id, status: "removed" }`

---

## Timer Tools

Seven tools for creating and managing countdown timers. Timers count down from a set duration and can surface a reminder text when they expire.

### TimerPool

Manages all timers — create, list, get, remove, clear. Timer expiry behavior is handled by the `Timer` itself via its `service` property, which is injected through the pool's constructor.

```typescript
import { TimerPool } from 'llm-chat-time';

const pool = new TimerPool(myTimerService);
```

### Timer

The `Timer` domain class handles countdown state and expiry behavior directly.

```typescript
import { Timer } from 'llm-chat-time';

const timer = new Timer('my-timer');
```

**Properties:**

| Property    | Type                        | Description                                      |
|-------------|-----------------------------|--------------------------------------------------|
| `id`        | `string`                    | Timer identifier.                                |
| `durationMs`| `number`                    | Duration in milliseconds set via `set()` or tool.|
| `remaining` | `number`                    | Remaining milliseconds.                          |
| `running`   | `boolean`                   | Whether the timer is currently counting down.    |
| `reminder`  | `string \| undefined`       | Reminder text set at start.                      |
| `service`   | `TimerService \| undefined` | Service injected via `TimerPool` for expiry notification. |

**`TimerService` interface:**

```typescript
interface TimerService {
    notifyUser(content: string): Promise<void>;
}
```

When the timer expires, it calls `service.notifyUser(msg)`. See the [Quick Start](quickstart.md#wire-timer-expiry-to-chatservice) for wiring examples.

### CreateTimerTool

Creates a new stopped timer. Use `set_timer` to set the duration, then `start_timer` to begin.

**Tool name:** `create_timer`

**Parameters:** None

**Returns:** `{ timer_id: "timer-N" }`

### SetTimerTool

Sets the duration of a non-running timer in HH:mm:ss format.

**Tool name:** `set_timer`

**Parameters:**

| Parameter  | Type   | Required | Description                                                    |
| ---------- | ------ | -------- | -------------------------------------------------------------- |
| `timer_id` | string | yes      | ID of the timer to set.                                        |
| `time`     | string | yes      | Duration in HH:mm:ss format (e.g. `"00:05:00"` for 5 minutes). |

**Returns:** `{ timer_id, duration }`

### StartTimerTool

Starts a countdown timer. Provide optional reminder text to have it surfaced when the timer expires.

**Tool name:** `start_timer`

**Parameters:**

| Parameter  | Type   | Required | Description                             |
| ---------- | ------ | -------- | --------------------------------------- |
| `timer_id` | string | yes      | ID of the timer to start.               |
| `reminder` | string | no       | Text to surface when the timer expires. |

**Returns:** `{ timer_id, status: "started", scheduled_end_at }`

### PauseTimerTool

Pauses a running countdown timer. Resume later with `start_timer`.

**Tool name:** `pause_timer`

**Parameters:**

| Parameter  | Type   | Required | Description               |
| ---------- | ------ | -------- | ------------------------- |
| `timer_id` | string | yes      | ID of the timer to pause. |

**Returns:** `{ timer_id, status: "paused" }`

### RemoveTimerTool

Removes a stopped, paused, or expired timer. Cannot remove a running timer.

**Tool name:** `remove_timer`

**Parameters:**

| Parameter  | Type   | Required | Description                |
| ---------- | ------ | -------- | -------------------------- |
| `timer_id` | string | yes      | ID of the timer to remove. |

**Returns:** `{ timer_id, status: "removed" }`

### ListTimersTool

Lists all timers with their current state and remaining time.

**Tool name:** `list_timers`

**Parameters:** None

**Returns:** `{ timers: [{ id, running, duration, remaining, reminder? }] }`

---

## Package classes

The package classes group related tools for registration with the `llm-chat` framework. All implement the `ToolPackage` interface from `@johannes.latzel/llm-chat`.

### DateTimePackage

Groups the two datetime tools. No pools required.

```typescript
import { DateTimePackage } from 'llm-chat-time';
const pkg = new DateTimePackage();
const tools = pkg.tools(); // [GetDateTimeTool, DiffDateTimeTool]
```

- **Tools:** `GetDateTimeTool`, `DiffDateTimeTool` (2 tools)
- **Constructor:** no parameters
- **`dispose()`:** not implemented

### StopwatchPackage

Groups the seven stopwatch tools. Creates a default `StopwatchPool` if none is provided.

```typescript
import { StopwatchPackage } from 'llm-chat-time';
const pkg = new StopwatchPackage();
// or with an existing pool:
const pkg = new StopwatchPackage(myPool);
```

- **Tools:** create, start, stop, pause, get, list, remove (7 tools)
- **Constructor:** optional `StopwatchPool`
- **`dispose()`:** not implemented

### TimerPackage

Groups the seven timer tools. Creates a default `TimerPool` (with a `console.log`-based expiry handler) if none is provided.

```typescript
import { TimerPackage } from 'llm-chat-time';
const pkg = new TimerPackage();
// or with an existing pool:
const pkg = new TimerPackage(myPool);
```

- **Tools:** create, set, start, pause, get, list, remove (7 tools)
- **Constructor:** optional `TimerPool`
- **`dispose()`:** not implemented

### TimePackage

Composite package that wraps `DateTimePackage`, `StopwatchPackage`, and `TimerPackage`. Aggregates all 16 tools.

```typescript
import { TimePackage } from 'llm-chat-time';
const pkg = new TimePackage();
// or with existing pools:
const pkg = new TimePackage(timerPool, stopwatchPool);
```

- **Tools:** all 16 tools from the three sub-packages
- **Constructor:** optional `TimerPool`, optional `StopwatchPool`
- **`dispose()`:** implemented — calls `dispose?.()` on each sub-package
