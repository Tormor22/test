# Supervisor Agent System

> **All agents must be controlled through the Supervisor Agent only. Do not run individual agents directly.**

A team-based multi-agent system for short-form video production (TikTok / Shorts /
Reels) where **every AI agent receives commands only through the Supervisor
Agent**. No agent can run, be assigned work, validate itself, or talk to another
agent directly. The Supervisor is the single command center, router, validator,
and coordinator.

```
User / Terminal / Dashboard
        ↓
Supervisor Agent          ← the only entry point
        ↓
Task Router               → picks the right agent for the task type
        ↓
Assigned Agent            → executeTask() (only the Supervisor may call this)
        ↓
Supervisor validates output
        ↓
Approved → Next Agent
Rejected → Correction Loop (same agent, with instructions)
Failed 3 times → Human Review (workflow paused)
```

## Quick start

```bash
cd head-agent-system
npm install

# Run a full workflow from the terminal (CLI → Supervisor only):
npm run supervisor -- create "AI tools for TikTok creators"

# Other commands
npm run supervisor -- status
npm run supervisor -- agents
npm run supervisor -- workflow <wf_id>
npm run supervisor -- errors
npm run supervisor -- approve <task_id>
npm run supervisor -- reject <task_id> "reason here"
npm run supervisor -- retry <task_id>
npm run supervisor -- pause <wf_id>
npm run supervisor -- resume <wf_id>
npm run supervisor -- logs <wf_id>

# Example end-to-end run (with injected faults to show the correction loop):
npm start

# Tests
npm test
```

Thai example:

```bash
npm run supervisor -- create "ทำคลิป TikTok เรื่อง AI tools"
npm run supervisor -- status
npm run supervisor -- agents
npm run supervisor -- errors
```

## The one rule

No agent is allowed to run, receive commands, execute tasks, or communicate with
other agents directly unless the Supervisor Agent assigns the task. Enforced in
code, not just by convention:

- **Authorization stamp** — every task carries `assigned_by`. `BaseAgent.executeTask()`
  rejects any task where `assigned_by !== "supervisor_agent"`.
- **Single caller** — `SupervisorAgent.runTask()` is the *only* method in the
  codebase that calls `agent.executeTask()`.
- **No direct imports** — only `agents/agentRegistry.ts` imports the agent
  modules. The CLI and Dashboard API import the Supervisor and nothing else.
- **No self-approval** — agents only return structured output; the Supervisor
  validates and approves.

## Team pipeline (gated)

| # | Step | Agent | Gate |
|---|------|-------|------|
| 1 | trend_research | trend_research_agent | trend_approval |
| 2 | script_writing | script_writer_agent | script_approval |
| 3 | asset_finding | asset_finder_agent | asset_approval |
| 4 | voiceover_generation | voiceover_agent | voiceover_approval |
| 5 | subtitle_generation | subtitle_agent | subtitle_approval |
| 6 | video_editing | video_editor_agent | video_approval |
| 7 | qa_policy_check | qa_policy_agent | qa_approval |
| 8 | publishing | publisher_agent | publishing_approval |
| 9 | analytics_review | analytics_agent | analytics_review |

The Supervisor approves every gate before the next agent starts.

## Validation thresholds

Approval is blocked (→ correction loop) if any apply: Hook < 7 · Script Quality
< 7 · Asset Relevance < 7 · Voiceover Quality < 7 · Subtitle Accuracy < 8 ·
Video Quality < 8 · Brand Fit < 7 · Policy Risk = High · Copyright Risk = High ·
Ready to Publish = No · missing required field · invalid file path / link.

## Correction loop & escalation

On validation failure the Supervisor builds a correction request and re-runs the
**same** agent with the fix instructions, incrementing `retry_count`. After **3**
failed attempts the task becomes `needs_human_review` and the workflow pauses —
recover with `retry <task_id>` or `approve <task_id>`.

## Powered by Claude

Each of the 9 agents generates its output by calling **Claude** (`claude-opus-4-8`,
adaptive thinking, `effort: high`) through the Anthropic TypeScript SDK, using
**structured outputs** (`output_config.format`) so the JSON returned matches the
exact fields and scores the Supervisor's validation engine checks.

- **Shared client:** `src/llm/claudeClient.ts` — the only place the SDK is called.
- **Per-agent prompt + schema:** each agent's `llmSpec()` (system prompt + JSON
  schema + task instructions). The base class builds the user prompt from the
  topic, the approved upstream outputs, and — on a retry — the Supervisor's
  correction instruction, so a rejected agent actually fixes the cited issues.
- **Offline fallback:** with no `ANTHROPIC_API_KEY` (or `AGENTS_USE_LLM=false`),
  every agent uses its deterministic `mock()` instead — so the demo and the
  vitest suite run with zero network/keys. Set the key to switch the whole team
  to real Claude with no other changes.

The Supervisor, task router, approval gates, correction loop, and validation are
unchanged — only how an agent produces its output changed.

```bash
export ANTHROPIC_API_KEY=sk-ant-...      # agents now call Claude
npm run supervisor -- create "AI tools for TikTok creators"
```

See `.env.example` for all options.

## Folder structure

```
src/
  supervisor/   supervisorAgent · taskRouter · workflowController · approvalGate · correctionLoop · teamCoordinator
  agents/       baseAgent · agentRegistry · 9 specialized agents (mock() + llmSpec())
  llm/          claudeClient (shared Anthropic SDK call, structured outputs)
  workflow/     workflowEngine · workflowTypes · workflowState
  tasks/        taskTypes · taskQueue · taskStore
  validation/   validationEngine · scoringRules · requiredFields
  storage/      workflowStore · agentStore · auditLogStore
  cli/          commandRouter · cliPrinter
  dashboard/    dashboardApi      (every endpoint → Supervisor only)
  utils/        ids · logger
  cli.ts        CLI entry  (calls Supervisor only)
  index.ts      example workflow run
tests/          supervisor.test.ts · escalation.test.ts  (vitest)
```

## Dashboard API (Supervisor-only)

Start with `START_API=1 npm start`. Endpoints: `POST /workflows`,
`GET /workflows`, `GET /workflows/:id`, `POST /workflows/:id/pause`,
`POST /workflows/:id/resume`, `GET /agents`, `GET /errors`,
`POST /tasks/:id/approve`, `POST /tasks/:id/reject`, `POST /tasks/:id/retry`,
`GET /logs/:workflow_id`. Every handler calls the Supervisor — never an agent.

## Audit log

Every important action is recorded: workflow created/paused/resumed/completed/
failed, task created/assigned, agent started/completed, validation passed/failed,
correction requested, retry started, human review required. Query via
`npm run supervisor -- logs <wf_id>` or `GET /logs/:workflow_id`.

## Going to production

Replace each agent's mock `run()` with a real HTTP/SDK call (the `BaseAgent`
authorization guard, timeout, and error handling stay). Swap the in-memory
stores (`storage/*`, `tasks/taskStore`) for a database behind the same method
signatures. Nothing else changes — the Supervisor contract is stable.
