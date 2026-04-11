import { promptRepoName } from "./promptRepoName.js";
import { createGitHubRepo } from "./createGitHubRepo.js";
import { buildForGitHubPages } from "./buildForGitHubPages.js";
import { uploadToGitHubPages } from "./uploadToGitHubPages.js";
import { loadUserConfig } from "../../config/loadUserConfig.js";

/**
 * Deploy External Cortex to GitHub Pages.
 *
 * If `githubRepoName` is set in the user config, rebuilds and pushes to
 * the existing repository without prompting. Otherwise, runs the full
 * interactive flow: prompt for a name, create the repo, build, and upload.
 */
async function deploy(): Promise<void> {
  console.log("\n=== External Cortex – GitHub Pages Deployment ===\n");

  const config = loadUserConfig();

  if (config.githubRepoName) {
    const repoName = config.githubRepoName;
    console.log(`Using configured repository: "${repoName}"`);

    console.log(`\nBuilding for GitHub Pages (base: /${repoName}/)...`);
    buildForGitHubPages(repoName);
    console.log("Build complete.");

    console.log("\nUploading to GitHub Pages...");
    const { pagesUrl } = uploadToGitHubPages(repoName);
    console.log(`\nDeployment complete!`);
    console.log(`Site URL: ${pagesUrl}`);
  } else {
    const suggestedName = "external-cortex-site";
    const repoName = await promptRepoName(suggestedName);

    console.log(`\nCreating GitHub repository "${repoName}"...`);
    const { fullName, htmlUrl } = createGitHubRepo(repoName);
    console.log(`Repository created: ${htmlUrl}`);

    console.log(`\nBuilding for GitHub Pages (base: /${repoName}/)...`);
    buildForGitHubPages(repoName);
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
