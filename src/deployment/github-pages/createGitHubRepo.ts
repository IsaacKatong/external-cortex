import { runCommand } from "./runCommand.js";

/**
 * The result of creating a GitHub repository.
 */
export interface CreateRepoResult {
  /** The full repository name in `owner/repo` format. */
  fullName: string;
  /** The HTTPS URL of the created repository. */
  htmlUrl: string;
}

/**
 * Create a new public GitHub repository using the `gh` CLI.
 *
 * @param repoName - The name for the new repository (without owner prefix).
 * @returns The full name and URL of the created repository.
 * @throws If `gh` is not installed, not authenticated, or the repo already exists.
 */
export function createGitHubRepo(repoName: string): CreateRepoResult {
  const output = runCommand(
    "gh",
    [
      "repo",
      "create",
      repoName,
      "--public",
      "--description",
      "External Cortex – hosted with GitHub Pages",
      "--json",
      "fullName,url",
    ],
    { stdio: "pipe" }
  );

  const parsed: { fullName: string; url: string } = JSON.parse(output);
  return { fullName: parsed.fullName, htmlUrl: parsed.url };
}
