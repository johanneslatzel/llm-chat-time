# Quick Start

## Installation

```bash
npm install @johannes.latzel/llm-chat-time
```

## Quick setup

```typescript
import { TimePackage, TimerPool, TimerExpiryService } from '@johannes.latzel/llm-chat-time';

// Assume `service` is an existing ChatService.
// All 10 tools at once; pools and sleep registry are optional.
const timerPool = new TimerPool(new TimerExpiryService(service));
const pkg = new TimePackage(timerPool);
const tools = pkg.tools();

// The host registers each tool with its own tool suite.
for (const tool of tools) service.tools().add(tool);
```

`StopwatchPackage` and `TimerPackage` bundle the stopwatch and timer tools. `TimeTool` and `SleepTool` are exported individually as well.

## Timer expiry

`TimerExpiryService` queues a synthetic `timer_expired` tool call when a timer fires:

```typescript
// Default: the message comes from LLM_CHAT_TIME_TIMER_EXPIRED_MESSAGE, else ""
const pool = new TimerPool(new TimerExpiryService(service));

// Or pass an explicit assistant message
const poolWithMessage = new TimerPool(new TimerExpiryService(service, 'A timer expired.'));
```

The second argument is an optional assistant message (falls back to `LLM_CHAT_TIME_TIMER_EXPIRED_MESSAGE` env var, then `""`).

Alternatively implement `TimerService` and pass it in the `TimerPool` constructor.

## Full API

See the [API Reference](api-reference.md) for every tool's parameters and return values, and [Architecture](architecture.md) for design details.
