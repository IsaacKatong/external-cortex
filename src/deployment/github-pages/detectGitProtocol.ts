import { runCommand } from "./runCommand.js";

/**
 * Git remote URL protocol configured for GitHub.
 */
export type GitProtocol = "ssh" | "https";

/**
 * Detect the git protocol the user has configured for GitHub via the `gh` CLI.
 *
 * Reads the host-specific `git_protocol` setting from `gh config`.
 * Falls back to `"https"` if the setting cannot be read.
 *
 * @returns `"ssh"` or `"https"`.
 */
export function detectGitProtocol(): GitProtocol {
  try {
    const output = runCommand(
      "gh",
      ["config", "get", "git_protocol", "-h", "github.com"],
      { stdio: "pipe" }
    );
    const protocol = output.trim();
    if (protocol === "ssh") {
      return "ssh";
    }
    return "https";
  } catch {
    return "https";
  }
}

/**
 * Build the git remote URL for a GitHub repository using the given protocol.
 *
 * @param fullRepoName - The full repository name in `owner/repo` format.
 * @param protocol - The git protocol to use.
 * @returns The remote URL string.
 */
export function buildRemoteUrl(
  fullRepoName: string,
  protocol: GitProtocol
): string {
  if (protocol === "ssh") {
    return `git@github.com:${fullRepoName}.git`;
  }
  return `https://github.com/${fullRepoName}.git`;
}
