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
import { decryptGraphJson } from "../../encryption/nodeDecrypt.js";
import { parseEnvelope } from "../../encryption/parseEnvelope.js";
import { promptPasswordAction } from "./promptPasswordAction.js";

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
export async function updateGitHubPages(
  fullRepoName: string,
  password: string = "",
  projectRoot: string = process.cwd()
): Promise<void> {
  const repoShortName = fullRepoName.split("/")[1]!;
  const pagesDir = resolve(projectRoot, "pages");
  const repoDir = resolve(pagesDir, repoShortName);
  const distDir = resolve(projectRoot, "dist");

  ensureClone(fullRepoName, pagesDir, repoDir);
  configureRemote(repoDir, fullRepoName);
  copyBuildOutput(distDir, repoDir);
  await buildGraphJson(repoDir, password);
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
 * Read the version number from a JSON string.
 * Returns 0 if the string is not valid JSON or has no version field.
 */
function readVersion(json: string): number {
  try {
    const parsed = JSON.parse(json);
    return typeof parsed.version === "number" ? parsed.version : 0;
  } catch {
    return 0;
  }
}

/**
 * Encrypt plaintext graph JSON and write both graph.json and plain-text-graph.json.
 */
function encryptAndWrite(
  plaintext: string,
  password: string,
  graphPath: string,
  plainTextPath: string
): void {
  const version = readVersion(plaintext);
  const encrypted = encryptGraphJson(plaintext, password, version);
  writeFileSync(graphPath, encrypted, "utf-8");
  writeFileSync(plainTextPath, plaintext, "utf-8");
  console.log("Encrypted plain-text-graph.json → graph.json");
}

/**
 * Build graph.json, validating encryption state before writing.
 *
 * When a password is configured and graph.json is already encrypted:
 * 1. Try decrypting with the configured password.
 *    - If it matches and content is unchanged → skip (no spurious diff).
 *    - If it matches but plaintext content changed → re-encrypt.
 * 2. If the password doesn't match, prompt the user to provide the
 *    old password or overwrite from plain-text-graph.json.
 *
 * If no password is configured, copies plain-text-graph.json as-is.
 * If plain-text-graph.json doesn't exist, seeds it from graph.json.
 */
async function buildGraphJson(repoDir: string, password: string): Promise<void> {
  const plainTextPath = resolve(repoDir, "plain-text-graph.json");
  const graphPath = resolve(repoDir, "graph.json");

  // Seed plain-text-graph.json from graph.json if it doesn't exist yet
  if (!existsSync(plainTextPath)) {
    if (existsSync(graphPath)) {
      const existing = readFileSync(graphPath, "utf-8");
      const envelope = parseEnvelope(existing);
      if (!envelope) {
        // Plaintext graph.json — use as plain-text-graph.json
        writeFileSync(plainTextPath, existing, "utf-8");
        console.log("Created plain-text-graph.json from existing graph.json");
      }
    }
    // graph.json is already correct (or doesn't exist) — nothing to do
    return;
  }

  // No password → copy plaintext as-is
  if (!password) {
    copyFileSync(plainTextPath, graphPath);
    return;
  }

  // Password is configured — check existing graph.json encryption state
  if (existsSync(graphPath)) {
    const content = readFileSync(graphPath, "utf-8");
    const envelope = parseEnvelope(content);

    if (envelope) {
      // graph.json is encrypted — verify the password matches
      try {
        const decrypted = decryptGraphJson(envelope.graph_blob, password);
        // Password matches — check if plaintext content has changed
        const plaintext = readFileSync(plainTextPath, "utf-8");
        if (decrypted === plaintext) {
          console.log("graph.json already up to date, skipping re-encryption.");
          return;
        }
        // Content changed — re-encrypt with current password
        console.log("plain-text-graph.json changed, re-encrypting...");
        encryptAndWrite(plaintext, password, graphPath, plainTextPath);
        return;
      } catch {
        // Password mismatch — prompt the user
        const action = await promptPasswordAction();

        if (action.kind === "reencrypt") {
          try {
            const decrypted = decryptGraphJson(envelope.graph_blob, action.oldPassword);
            // Re-encrypt with new password, update plain-text-graph.json
            encryptAndWrite(decrypted, password, graphPath, plainTextPath);
            console.log("Re-encrypted graph.json with the new password.");
            return;
          } catch {
            console.error("Old password is incorrect. Aborting deployment.");
            process.exit(1);
          }
        }

        // action.kind === "overwrite" — fall through to encrypt from plaintext
        console.log("Overwriting graph.json from plain-text-graph.json...");
      }
    }
  }

  // Encrypt from plain-text-graph.json (new graph, plaintext graph, or overwrite)
  const plaintext = readFileSync(plainTextPath, "utf-8");
  encryptAndWrite(plaintext, password, graphPath, plainTextPath);
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
