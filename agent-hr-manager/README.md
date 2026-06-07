# Agent HR Manager / Agent Workforce Manager

An HR-style supervisory agent for the **AgentOps** platform. It continuously
monitors every AI agent in the workforce and, when one becomes inactive, fails
repeatedly, produces low-quality work, violates policy, misses deadlines, or
becomes unreliable, it **warns → terminates / quarantines → recruits a
replacement → onboards it through probation** — fully logged and auditable.

It is a peer subproject to [`head-agent-system`](../head-agent-system) (the
orchestrator/supervisor) and reports into the same monitor-only Next.js
dashboard (`../src`). The HR Manager appears as an executive agent in the
**Management** department.

> Boots with **zero infrastructure**: in-memory store, Telegram dry-run,
> simulated workforce. `npm run demo` walks the full lifecycle in one command.

---

## 1. System architecture

```
                    ┌─────────────────────────────────────────────────────┐
   specialized      │                 AGENT HR MANAGER                      │
   agents  ──HTTP──▶│  heartbeat / task-result webhooks  (dashboard/hrApi) │
   (heartbeats,     │                       │                              │
    task results)   │                       ▼                              │
                    │   ┌──────────────────────────────────────────────┐  │
                    │   │ HR MANAGER (hr/hrManager.ts) — the brain       │  │
                    │   │  · ingest telemetry → rolling metrics          │  │
                    │   │  · monitor loop (§13 automation rules)         │  │
                    │   └───┬───────┬────────┬────────┬────────┬─────────┘  │
                    │       ▼       ▼        ▼        ▼        ▼            │
                    │   scoring  heartbeat warnings termination probation   │
                    │   engine   monitor   system   +replace   system      │
                    │       │       │        │        │ +recruit │          │
                    │       └───────┴────────┴────┬───┴──────────┘          │
                    │                             ▼                         │
                    │              agentPool ── Store (db.ts ⇄ schema.sql)  │
                    │                             │                         │
                    │              auditLogger    │   hrActions             │
                    │                             ▼                         │
                    │                  eventBus (typed, process-wide)       │
                    │                    │                 │                │
                    └────────────────────┼─────────────────┼───────────────┘
                                         ▼                 ▼
                              WebSocket server      Telegram notifier
                              (live dashboard)      + command bot
                                         │
                                         ▼
                              AgentOps Dashboard  /hr  (Next.js, ../src/app/hr)
```

**Design principles (spec §20):**
- **Modular** — each HR responsibility is a single-purpose module; the
  `hrManager` only composes them.
- **Observable** — every consequential action passes through `hrActions` →
  audit log + event bus → dashboard + Telegram. Nothing happens silently.
- **Recoverable** — heartbeat loss triggers restart-before-replace;
  the store is the single source of truth and reads are cloned (no aliasing).
- **Swappable I/O** — in-memory `Store` mirrors `schema.sql` 1:1, Telegram has a
  dry-run, agents are HTTP webhooks. Production = implement a `pg` Store + point
  agents at the webhook. No core logic changes.

---

## 2. Folder structure

```
agent-hr-manager/
├── configs/                         # example agent profile files (§6)
│   ├── video-editor-agent.json
│   └── hr-manager-agent.json
├── src/
│   ├── config/env.ts                # validated env + HR policy thresholds (§13)
│   ├── types/index.ts               # domain model (maps 1:1 to schema.sql)
│   ├── catalog/roleCatalog.ts       # recruitment blueprints per role (§6, §9)
│   ├── scoring/scoringEngine.ts     # 0-100 weighted score + bands (§2)
│   ├── monitor/heartbeatMonitor.ts  # heartbeat ingest + staleness sweep (§1)
│   ├── agents/agentPool.ts          # the only workforce mutation point
│   ├── hr/
│   │   ├── hrActions.ts             # action recorder → store + audit + bus
│   │   ├── warningSystem.ts         # L1→L4 discipline ladder (§3)
│   │   ├── terminationEngine.ts     # terminate/quarantine + safety rules (§4,§16)
│   │   ├── replacementWorkflow.ts   # recruit + transfer tasks + onboard (§5)
│   │   ├── recruitment.ts           # reuse-or-create from catalog (§6)
│   │   ├── probation.ts             # probation lifecycle (§7)
│   │   └── hrManager.ts             # orchestrator + automation rules (§13)
│   ├── logs/auditLogger.ts          # append-only audit trail (§16)
│   ├── notifications/
│   │   ├── telegram.ts              # notifier + command bot (§15)
│   │   ├── templates.ts             # alert templates (§15)
│   │   └── commands.ts              # slash commands (§12)
│   ├── dashboard/
│   │   ├── hrApi.ts                 # REST API + webhooks (§12)
│   │   └── websocketServer.ts       # live broadcast (§8, §15)
│   ├── database/
│   │   ├── db.ts                    # in-memory Store
│   │   └── schema.sql               # PostgreSQL schema (§11)
│   ├── utils/{ids,logger,eventBus}.ts
│   ├── demo/runHrCycle.ts           # end-to-end demo (npm run demo)
│   └── index.ts                     # bootstrap (§17)
└── tests/                           # node --test: scoring, lifecycle, safety, automation
```

---

## 3. Agent scoring algorithm (§2)

`scoring/scoringEngine.ts` turns raw rolling telemetry (`AgentMetrics`) into a
single **0-100** score via a transparent weighted average — every factor is
normalised to 0-100 (higher = better) then combined:

| Factor | Weight | Factor | Weight |
|---|---|---|---|
| Task completion rate | 0.15 | Avg response time | 0.08 |
| Output quality | 0.15 | Supervisor feedback | 0.07 |
| Reliability | 0.12 | Collaboration | 0.05 |
| Policy compliance | 0.12 | Resource efficiency | 0.03 |
| Error rate (inverse) | 0.10 | User feedback | 0.03 |
| Deadline compliance | 0.10 | **Total** | **1.00** |

**Bands:** `90-100 excellent · 75-89 good · 60-74 monitor · 40-59 warning ·
0-39 replace`. The breakdown keeps per-factor contributions so the dashboard can
show *why* an agent scored what it did.

---

## 4. Automation logic (§13)

The monitor loop (`hrManager.runMonitorCycle`, every `MONITOR_INTERVAL_MS`)
applies, in order:

| Trigger | Action |
|---|---|
| Heartbeat missing > `HEARTBEAT_TIMEOUT_MS` | → `FAILED`; mission-critical → terminate+replace immediately; else restart up to `MAX_RESTART_ATTEMPTS`, then terminate+replace |
| `score < REPLACE_THRESHOLD` (40) | terminate + replace immediately |
| `REPLACE_THRESHOLD ≤ score < WARN_THRESHOLD` (60) | escalate warning ladder; L4 ⇒ terminate |
| Same task fails `MAX_TASK_FAILURES` (3) times | reassign + warn + replacement review |
| Policy violation | quarantine + notify QA/Supervisor; confirmed ⇒ replace |
| Recovered to `WARN_THRESHOLD + 5` | clear standing warning |

Thresholds live in `config.hr` (env-driven) — tune without touching code.

---

## 5. Replacement workflow (§5)

`terminateAgent` → `replaceAgent`:
1. Identify the failed agent's **role** and collect its **unfinished tasks**.
2. **Recruit** a replacement: reuse an idle, healthy same-role agent from the
   pool, else **create** a new instance from the role catalog (`Splice` → `Splice V2`).
3. **Transfer** the unfinished tasks to the replacement (re-queued, with context).
4. **Onboard** the replacement into **probation** (§7) with the predecessor set
   as its benchmark.
5. Write an auditable `ReplacementRecord` (transfer status + task ids).
6. Mission-critical replacement ⇒ **immediate escalation** to the Head Supervisor.

---

## 6. Warning + probation + safety

- **Warning ladder (§3):** L1 soft → L2 performance → L3 final → L4 terminate.
  Mission-critical + unresponsive skips the ladder (replace now).
- **Probation (§7):** every recruit watches its first `PROBATION_TASKS`; ≥70%
  pass ⇒ `passed` (becomes `active`); borderline (≥50%) ⇒ one `extended`;
  otherwise `failed` ⇒ terminate + replace again. Status:
  `pending · in_progress · passed · failed · extended`.
- **Safety rails (§16):** HR Manager can never terminate **itself**; the Head
  Supervisor needs **admin approval**; `REQUIRE_ADMIN_APPROVAL` gates all
  destructive actions; **every** attempt (allowed or blocked) is audited;
  historical data is never deleted (terminated agents are flagged, not removed).

---

## 7. Status & department model (§9, §10)

**Statuses:** `active · idle · busy · warning · failed · terminated · replacing ·
onboarding · probation · disabled`.

**Departments:** Content Research · Content Creation · Production · Quality
Control · Publishing · Analytics · Management (Head Supervisor + HR Manager).
See `catalog/roleCatalog.ts` for the full role→department map and recruitment
blueprints.

---

## 8. Database schema (§11)

`database/schema.sql` (PostgreSQL) — `agents`, `agent_tasks`,
`agent_performance_logs`, `agent_hr_actions`, `agent_replacement_history`,
`audit_log`, `telegram_log`. The in-memory `Store` mirrors these tables exactly,
so going to Postgres = implement the same methods against `pg`.

---

## 9. API (§12)

Base URL `http://localhost:8989`. Destructive routes require
`Authorization: Bearer $HR_API_KEY` when the key is set.

**Reads**
```
GET  /agents                         GET  /agents/health
GET  /agents/:id                     GET  /agents/performance
GET  /agents/warnings                GET  /agents/probation
GET  /agents/hr-actions              GET  /agents/replacement-history
GET  /catalog   /audit   /telegram/log   /health
```

**Controls**
```
POST   /agents                       { role, reason }      # recruit
PATCH  /agents/:id                   { metrics }           # nudge metrics
DELETE /agents/:id                   { reason, adminApproved }
POST   /agents/:id/warn              { reason }
POST   /agents/:id/terminate         { reason, adminApproved }
POST   /agents/:id/replace           { reason }
POST   /agents/:id/quarantine        { reason, confirmed }
POST   /agents/:id/reassign-task     { taskId, toAgentId }
POST   /agents/recruit               { role, reason }
```

**Webhooks (agent ingress)**
```
POST /agents/:id/heartbeat     { status?, taskId?, message? }
POST /agents/:id/task-result   { taskId, success, responseTimeMs?, qualityScore?,
                                 policyScore?, errorCount?, deadlineMet? }
```

Example heartbeat from a specialized agent:
```bash
curl -X POST http://localhost:8989/agents/$ID/heartbeat \
  -H 'authorization: Bearer '$HR_API_KEY \
  -H 'content-type: application/json' \
  -d '{"status":"busy","taskId":"task_123"}'
```

---

## 10. Telegram (§15)

`/status · /agents · /underperformers · /probation · /actions · /warn · /terminate`.
With no token the notifier runs in **dry-run** (logs + records to telegram_log).
Sample alert:
```
🛑 Agent HR Alert
Video Editor Agent (Splice) has been TERMINATED.
Reason: repeated task failure (task render_video)
Replacement: Splice V2
Task transfer: in progress
```

---

## 11. Run it

```bash
npm install
npm run demo        # full lifecycle demo, zero infra
npm run dev         # API :8989  + WS :8990  + monitor loop + Telegram bot
npm test            # scoring · lifecycle · safety · automation (node --test)
npm run typecheck
npm run build && npm start
```

Connect the dashboard: set `NEXT_PUBLIC_HR_WS_URL=ws://localhost:8990` in
`../.env` (the `/hr` page falls back to mock data when unset).

---

## 12. Testing plan

- **Unit** (in `tests/`): scoring weights/bands/inversion; warning ladder;
  termination + task transfer; quarantine; §16 safety rails; §13 automation
  (repeated-failure, heartbeat restart→replace); probation pass/fail. *(15 tests)*
- **Integration** (recommended next): drive the Express app with `supertest`
  through a full degrade→terminate→replace→probation arc and assert the
  `replacement_history` + `audit_log`.
- **Load/soak**: 100s of simulated agents heartbeating to verify the monitor
  loop stays within budget; chaos-test random silences.

## 13. Deployment plan

- **Container:** multi-stage `Dockerfile` (build → slim runtime), `docker-compose.yml`
  brings up HR + Postgres (auto-loads `schema.sql`) + Redis.
- **Config:** all secrets via env (§16); copy `.env.example` → `.env`.
- **Production storage:** set `DATABASE_URL` and implement the `pg`-backed Store;
  set `REDIS_URL` for heartbeat/queue fan-out across instances.
- **Scale:** API/WS are stateless once the Store is external — run N replicas
  behind a load balancer; a single leader runs the monitor loop (or use Redis
  locks). Ship audit_log to your warehouse for compliance.
- **Observability:** structured logs (`LOG_LEVEL`), audit trail, Telegram alerts,
  WebSocket feed to the dashboard.
```
