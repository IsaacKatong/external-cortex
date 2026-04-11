import { readFileSync, writeFileSync, existsSync } from "node:fs";
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
 * If the config has a password, encrypt graph.json in the given directory.
 *
 * Reads the existing `graph.json`, encrypts it, and overwrites the file
 * with the base64-encoded ciphertext.
 */
function encryptGraphIfNeeded(
  directory: string,
  password: string
): void {
  if (!password) return;

  const graphPath = resolve(directory, "graph.json");
  if (!existsSync(graphPath)) return;

  const plaintext = readFileSync(graphPath, "utf-8");
  const encrypted = encryptGraphJson(plaintext, password);
  writeFileSync(graphPath, encrypted, "utf-8");
  console.log("Encrypted graph.json with configured password.");
}

/**
 * Deploy External Cortex to GitHub Pages.
 *
 * Prompts the user to select a named configuration (no default option),
 * then deploys using that config. If `githubRepoName` is set, updates
 * the existing Pages repo. Otherwise, runs the full interactive flow.
 * If a password is configured, graph.json is encrypted before upload.
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

    encryptGraphIfNeeded(resolve("dist"), config.password);

    console.log("\nUpdating GitHub Pages repository...");
    updateGitHubPages(fullRepoName);
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

    encryptGraphIfNeeded(resolve("dist"), config.password);

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
