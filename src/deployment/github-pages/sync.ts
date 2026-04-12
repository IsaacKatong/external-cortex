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
import type { EncryptedGraphEnvelope } from "../../external-storage/types.js";

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
    execFileSync("git", ["fetch", "origin", "main"], {
      cwd: repoDir,
      stdio: "inherit",
    });
    execFileSync("git", ["reset", "--hard", "origin/main"], {
      cwd: repoDir,
      stdio: "inherit",
    });
  }

  return repoDir;
}

/**
 * Parse an encrypted graph envelope from raw file content.
 *
 * Returns the envelope if the content has a `graph_blob` field,
 * or wraps legacy raw-base64 content in an envelope with version 0.
 * Returns `null` if the content is plaintext JSON.
 */
function parseEnvelope(content: string): EncryptedGraphEnvelope | null {
  try {
    const parsed = JSON.parse(content);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "graph_blob" in parsed
    ) {
      return parsed as EncryptedGraphEnvelope;
    }
    return null;
  } catch {
    // Not valid JSON — treat as legacy raw base64 ciphertext
    return { graph_blob: content, version: 0 };
  }
}

/**
 * Sync graph.json → plain-text-graph.json, then rebuild graph.json.
 *
 * The pulled graph.json has priority as the source of truth:
 * 1. If graph.json exists, derive plain-text-graph.json from it
 *    (decrypting if encrypted, copying if plaintext).
 * 2. Then rebuild graph.json from plain-text-graph.json
 *    (encrypting if password is set).
 */
function syncGraphJson(repoDir: string, password: string): void {
  const plainTextPath = resolve(repoDir, "plain-text-graph.json");
  const graphPath = resolve(repoDir, "graph.json");

  // Step 1: Derive plain-text-graph.json from the pulled graph.json
  if (existsSync(graphPath)) {
    const content = readFileSync(graphPath, "utf-8");
    const envelope = parseEnvelope(content);

    if (envelope) {
      // Encrypted content — decrypt the blob
      if (!password) {
        console.error(
          "graph.json appears encrypted but no password is configured.\n" +
            "Set a password in your config to decrypt."
        );
        process.exit(1);
      }

      try {
        const decrypted = decryptGraphJson(envelope.graph_blob, password);
        writeFileSync(plainTextPath, decrypted, "utf-8");
        console.log("Decrypted graph.json → plain-text-graph.json");
      } catch {
        console.error(
          "Failed to decrypt graph.json. Check that your password is correct."
        );
        process.exit(1);
      }
    } else {
      // Plaintext JSON — use as plain-text-graph.json
      writeFileSync(plainTextPath, content, "utf-8");
      console.log("Copied graph.json → plain-text-graph.json");
    }
  } else if (!existsSync(plainTextPath)) {
    console.log("No graph.json found. Nothing to sync.");
    return;
  }

  // Step 2: Rebuild graph.json from plain-text-graph.json
  const plaintext = readFileSync(plainTextPath, "utf-8");

  if (password) {
    // Read version from the plaintext graph
    let version = 0;
    try {
      const parsed = JSON.parse(plaintext);
      if (typeof parsed.version === "number") {
        version = parsed.version;
      }
    } catch {
      // ignore parse errors
    }

    const encrypted = encryptGraphJson(plaintext, password, version);
    writeFileSync(graphPath, encrypted, "utf-8");
    console.log("Encrypted plain-text-graph.json → graph.json");
  } else {
    writeFileSync(graphPath, plaintext, "utf-8");
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
