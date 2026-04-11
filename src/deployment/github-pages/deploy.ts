import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { promptRepoName } from "./promptRepoName.js";
import { createGitHubRepo } from "./createGitHubRepo.js";
import { buildForGitHubPages } from "./buildForGitHubPages.js";
import { uploadToGitHubPages } from "./uploadToGitHubPages.js";
import { updateGitHubPages } from "./updateGitHubPages.js";
import { loadAllConfigs, loadUserConfig } from "../../config/loadUserConfig.js";
import { promptConfigName } from "../../config/promptConfigName.js";
import { encryptGraphJson } from "../../encryption/encrypt.js";

/**
 * Build graph.json from plain-text-graph.json in the pages repo.
 *
 * If a password is configured, encrypts the plaintext and writes to
 * graph.json. Otherwise copies plain-text-graph.json as-is to graph.json.
 * If plain-text-graph.json doesn't exist, falls back to existing graph.json.
 */
function buildGraphJsonInRepo(repoDir: string, password: string): void {
  const plainTextPath = resolve(repoDir, "plain-text-graph.json");
  const graphPath = resolve(repoDir, "graph.json");

  if (!existsSync(plainTextPath)) {
    if (existsSync(graphPath)) {
      const existing = readFileSync(graphPath, "utf-8");
      if (existing.trimStart().startsWith("{")) {
        writeFileSync(plainTextPath, existing, "utf-8");
        console.log("Created plain-text-graph.json from existing graph.json");
      } else {
        console.log("graph.json is already encrypted, using as-is.");
        return;
      }
    } else {
      console.log("No graph.json found, skipping encryption.");
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
    console.log("Copied plain-text-graph.json → graph.json");
  }
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
    console.log(`Using configured repository: "${fullRepoName}"`);

    console.log(`\nBuilding for GitHub Pages (base: /${repoShortName}/)...`);
    buildForGitHubPages(repoShortName, selectedName);
    console.log("Build complete.");

    console.log("\nUpdating GitHub Pages repository...");
    updateGitHubPages(fullRepoName, config.password);
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
