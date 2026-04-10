import { resolve } from "node:path";
import { runCommand } from "./runCommand.js";
import { detectGitProtocol, buildRemoteUrl } from "./detectGitProtocol.js";

/**
 * The result of uploading to GitHub Pages.
 */
export interface UploadResult {
  /** The live GitHub Pages URL where the site is accessible. */
  pagesUrl: string;
}

/**
 * Push the built `dist/` contents to the GitHub repository and enable GitHub Pages.
 *
 * This function:
 * 1. Initializes a git repo inside the `dist/` directory.
 * 2. Commits all built assets.
 * 3. Pushes to the `main` branch of the target repository.
 * 4. Enables GitHub Pages on the `main` branch via the GitHub API.
 *
 * @param fullRepoName - The full repository name in `owner/repo` format.
 * @param projectRoot - Absolute path to the project root. Defaults to `process.cwd()`.
 * @returns The live GitHub Pages URL.
 */
export function uploadToGitHubPages(
  fullRepoName: string,
  projectRoot: string = process.cwd()
): UploadResult {
  const distDir = resolve(projectRoot, "dist");

  runCommand("git", ["init"], { cwd: distDir });
  runCommand("git", ["checkout", "-b", "main"], { cwd: distDir });
  runCommand("git", ["add", "-A"], { cwd: distDir });
  runCommand("git", ["commit", "-m", "Deploy External Cortex to GitHub Pages"], {
    cwd: distDir,
  });

  const protocol = detectGitProtocol();
  const remoteUrl = buildRemoteUrl(fullRepoName, protocol);
  runCommand("git", ["remote", "add", "origin", remoteUrl], { cwd: distDir });
  runCommand("git", ["push", "-u", "origin", "main", "--force"], {
    cwd: distDir,
  });

  enableGitHubPages(fullRepoName);

  const [owner] = fullRepoName.split("/");
  const repoName = fullRepoName.split("/")[1]!;
  const pagesUrl = `https://${owner}.github.io/${repoName}/`;
  return { pagesUrl };
}

/**
 * Enable GitHub Pages on the `main` branch of the given repository.
 *
 * Uses the GitHub API via the `gh` CLI to configure Pages to serve
 * from the root of the `main` branch.
 *
 * @param fullRepoName - The full repository name in `owner/repo` format.
 */
function enableGitHubPages(fullRepoName: string): void {
  runCommand(
    "gh",
    [
      "api",
      "--method",
      "POST",
      `repos/${fullRepoName}/pages`,
      "-f",
      "source[branch]=main",
      "-f",
      "source[path]=/",
    ],
    { stdio: "pipe" }
  );
}
