# Quick Start

## Installation

```bash
npm install johanneslatzel/llm-chat-time
```

## Usage

### Get the current date and time

```typescript
import { GetDateTimeTool } from 'llm-chat-time';

const tool = new GetDateTimeTool();
const result = await tool.execute({});
console.log(result.result);
```

### Calculate a time difference

```typescript
import { DiffDateTimeTool } from 'llm-chat-time';

const tool = new DiffDateTimeTool();
const result = await tool.execute({
    a: '2025-01-15T10:30:00.000Z',
    b: '2025-01-14T10:30:00.000Z'
});
console.log(result.result); // {"difference": "1:00:00:00.000"}
```

### Use a stopwatch

```typescript
import {
    StopwatchPool,
    CreateStopwatchTool,
    StartStopwatchTool,
    StopStopwatchTool
} from 'llm-chat-time';

const pool = new StopwatchPool();
const create = new CreateStopwatchTool(pool);
const start = new StartStopwatchTool(pool);
const stop = new StopStopwatchTool(pool);

// Create and start
const { stopwatch_id } = JSON.parse((await create.execute({})).result);
await start.execute({ stopwatch_id });

// ... do something ...

// Stop and get elapsed
const stopped = await stop.execute({ stopwatch_id });
// { status: "stopped" } — use get_stopwatch to see elapsed time
```

### Check elapsed time without stopping

```typescript
import { GetStopwatchTool } from 'llm-chat-time';

const tool = new GetStopwatchTool(pool);
const result = await tool.execute({ stopwatch_id });
const { elapsed } = JSON.parse(result.result);
console.log(elapsed); // "0:00:12.340" (d:HH:mm:ss.ms)
```

### Set and run a countdown timer

```typescript
import { TimerPool, CreateTimerTool, SetTimerTool, StartTimerTool } from 'llm-chat-time';

const pool = new TimerPool();
const create = new CreateTimerTool(pool);
const set = new SetTimerTool(pool);
const start = new StartTimerTool(pool);

// Create a timer
const { timer_id } = JSON.parse((await create.execute({})).result);

// Set duration (HH:mm:ss format)
await set.execute({ timer_id, time: '00:05:00' });

// Start it with an optional reminder
await start.execute({ timer_id, reminder: 'Timer done!' });
```

### Wire timer expiry to service interrupt

```typescript
import { TimerPool, CreateTimerTool } from 'llm-chat-time';

const pool = new TimerPool();
const createTimer = new CreateTimerTool(pool);

// Create a timer via the tool (just like the LLM would)
const { timer_id } = JSON.parse((await createTimer.execute({})).result);

// Get the Timer instance and give it a service
const timer = await pool.getTimer(timer_id);
timer.service = {
    interrupt: (fn) => service.interrupt(fn),
    chatImpl: service.chatImpl,
};
// When this timer expires it will interrupt the LLM with a user message
```

## Next steps

See the [API Reference](documentation.md) for full tool documentation and [Architecture](architecture.md) for design details.
