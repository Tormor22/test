/**
 * CLI Command Router (spec §9).
 *
 * Parses argv and dispatches to the Supervisor Agent — and ONLY the Supervisor
 * Agent. This module never imports an individual agent. Correct:
 *     import { supervisor } from "../supervisor/supervisorAgent.js"
 * Incorrect (forbidden):
 *     import { scriptWriterAgent } from "../agents/scriptWriterAgent.js"
 */
import { supervisor } from "../supervisor/supervisorAgent.js";
import { printer } from "./cliPrinter.js";

function usage(): void {
  printer.heading("Supervisor CLI — usage");
  const rows = [
    ['create "topic here"', "Create + run a workflow"],
    ["status", "List all workflows"],
    ["workflow <wf_id>", "Show one workflow + its tasks"],
    ["agents", "List all agents + status"],
    ["errors", "Show active errors / corrections"],
    ["approve <task_id>", "Approve a task and resume"],
    ['reject <task_id> "reason"', "Reject a task → correction"],
    ["retry <task_id>", "Resume a stopped workflow"],
    ["pause <wf_id>", "Pause a workflow"],
    ["resume <wf_id>", "Resume a workflow"],
    ["logs <wf_id>", "Show the audit log"],
  ];
  for (const [cmd, desc] of rows) printer.kv(cmd!, desc!);
  printer.line(`\nExample:\n  npm run supervisor -- create "AI tools for TikTok creators"`);
}

function printWorkflowSummary(wf: { workflow_id: string; topic: string; status: string; completed_steps: string[]; current_step: string }): void {
  printer.heading(`Workflow ${wf.workflow_id}`);
  printer.kv("Topic", wf.topic);
  printer.status("Status", wf.status);
  printer.kv("Current step", wf.current_step || "—");
  printer.kv("Completed", `${wf.completed_steps.length}/9 steps`);
}

export async function runCli(argv: string[]): Promise<number> {
  const [command, ...rest] = argv;

  try {
    switch (command) {
      case "create": {
        const topic = rest.join(" ").trim();
        if (!topic) return fail('Provide a topic, e.g. create "AI tools for TikTok"');
        printer.heading("Creating workflow");
        const wf = await supervisor.createWorkflow(topic);
        printWorkflowSummary(wf);
        const tasks = (supervisor.getWorkflowStatus(wf.workflow_id) as { tasks: Array<{ assigned_agent_id: string; status: string; retry_count: number }> }).tasks;
        printer.heading("Steps");
        for (const t of tasks) printer.line(`  ${t.assigned_agent_id.padEnd(22)} ${printer.colorStatus(String(t.status))}  (retries ${t.retry_count})`);
        if (wf.status === "completed") printer.success("Workflow completed.");
        else if (wf.status === "needs_human_review") printer.warn("Workflow needs human review. Use: retry <task_id> or approve <task_id>.");
        return 0;
      }

      case "status": {
        const list = supervisor.getWorkflowStatus() as Array<{ workflow_id: string; topic: string; status: string; completed_steps: string[] }>;
        printer.heading("Workflows");
        if (!list.length) printer.line("  (none yet)");
        for (const wf of list) printer.line(`  ${wf.workflow_id}  ${printer.colorStatus(wf.status).padEnd(28)} ${wf.completed_steps.length}/9  ${wf.topic}`);
        return 0;
      }

      case "workflow": {
        const id = rest[0];
        if (!id) return fail("Provide a workflow id.");
        const wf = supervisor.getWorkflowStatus(id) as | (ReturnType<typeof supervisor.getWorkflowStatus> & { tasks: Array<{ task_id: string; assigned_agent_id: string; status: string; retry_count: number }> }) | undefined;
        if (!wf) return fail(`Workflow "${id}" not found.`);
        printWorkflowSummary(wf as never);
        printer.heading("Tasks");
        for (const t of wf.tasks) printer.line(`  ${t.task_id}  ${t.assigned_agent_id.padEnd(22)} ${printer.colorStatus(String(t.status))}  (retries ${t.retry_count})`);
        return 0;
      }

      case "agents": {
        const agents = supervisor.getAgentStatus() as Array<{ agent_id: string; role: string; status: string; stats: { completed: number; failed: number; corrections: number } }>;
        printer.heading("Agents");
        for (const a of agents) {
          printer.line(`  ${a.agent_id.padEnd(22)} ${printer.colorStatus(a.status).padEnd(28)} ✓${a.stats.completed} ✗${a.stats.failed} ↻${a.stats.corrections}  ${a.role}`);
        }
        return 0;
      }

      case "errors": {
        const { tasks, corrections } = supervisor.getActiveErrors();
        printer.heading("Active errors");
        if (!tasks.length) printer.line("  (none)");
        for (const t of tasks) printer.line(`  ${t.task_id}  ${t.assigned_agent_id.padEnd(22)} ${printer.colorStatus(String(t.status))}  (retries ${t.retry_count})`);
        if (corrections.length) {
          printer.heading("Corrections");
          for (const creq of corrections) printer.line(`  ${creq.task_id}  [${creq.priority}] ${creq.issue_found.split("\n")[0]}`);
        }
        return 0;
      }

      case "approve": {
        const id = rest[0];
        if (!id) return fail("Provide a task id.");
        const wf = await supervisor.approveTask(id);
        printer.success(`Approved ${id}.`);
        printWorkflowSummary(wf);
        return 0;
      }

      case "reject": {
        const id = rest[0];
        if (!id) return fail("Provide a task id.");
        const reason = rest.slice(1).join(" ");
        const wf = await supervisor.rejectTask(id, reason);
        printer.warn(`Rejected ${id} — correction requested.`);
        printWorkflowSummary(wf);
        return 0;
      }

      case "retry": {
        const id = rest[0];
        if (!id) return fail("Provide a task id.");
        const wf = await supervisor.retryTask(id);
        printer.success(`Retried ${id}.`);
        printWorkflowSummary(wf);
        return 0;
      }

      case "pause": {
        const id = rest[0];
        if (!id) return fail("Provide a workflow id.");
        supervisor.pauseWorkflow(id);
        printer.success(`Paused ${id}.`);
        return 0;
      }

      case "resume": {
        const id = rest[0];
        if (!id) return fail("Provide a workflow id.");
        const wf = await supervisor.resumeWorkflow(id);
        printer.success(`Resumed ${id}.`);
        printWorkflowSummary(wf);
        return 0;
      }

      case "logs": {
        const id = rest[0];
        const entries = supervisor.getAuditLog(id);
        printer.heading(`Audit log${id ? ` — ${id}` : ""}`);
        for (const e of entries.slice().reverse()) {
          printer.line(`  ${e.created_at}  ${e.action.padEnd(22)} ${printer.colorStatus(e.status)}  ${e.message}`);
        }
        return 0;
      }

      case undefined:
      case "help":
      case "--help":
      case "-h":
        usage();
        return 0;

      default:
        printer.error(`Unknown command: ${command}`);
        usage();
        return 1;
    }
  } catch (e) {
    printer.error(e instanceof Error ? e.message : String(e));
    return 1;
  }
}

function fail(msg: string): number {
  printer.error(msg);
  return 1;
}
