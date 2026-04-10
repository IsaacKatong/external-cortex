import { promptRepoName } from "./promptRepoName.js";
import { createGitHubRepo } from "./createGitHubRepo.js";
import { buildForGitHubPages } from "./buildForGitHubPages.js";
import { uploadToGitHubPages } from "./uploadToGitHubPages.js";

/**
 * Deploy External Cortex to GitHub Pages.
 *
 * Interactive flow:
 * 1. Suggest a repository name and let the user approve or change it.
 * 2. Create a new public GitHub repository.
 * 3. Build the project with the correct base path.
 * 4. Push built assets to the repository and enable GitHub Pages.
 */
async function deploy(): Promise<void> {
  console.log("\n=== External Cortex – GitHub Pages Deployment ===\n");

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

deploy().catch((err: unknown) => {
  console.error("\nDeployment failed:", err);
  process.exit(1);
});
