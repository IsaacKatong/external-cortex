import { existsSync, mkdirSync, readdirSync, cpSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { runCommand } from "./runCommand.js";

/**
 * Update an existing GitHub Pages repository with a fresh build.
 *
 * 1. If the repo is not yet cloned into `pages/`, clone it via `gh`.
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
  configureRemote(repoDir, fullRepoName);
  copyBuildOutput(distDir, repoDir);
  commitAndPush(repoDir);
}

/**
 * Clone the repo via `gh` if it doesn't exist locally, otherwise pull latest.
 */
function ensureClone(
  fullRepoName: string,
  pagesDir: string,
  repoDir: string
): void {
  if (!existsSync(repoDir)) {
    mkdirSync(pagesDir, { recursive: true });
    runCommand("gh", ["repo", "clone", fullRepoName, repoDir]);
  } else {
    configureRemote(repoDir, fullRepoName);
    runCommand("git", ["pull", "origin", "main"], { cwd: repoDir });
  }
}

/**
 * Set the origin remote to HTTPS and configure the `gh` credential helper
 * so that git operations authenticate via the GitHub CLI token.
 */
function configureRemote(repoDir: string, fullRepoName: string): void {
  const httpsUrl = `https://github.com/${fullRepoName}.git`;
  runCommand("git", ["remote", "set-url", "origin", httpsUrl], {
    cwd: repoDir,
  });
  runCommand(
    "git",
    ["config", "--local", "credential.helper", "!gh auth git-credential"],
    { cwd: repoDir }
  );
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

  // Copy new build output, skipping .git and graph.json
  for (const entry of readdirSync(distDir)) {
    if (entry === ".git" || entry === "graph.json") continue;
    cpSync(join(distDir, entry), join(repoDir, entry), { recursive: true });
  }
}

/**
 * Stage all changes, commit, and push to origin.
 *
 * If there are no changes to commit, skips the commit and push.
 */
function commitAndPush(repoDir: string): void {
  runCommand("git", ["add", "-A"], { cwd: repoDir });

  const status = runCommand("git", ["status", "--porcelain"], {
    cwd: repoDir,
    stdio: "pipe",
  });

  if (!status.trim()) {
    console.log("No changes to deploy.");
    return;
  }

  runCommand(
    "git",
    ["commit", "-m", "Update External Cortex GitHub Pages"],
    { cwd: repoDir }
  );
  runCommand("git", ["push", "-u", "origin", "main", "--force"], {
    cwd: repoDir,
  });
}
