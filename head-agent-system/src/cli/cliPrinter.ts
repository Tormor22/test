/** Terminal formatting helpers for the Supervisor CLI. No business logic. */
/* eslint-disable no-console */

const c = {
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
};

const statusColor = (s: string): string => {
  if (["completed", "approved", "ok", "running"].includes(s)) return c.green(s);
  if (["failed", "needs_human_review"].includes(s)) return c.red(s);
  if (["paused", "correction_required", "rejected"].includes(s)) return c.yellow(s);
  return c.cyan(s);
};

export const printer = {
  heading(text: string) {
    console.log("\n" + c.bold(c.cyan(`▌ ${text}`)));
  },
  line(text = "") {
    console.log(text);
  },
  kv(key: string, value: unknown) {
    console.log(`  ${c.dim(key.padEnd(16))} ${typeof value === "string" ? value : JSON.stringify(value)}`);
  },
  status(label: string, status: string) {
    console.log(`  ${c.dim(label.padEnd(16))} ${statusColor(status)}`);
  },
  success(text: string) {
    console.log(c.green(`✓ ${text}`));
  },
  warn(text: string) {
    console.log(c.yellow(`⚠ ${text}`));
  },
  error(text: string) {
    console.error(c.red(`✗ ${text}`));
  },
  bullet(text: string) {
    console.log(`  • ${text}`);
  },
  json(obj: unknown) {
    console.log(JSON.stringify(obj, null, 2));
  },
  colorStatus: statusColor,
};
