import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Absolute path to the installed external-cortex package root.
 *
 * The `bin/cli.js` shim sets `EC_PACKAGE_ROOT` before invoking this
 * dispatcher. Falling back to the source file's own location keeps
 * this importable from tests run directly via tsx in the repo.
 */
export const PACKAGE_ROOT: string =
  process.env.EC_PACKAGE_ROOT ??
  resolve(fileURLToPath(import.meta.url), "../../..");
