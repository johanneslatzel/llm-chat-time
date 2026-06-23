# Quick Start

## Installation

```bash
npm install johanneslatzel/llm-chat-time
```

## Quick setup

```typescript
import { TimePackage, TimerPool, TimerExpiryService } from 'llm-chat-time';

// All 14 tools at once — pools and timer service are optional
const timerPool = new TimerPool(new TimerExpiryService(chat));
const pkg = new TimePackage(timerPool);
service.tools().add(pkg);
```

Individual packages (`DateTimePackage`, `StopwatchPackage`, `TimerPackage`) are also available.

## Timer expiry

`TimerExpiryService` queues a synthetic `timer_expired` tool call when a timer fires:

```typescript
const pool = new TimerPool(new TimerExpiryService(chat));
const pool = new TimerPool(new TimerExpiryService(chat, 'A timer expired.'));
```

The second argument is an optional assistant message (falls back to `LLM_CHAT_TIME_TIMER_EXPIRED_MESSAGE` env var, then `""`).

Alternatively implement `TimerService` and pass it in the `TimerPool` constructor.

## Next steps

See the [API Reference](api-reference.md) for full tool documentation and [Architecture](architecture.md) for design details.
