#!/usr/bin/env node
// External Cortex CLI entrypoint.
//
// This shim resolves the TypeScript CLI dispatcher via `tsx` so the
// published package can ship TS source without a build step.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, "..");
const cliEntry = resolve(packageRoot, "src/cli/index.ts");

const require = createRequire(import.meta.url);
const tsxBin = require.resolve("tsx/cli");

const child = spawn(process.execPath, [tsxBin, cliEntry, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, EC_PACKAGE_ROOT: packageRoot },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
