# Environment Variables

All variables are optional. A constructor argument takes precedence over the environment.

| Variable                              | Type   | Default | Description                                                                                  |
| ------------------------------------- | ------ | ------- | -------------------------------------------------------------------------------------------- |
| `LLM_CHAT_TIME_TIMER_EXPIRED_MESSAGE` | string | `""`    | Assistant message queued with the synthetic `timer_expired` tool call when a timer fires.[1] |

## References

1. `src/lib/timer-expiry-service.ts` `TimerExpiryService.notify()`: reads the variable through `envString` and uses the empty string as the default.
