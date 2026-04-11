import {
  existsSync,
  mkdirSync,
  readdirSync,
  cpSync,
  rmSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { runCommand } from "./runCommand.js";
import { encryptGraphJson } from "../../encryption/encrypt.js";

const PRESERVED_FILES = new Set([".git", ".gitignore", "graph.json", "plain-text-graph.json"]);

/**
 * Update an existing GitHub Pages repository with a fresh build.
 *
 * 1. If the repo is not yet cloned into `pages/`, clone it via `gh`.
 *    If it already exists, pull the latest changes.
 * 2. Copy the contents of `dist/` into the local clone, preserving
 *    `graph.json` and `plain-text-graph.json`.
 * 3. Build `graph.json` from `plain-text-graph.json` (encrypting if password is set).
 * 4. Commit and push.
 *
 * @param fullRepoName - Full repository name in `owner/repo` format.
 * @param password - Password for encryption. Empty string means no encryption.
 * @param projectRoot - Absolute path to the project root. Defaults to `process.cwd()`.
 */
export function updateGitHubPages(
  fullRepoName: string,
  password: string = "",
  projectRoot: string = process.cwd()
): void {
  const repoShortName = fullRepoName.split("/")[1]!;
  const pagesDir = resolve(projectRoot, "pages");
  const repoDir = resolve(pagesDir, repoShortName);
  const distDir = resolve(projectRoot, "dist");

  ensureClone(fullRepoName, pagesDir, repoDir);
  configureRemote(repoDir, fullRepoName);
  copyBuildOutput(distDir, repoDir);
  buildGraphJson(repoDir, password);
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
    runCommand("git", ["fetch", "origin", "main"], { cwd: repoDir });
    runCommand("git", ["reset", "--hard", "origin/main"], { cwd: repoDir });
  }

  ensureGitignore(repoDir);
}

/**
 * Ensure the pages repo has a .gitignore that excludes plain-text-graph.json.
 */
function ensureGitignore(repoDir: string): void {
  const gitignorePath = resolve(repoDir, ".gitignore");
  const entry = "plain-text-graph.json";

  if (existsSync(gitignorePath)) {
    const content = readFileSync(gitignorePath, "utf-8");
    if (content.includes(entry)) return;
    writeFileSync(gitignorePath, content.trimEnd() + "\n" + entry + "\n", "utf-8");
  } else {
    writeFileSync(gitignorePath, entry + "\n", "utf-8");
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
 * Copy all files from dist/ into the repo directory, preserving
 * graph.json and plain-text-graph.json.
 *
 * Removes existing files first (except preserved files) so that
 * stale assets from previous builds don't linger.
 */
function copyBuildOutput(distDir: string, repoDir: string): void {
  for (const entry of readdirSync(repoDir)) {
    if (PRESERVED_FILES.has(entry)) continue;
    rmSync(join(repoDir, entry), { recursive: true, force: true });
  }

  for (const entry of readdirSync(distDir)) {
    if (PRESERVED_FILES.has(entry)) continue;
    cpSync(join(distDir, entry), join(repoDir, entry), { recursive: true });
  }
}

/**
 * Build graph.json from plain-text-graph.json.
 *
 * If a password is set, encrypts the plaintext. Otherwise copies as-is.
 * If plain-text-graph.json doesn't exist, seeds it from graph.json.
 */
function buildGraphJson(repoDir: string, password: string): void {
  const plainTextPath = resolve(repoDir, "plain-text-graph.json");
  const graphPath = resolve(repoDir, "graph.json");

  if (!existsSync(plainTextPath)) {
    if (existsSync(graphPath)) {
      const existing = readFileSync(graphPath, "utf-8");
      if (existing.trimStart().startsWith("{")) {
        writeFileSync(plainTextPath, existing, "utf-8");
        console.log("Created plain-text-graph.json from existing graph.json");
      } else {
        return;
      }
    } else {
      return;
    }
  }

  const plaintext = readFileSync(plainTextPath, "utf-8");

  if (password) {
    const encrypted = encryptGraphJson(plaintext, password);
    writeFileSync(graphPath, encrypted, "utf-8");
    console.log("Encrypted plain-text-graph.json → graph.json");
  } else {
    copyFileSync(plainTextPath, graphPath);
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
