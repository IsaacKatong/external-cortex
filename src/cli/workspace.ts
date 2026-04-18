import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

/**
 * Root directory where the CLI caches per-user state: config file and
 * per-repo clones of GitHub Pages targets.
 */
export const USER_STATE_DIR: string = resolve(homedir(), ".external-cortex");

/**
 * Directory holding cloned GitHub Pages repos, one per configured target.
 * Replaces the old project-local `pages/` directory so the CLI works the
 * same regardless of the user's cwd.
 */
export const WORKSPACES_DIR: string = resolve(USER_STATE_DIR, "workspaces");

/**
 * Return the absolute path to the workspace for a given full repo name
 * (`owner/repo`), creating parent directories as needed.
 */
export function workspaceDirFor(fullRepoName: string): string {
  const shortName = fullRepoName.split("/")[1];
  if (!shortName) {
    throw new Error(
      `Invalid repo name "${fullRepoName}" — expected "owner/repo" format.`
    );
  }
  mkdirSync(WORKSPACES_DIR, { recursive: true });
  return resolve(WORKSPACES_DIR, shortName);
}
