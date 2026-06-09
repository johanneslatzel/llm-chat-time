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
console.log(result.result); // {"difference": "1d"}
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
console.log(elapsed); // "12.34s" (pretty-ms human-readable)
```

### Set and run a countdown timer

```typescript
import { TimerPool, CreateTimerTool, SetTimerTool, StartTimerTool } from 'llm-chat-time';

const pool = new TimerPool(/* service — see wire expiry section */);
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

### Wire timer expiry to ChatService

```typescript
import { TimerPool, CreateTimerTool, type TimerService } from 'llm-chat-time';

// Provide a TimerService that defines what happens when a timer expires.
// The pool passes the service to every timer it creates.

// Option A: Callback shorthand (recommended for ChatService)
const pool = new TimerPool(async (content: string) => {
    await service.queue().assistant(content);
    service.interrupt(true);
    if (service.needsResend()) {
        await service.send();
    }
});

// Option B: Full TimerService interface
class TimerChatAdapter implements TimerService {
    constructor(private service: ChatService) {}

    async notifyUser(content: string): Promise<void> {
        await this.service.queue().assistant(content);
        this.service.interrupt(true);
        if (this.service.needsResend()) {
            await this.service.send();
        }
    }
}

const pool = new TimerPool(new TimerChatAdapter(service));

const createTimer = new CreateTimerTool(pool);
// When any timer expires, it calls notifyUser which can queue a message
// and trigger the interrupt/send flow
```

### Use packages

Instead of constructing individual tools, use a package class to group them for registration:

```typescript
import { DateTimePackage, StopwatchPackage, TimerPackage, TimePackage } from 'llm-chat-time';

// Standalone package
const datePkg = new DateTimePackage();
framework.registerPackage(datePkg); // registers GetDateTime + DiffDateTime

// Composite package — all 16 tools at once
const allPkg = new TimePackage();
framework.registerPackage(allPkg);
```

Packages that rely on pools (`StopwatchPackage`, `TimerPackage`) create a default pool when none is provided. Pass an existing pool to share state across packages:

```typescript
import { StopwatchPool, TimerPool, TimePackage } from 'llm-chat-time';

const timerPool = new TimerPool(myTimerService);
const stopwatchPool = new StopwatchPool();
const pkg = new TimePackage(timerPool, stopwatchPool);
```

Only `TimePackage` implements the optional `dispose()` method, which cleans up sub-packages.

## Next steps

See the [API Reference](api-reference.md) for full tool documentation and [Architecture](architecture.md) for design details.
