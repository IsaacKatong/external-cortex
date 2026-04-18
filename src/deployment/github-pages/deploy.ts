import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { createInterface } from "node:readline";
import { promptRepoName } from "./promptRepoName.js";
import { createGitHubRepo } from "./createGitHubRepo.js";
import { buildForGitHubPages } from "./buildForGitHubPages.js";
import { uploadToGitHubPages } from "./uploadToGitHubPages.js";
import { updateGitHubPages } from "./updateGitHubPages.js";
import { ensureRepoClone } from "./ensureRepoClone.js";
import { loadAllConfigs, loadUserConfig } from "../../config/loadUserConfig.js";
import { promptConfigName } from "../../config/promptConfigName.js";

/**
 * Check if graph.json has local uncommitted changes in the pages repo.
 *
 * Compares the working tree against HEAD to detect modifications.
 * Returns true if graph.json has been modified locally.
 */
function hasLocalGraphChanges(repoDir: string): boolean {
  try {
    const status = execFileSync("git", ["status", "--porcelain", "--", "graph.json"], {
      cwd: repoDir,
      encoding: "utf-8",
    });
    return status.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Discard local changes to graph.json in the pages repo by restoring
 * the version from HEAD.
 */
function discardGraphChanges(repoDir: string): void {
  execFileSync("git", ["checkout", "HEAD", "--", "graph.json"], {
    cwd: repoDir,
    stdio: "inherit",
  });
}

/**
 * Prompt the user to choose how to handle local graph.json changes.
 *
 * @returns The user's choice: "remove", "deploy", or "abort".
 */
async function promptGraphChangeAction(): Promise<"remove" | "deploy" | "abort"> {
  if (!process.stdin.isTTY) {
    console.log("Non-interactive environment: aborting due to local graph.json changes.");
    return "abort";
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  const prompt =
    "\n⚠️  Warning: graph.json has local changes.\n" +
    "Deploying will overwrite the existing graph.json with no version checks.\n\n" +
    "  1. Remove graph.json changes before deploying\n" +
    "  2. Deploy with graph.json changes\n" +
    "  3. Abort deploy\n\n" +
    "Select an option (1-3): ";

  return new Promise<"remove" | "deploy" | "abort">((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      const trimmed = answer.trim();
      switch (trimmed) {
        case "1":
          resolve("remove");
          break;
        case "2":
          resolve("deploy");
          break;
        default:
          resolve("abort");
          break;
      }
    });
  });
}

/**
 * Deploy External Cortex to GitHub Pages.
 *
 * Prompts the user to select a named configuration (no default option),
 * then deploys using that config. If a password is configured,
 * plain-text-graph.json is encrypted to graph.json before building.
 */
async function deploy(): Promise<void> {
  console.log("\n=== External Cortex – GitHub Pages Deployment ===\n");

  const allConfigs = loadAllConfigs();
  const allNames = Object.keys(allConfigs);

  if (allNames.length === 0) {
    console.error("No configurations found. Add a config to ~/.external-cortex/config.json first.");
    process.exit(1);
  }

  const selectedName = await promptConfigName(allNames, false);
  const config = loadUserConfig(selectedName);

  console.log(`\nUsing config: "${selectedName}"`);

  if (config.githubRepoName) {
    const fullRepoName = config.githubRepoName;
    const repoShortName = fullRepoName.split("/")[1]!;
    const pagesDir = resolve("pages");
    const repoDir = resolve(pagesDir, repoShortName);
    console.log(`Using configured repository: "${fullRepoName}"`);

    // Ensure the repo is cloned locally before building. The vite build
    // writes sql.js WASM and other public assets into this directory, so
    // it must exist on disk before `buildForGitHubPages` runs.
    console.log(`\nSyncing repository to ${repoDir}...`);
    ensureRepoClone(fullRepoName, pagesDir);

    // Check for local graph.json changes before proceeding
    if (existsSync(repoDir) && hasLocalGraphChanges(repoDir)) {
      const action = await promptGraphChangeAction();
      switch (action) {
        case "remove":
          console.log("\nRemoving local graph.json changes...");
          discardGraphChanges(repoDir);
          console.log("Local graph.json changes removed.");
          break;
        case "deploy":
          console.log("\nProceeding with local graph.json changes...");
          break;
        case "abort":
          console.log("\nDeploy aborted.");
          process.exit(0);
      }
    }

    console.log(`\nBuilding for GitHub Pages (base: /${repoShortName}/)...`);
    buildForGitHubPages(repoShortName, selectedName);
    console.log("Build complete.");

    console.log("\nUpdating GitHub Pages repository...");
    await updateGitHubPages(fullRepoName, config.password);
    console.log(`\nDeployment complete!`);
  } else {
    const suggestedName = "external-cortex-site";
    const repoName = await promptRepoName(suggestedName);

    console.log(`\nCreating GitHub repository "${repoName}"...`);
    const { fullName, htmlUrl } = createGitHubRepo(repoName);
    console.log(`Repository created: ${htmlUrl}`);

    console.log(`\nBuilding for GitHub Pages (base: /${repoName}/)...`);
    buildForGitHubPages(repoName, selectedName);
    console.log("Build complete.");

    console.log("\nUploading to GitHub Pages...");
    const { pagesUrl } = uploadToGitHubPages(fullName);
    console.log(`\nDeployment complete!`);
    console.log(`Repository: ${htmlUrl}`);
    console.log(`Site URL:   ${pagesUrl}`);
    console.log(
      "\nNote: GitHub Pages may take a few minutes to become available."
    );
  }
}

deploy().catch((err: unknown) => {
  console.error("\nDeployment failed:", err);
  process.exit(1);
});
