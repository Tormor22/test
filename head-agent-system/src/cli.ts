#!/usr/bin/env node
/**
 * CLI entry point (spec §9).
 *
 * The CLI calls the Supervisor Agent ONLY. It does not import or run any
 * individual agent. Run via:
 *   npm run supervisor -- <command> [args]
 *
 * Examples:
 *   npm run supervisor -- create "AI tools for TikTok creators"
 *   npm run supervisor -- status
 *   npm run supervisor -- agents
 *   npm run supervisor -- errors
 */
import { runCli } from "./cli/commandRouter.js";

runCli(process.argv.slice(2))
  .then((code) => process.exit(code))
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
