import { execFileSync } from "node:child_process";

/**
 * Options for running a shell command.
 */
export interface RunCommandOptions {
  /** Working directory for the command. */
  cwd?: string;
  /** How to handle stdio. Defaults to `"inherit"`. */
  stdio?: "inherit" | "pipe";
}

/**
 * Run a shell command synchronously and return its stdout.
 *
 * Thin wrapper around `execFileSync` to allow easy mocking in tests.
 *
 * @param command - The executable to run.
 * @param args - Arguments to pass.
 * @param options - Execution options.
 * @returns The command's stdout as a string (when stdio is `"pipe"` or default encoding).
 */
export function runCommand(
  command: string,
  args: string[],
  options: RunCommandOptions = {}
): string {
  const result = execFileSync(command, args, {
    cwd: options.cwd,
    stdio: options.stdio ?? "inherit",
    encoding: "utf-8",
  });
  return typeof result === "string" ? result : "";
}
