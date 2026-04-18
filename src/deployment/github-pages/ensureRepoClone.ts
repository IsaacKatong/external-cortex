import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { runCommand } from "./runCommand.js";

/**
 * Clone the GitHub Pages repo if it is not already present locally,
 * otherwise fetch and hard-reset to origin/main. Also ensures the repo
 * has a `.gitignore` that excludes `plain-text-graph.json`.
 *
 * Safe to call repeatedly — reuses an existing clone and never loses
 * committed history, just resets the working tree.
 *
 * @param fullRepoName - Full repository name in `owner/repo` format.
 * @param pagesDir - Absolute path to the dir holding one sub-directory
 *   per cloned repo (e.g., `~/.external-cortex/pages/`).
 * @returns Absolute path to the local clone.
 */
export function ensureRepoClone(fullRepoName: string, pagesDir: string): string {
  const repoShortName = fullRepoName.split("/")[1];
  if (!repoShortName) {
    throw new Error(
      `Invalid repo name "${fullRepoName}" — expected "owner/repo" format.`
    );
  }

  const repoDir = resolve(pagesDir, repoShortName);

  if (!existsSync(repoDir)) {
    mkdirSync(pagesDir, { recursive: true });
    runCommand("gh", ["repo", "clone", fullRepoName, repoDir]);
  } else {
    configureRemote(repoDir, fullRepoName);
    runCommand("git", ["fetch", "origin", "main"], { cwd: repoDir });
    runCommand("git", ["reset", "--hard", "origin/main"], { cwd: repoDir });
  }

  ensureGitignore(repoDir);
  return repoDir;
}

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

function ensureGitignore(repoDir: string): void {
  const gitignorePath = resolve(repoDir, ".gitignore");
  const entry = "plain-text-graph.json";

  if (existsSync(gitignorePath)) {
    const content = readFileSync(gitignorePath, "utf-8");
    if (content.includes(entry)) return;
    writeFileSync(
      gitignorePath,
      content.trimEnd() + "\n" + entry + "\n",
      "utf-8"
    );
  } else {
    writeFileSync(gitignorePath, entry + "\n", "utf-8");
  }
}
