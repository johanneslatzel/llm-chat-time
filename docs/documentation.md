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

Time values (`duration`, `remaining`, `elapsed`) are returned as strings in `d:HH:mm:ss.ms` format (e.g. `"0:00:05:00.000"` for 5 minutes, `"1:01:30:00.000"` for 25h30m).

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

**Returns:** `{ a, b, difference }` where `difference` is in `d:HH:mm:ss.ms` format.

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

Returns the current elapsed time of a stopwatch in `d:HH:mm:ss.ms` format. Returns an error if elapsed time is 100 hours or more.

**Tool name:** `get_stopwatch`

**Parameters:**

| Parameter      | Type   | Required | Description                   |
| -------------- | ------ | -------- | ----------------------------- |
| `stopwatch_id` | string | yes      | ID of the stopwatch to check. |

**Returns:** `{ stopwatch_id, elapsed: "d:HH:mm:ss.ms" }`

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

Manages all timers — create, list, get, remove, clear. Timer expiry behavior is handled by the `Timer` itself via its `service` property.

```typescript
import { TimerPool } from 'llm-chat-time';

const pool = new TimerPool();
const timer = await pool.createTimer();
timer.service = myService; // expiry calls myService.interrupt(...)
```

### Timer

The `Timer` domain class handles countdown state and expiry behavior directly.

```typescript
import { Timer } from 'llm-chat-time';

const timer = new Timer('my-timer');
```

**Properties:**

| Property    | Type                                            | Description                                      |
|-------------|-------------------------------------------------|--------------------------------------------------|
| `id`        | `string`                                        | Timer identifier.                                |
| `durationMs`| `number`                                        | Duration in milliseconds set via `set()` or tool.|
| `remaining` | `number`                                        | Remaining milliseconds.                          |
| `running`   | `boolean`                                       | Whether the timer is currently counting down.    |
| `reminder`  | `string \| undefined`                           | Reminder text set at start.                      |
| `service`   | `{ interrupt, chatImpl } \| undefined`          | Optional service for expiry interrupt.           |

**`service` property:**

When set, expiry calls `service.interrupt(fn)` which runs `fn` inside the send mutex and triggers the LLM to respond. The `fn` injects a user message via `service.chatImpl.user()`.

```typescript
timer.service = {
    interrupt: (fn) => service.interrupt(fn),
    chatImpl: service.chatImpl,
};
// On expiry: service.interrupt(() => service.chatImpl.user("Timer \"timer-1\" expired. Reminder: ..."))
```

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

## Duration Utilities

Exported for convenience:

```typescript
import { parseTime, formatDuration } from 'llm-chat-time';
```

- `parseTime("HH:mm:ss")` → milliseconds (number)
- `formatDuration(ms)` → `"d:HH:mm:ss.ms"` string

---

## Environment Variables

| Variable            | Default | Description                                        |
| ------------------- | ------- | -------------------------------------------------- |
| `TIMER_INTERVAL_MS` | `100`   | Tick interval for timer countdown in milliseconds. |
