import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { loadAllConfigs, loadUserConfig } from "../../config/loadUserConfig.js";
import { promptConfigName } from "../../config/promptConfigName.js";
import { encryptGraphJson } from "../../encryption/encrypt.js";
import { decryptGraphJson } from "../../encryption/nodeDecrypt.js";

/**
 * Clone or pull the GitHub Pages repo for a given config.
 *
 * @returns The path to the local repo directory.
 */
function syncRepo(fullRepoName: string): string {
  const repoShortName = fullRepoName.split("/")[1]!;
  const pagesDir = resolve("pages");
  const repoDir = resolve(pagesDir, repoShortName);

  if (!existsSync(repoDir)) {
    console.log(`\nCloning ${fullRepoName} into pages/...`);
    mkdirSync(pagesDir, { recursive: true });
    execFileSync("gh", ["repo", "clone", fullRepoName, repoDir], {
      stdio: "inherit",
    });
  } else {
    console.log(`\nPulling latest from ${fullRepoName}...`);
    const httpsUrl = `https://github.com/${fullRepoName}.git`;
    execFileSync("git", ["remote", "set-url", "origin", httpsUrl], {
      cwd: repoDir,
    });
    execFileSync(
      "git",
      ["config", "--local", "credential.helper", "!gh auth git-credential"],
      { cwd: repoDir }
    );
    execFileSync("git", ["pull", "origin", "main"], {
      cwd: repoDir,
      stdio: "inherit",
    });
  }

  return repoDir;
}

/**
 * Ensure plain-text-graph.json exists by decrypting graph.json if needed.
 *
 * If graph.json is encrypted and a password is configured, decrypts it
 * and writes plain-text-graph.json. If graph.json is plaintext JSON,
 * copies it as plain-text-graph.json. If plain-text-graph.json already
 * exists, rebuilds graph.json from it (encrypting if password is set).
 */
function syncGraphJson(repoDir: string, password: string): void {
  const plainTextPath = resolve(repoDir, "plain-text-graph.json");
  const graphPath = resolve(repoDir, "graph.json");

  if (existsSync(plainTextPath)) {
    // plain-text-graph.json is the source of truth — rebuild graph.json
    const plaintext = readFileSync(plainTextPath, "utf-8");

    if (password) {
      const encrypted = encryptGraphJson(plaintext, password);
      writeFileSync(graphPath, encrypted, "utf-8");
      console.log("Encrypted plain-text-graph.json → graph.json");
    } else {
      writeFileSync(graphPath, plaintext, "utf-8");
      console.log("Copied plain-text-graph.json → graph.json");
    }
    return;
  }

  if (!existsSync(graphPath)) {
    console.log("No graph.json found. Nothing to sync.");
    return;
  }

  const content = readFileSync(graphPath, "utf-8");

  // Check if graph.json is plaintext JSON
  try {
    JSON.parse(content);
    // It's plaintext — write as plain-text-graph.json
    writeFileSync(plainTextPath, content, "utf-8");
    console.log("Created plain-text-graph.json from plaintext graph.json");
    return;
  } catch {
    // Not valid JSON — likely encrypted
  }

  if (!password) {
    console.error(
      "graph.json appears encrypted but no password is configured.\n" +
        "Set a password in your config to decrypt."
    );
    process.exit(1);
  }

  try {
    const decrypted = decryptGraphJson(content, password);
    writeFileSync(plainTextPath, decrypted, "utf-8");
    console.log("Decrypted graph.json → plain-text-graph.json");
  } catch {
    console.error(
      "Failed to decrypt graph.json. Check that your password is correct."
    );
    process.exit(1);
  }
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
    writeFileSync(
      gitignorePath,
      content.trimEnd() + "\n" + entry + "\n",
      "utf-8"
    );
  } else {
    writeFileSync(gitignorePath, entry + "\n", "utf-8");
  }
}

/**
 * Sync a config's GitHub Pages repo to the local filesystem.
 *
 * Clones or pulls the repo, then ensures plain-text-graph.json exists
 * (decrypting graph.json if needed) and graph.json is up to date.
 */
async function sync(): Promise<void> {
  console.log("\n=== External Cortex – Sync ===\n");

  const allConfigs = loadAllConfigs();
  const allNames = Object.keys(allConfigs);

  if (allNames.length === 0) {
    console.error(
      "No configurations found. Add a config to ~/.external-cortex/config.json first."
    );
    process.exit(1);
  }

  const selectedName = await promptConfigName(allNames, false);
  const config = loadUserConfig(selectedName);

  console.log(`\nUsing config: "${selectedName}"`);

  if (!config.githubRepoName) {
    console.error(
      "This config has no githubRepoName set. Nothing to sync.\n" +
        'Run "npm run config:edit" to set a GitHub repository.'
    );
    process.exit(1);
  }

  console.log(`Repository: ${config.githubRepoName}`);

  const repoDir = syncRepo(config.githubRepoName);
  ensureGitignore(repoDir);
  syncGraphJson(repoDir, config.password);

  console.log(`\nSync complete! Local repo: ${repoDir}`);
}

sync().catch((err: unknown) => {
  console.error("\nSync failed:", err);
  process.exit(1);
});
