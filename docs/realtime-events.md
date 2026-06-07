# Real-time events — connecting a real agent backend

The dashboard renders entirely from a live state store that is fed by a single
**event source**. Today that source is a mock simulation; pointing it at a real
backend is a configuration change, not a code change.

```
agent backend ──(WebSocket frames)──▶ DashboardEventSource ──▶ reducer ──▶ React store ──▶ UI
                                       (mock | websocket)
```

## Switching from mock to a real backend

Set one environment variable (see `.env.example`):

```bash
NEXT_PUBLIC_WS_URL=ws://your-backend:4000/agent-events
```

- **Unset** → `MockEventSource` invents plausible activity (default).
- **Set** → `WebSocketEventSource` connects to that URL, relays its frames, and
  reconnects automatically with linear backoff.

The selection happens in `createEventSource()` in `src/lib/events.ts`. No UI
component imports a socket directly, so nothing else has to change.

## The event contract

The backend must send **one JSON object per WebSocket message**, each matching
the `AgentEvent` union in `src/types/index.ts`:

```jsonc
// agent changed lifecycle state (covers started / completed / errored)
{ "type": "status", "agentId": "video-editor", "at": "2026-06-07T10:00:00Z",
  "status": "working", "task": "Assembling cut for video 2" }   // task is optional

// progress update (0–100)
{ "type": "progress", "agentId": "video-editor", "at": "2026-06-07T10:00:05Z",
  "progress": 62 }

// a log / message line
{ "type": "log", "agentId": "qa-policy", "at": "2026-06-07T10:00:09Z",
  "level": "error", "message": "Video 1 blocked — rights-restricted audio" }
```

Field reference:

| Field      | Applies to        | Notes                                                                 |
| ---------- | ----------------- | --------------------------------------------------------------------- |
| `type`     | all               | `"status"` \| `"progress"` \| `"log"`                                 |
| `agentId`  | all               | Must match an `id` in `src/data/agents.ts`                            |
| `at`       | all               | ISO-8601 timestamp                                                    |
| `status`   | `status`          | One of: `idle, thinking, working, waiting, reviewing, error, done`    |
| `task`     | `status` (opt.)   | Updates the agent's "current task" label                              |
| `progress` | `progress`        | Integer 0–100 (clamped)                                               |
| `level`    | `log`             | `info \| success \| warning \| error \| debug`                        |
| `message`  | `log`             | Free text                                                             |

Unknown or malformed frames are ignored, so a noisy backend can't crash the UI.

## How events become UI

`dashboardReducer` (`src/lib/dashboardReducer.ts`) folds each event into state:

- `status` → updates the agent's status, `lastActivity`, optional `currentTask`
  (and pins progress to 100 on `done`). Drives the office avatars, cards, KPI
  counts, and the workflow graph edges lighting up.
- `progress` → moves the agent's progress bars.
- `log` → prepends a capped (60-entry) buffer powering the Activity Stream and
  the per-agent log feed in the detail panel.

## Adding a different transport (e.g. Socket.IO)

Implement the `DashboardEventSource` interface (`start / stop / subscribe /
onStatusChange / getStatus`) and return it from `createEventSource()`. The
`WebSocketEventSource` class is a complete reference implementation.
