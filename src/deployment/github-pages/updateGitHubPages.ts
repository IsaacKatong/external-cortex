import { existsSync, readdirSync, cpSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { runCommand } from "./runCommand.js";
import { detectGitProtocol, buildRemoteUrl } from "./detectGitProtocol.js";

/**
 * Update an existing GitHub Pages repository with a fresh build.
 *
 * 1. If the repo is not yet cloned into `pages/`, clone it.
 *    If it already exists, pull the latest changes.
 * 2. Copy the contents of `dist/` into the local clone, preserving `graph.json`.
 * 3. Commit and push.
 *
 * @param fullRepoName - Full repository name in `owner/repo` format.
 * @param projectRoot - Absolute path to the project root. Defaults to `process.cwd()`.
 */
export function updateGitHubPages(
  fullRepoName: string,
  projectRoot: string = process.cwd()
): void {
  const repoShortName = fullRepoName.split("/")[1]!;
  const pagesDir = resolve(projectRoot, "pages");
  const repoDir = resolve(pagesDir, repoShortName);
  const distDir = resolve(projectRoot, "dist");

  ensureClone(fullRepoName, pagesDir, repoDir);
  copyBuildOutput(distDir, repoDir);
  commitAndPush(repoDir);
}

/**
 * Clone the repo if it doesn't exist locally, otherwise pull latest.
 */
function ensureClone(
  fullRepoName: string,
  pagesDir: string,
  repoDir: string
): void {
  const protocol = detectGitProtocol();
  const remoteUrl = buildRemoteUrl(fullRepoName, protocol);

  if (!existsSync(repoDir)) {
    runCommand("git", ["clone", remoteUrl, repoDir], { cwd: pagesDir });
  } else {
    runCommand("git", ["pull"], { cwd: repoDir });
  }
}

/**
 * Copy all files from dist/ into the repo directory, skipping graph.json.
 *
 * Removes existing files first (except `.git` and `graph.json`) so that
 * stale assets from previous builds don't linger.
 */
function copyBuildOutput(distDir: string, repoDir: string): void {
  // Remove existing files except .git and graph.json
  for (const entry of readdirSync(repoDir)) {
    if (entry === ".git" || entry === "graph.json") continue;
    rmSync(join(repoDir, entry), { recursive: true, force: true });
  }

  // Copy new build output, skipping graph.json
  for (const entry of readdirSync(distDir)) {
    if (entry === "graph.json") continue;
    cpSync(join(distDir, entry), join(repoDir, entry), { recursive: true });
  }
}

/**
 * Stage all changes, commit, and push to origin.
 */
function commitAndPush(repoDir: string): void {
  runCommand("git", ["add", "-A"], { cwd: repoDir });
  runCommand(
    "git",
    ["commit", "-m", "Update External Cortex GitHub Pages"],
    { cwd: repoDir }
  );
  runCommand("git", ["push"], { cwd: repoDir });
}
