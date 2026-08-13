# LLM Chat Time

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![NPM](https://nodei.co/npm/@johannes.latzel/llm-chat-time.svg?style=shields&data=n,v,u,d,s)](https://www.npmjs.com/package/@johannes.latzel/llm-chat-time)
[![version](https://img.shields.io/github/package-json/v/johanneslatzel/llm-chat-time)](https://github.com/johanneslatzel/llm-chat-time/releases)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](https://github.com/johanneslatzel/llm-chat-time/pulls)
[![Feedback Welcome](https://img.shields.io/badge/feedback-welcome-brightgreen)](https://github.com/johanneslatzel/llm-chat-time/discussions)
[![codecov](https://codecov.io/gh/johanneslatzel/llm-chat-time/graph/badge.svg)](https://codecov.io/gh/johanneslatzel/llm-chat-time)
[![CI](https://github.com/johanneslatzel/llm-chat-time/actions/workflows/ci.yml/badge.svg)](https://github.com/johanneslatzel/llm-chat-time/actions/workflows/ci.yml)
[![Socket Badge](https://badge.socket.dev/npm/package/@johannes.latzel/llm-chat-time/latest)](https://badge.socket.dev/npm/package/@johannes.latzel/llm-chat-time/latest)
[![AI Assisted Yes](https://img.shields.io/badge/AI%20Assisted-Yes-green)](https://github.com/mefengl/made-by-ai)

Timers that interrupt the chat when they expire. Also stopwatches and datetime. Plugs into the [`@johannes.latzel/llm-chat`](https://github.com/johanneslatzel/llm-chat) ecosystem.

## Features

- countdown timers inject `timer_expired` tool calls into the conversation on expiry and interrupt the LLM to have it react to the event
- `time`: returns current date, time, timezone, day-of-year; calculates elapsed time or duration between two ISO 8601 datetimes or elapsed time since datetime
- `sleep`: blocks until a duration has passed or an absolute datetime is reached, so agents can wait without polling
- stopwatches track time

## Prerequisites

- Node.js >= 18

## Installation

```bash
npm install @johannes.latzel/llm-chat-time
```

## Documentation

Full documentation at **[johanneslatzel.github.io/llm-chat-time/](https://johanneslatzel.github.io/llm-chat-time/)**

## License

MIT — see [`LICENSE`](LICENSE).

## Contributing

Issues and PRs welcome at [github.com/johanneslatzel/llm-chat-time](https://github.com/johanneslatzel/llm-chat-time).
