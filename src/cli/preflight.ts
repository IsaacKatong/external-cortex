import { execFileSync } from "node:child_process";

interface ToolRequirement {
  command: string;
  args: readonly string[];
  installHint: string;
}

const REQUIREMENTS: readonly ToolRequirement[] = [
  {
    command: "git",
    args: ["--version"],
    installHint: "Install git from https://git-scm.com/downloads",
  },
  {
    command: "gh",
    args: ["--version"],
    installHint: "Install the GitHub CLI from https://cli.github.com/",
  },
];

function isInstalled(req: ToolRequirement): boolean {
  try {
    execFileSync(req.command, req.args, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function isGhAuthenticated(): boolean {
  try {
    execFileSync("gh", ["auth", "status"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Verify that `git` and `gh` are installed and that `gh` is authenticated.
 * Exits the process with a friendly message if any requirement is missing.
 */
export function requireGitHubTooling(): void {
  const missing = REQUIREMENTS.filter((req) => !isInstalled(req));
  if (missing.length > 0) {
    console.error("\nMissing required tools:");
    for (const req of missing) {
      console.error(`  - ${req.command}: ${req.installHint}`);
    }
    process.exit(1);
  }

  if (!isGhAuthenticated()) {
    console.error(
      '\nGitHub CLI is not authenticated. Run "gh auth login" and try again.'
    );
    process.exit(1);
  }
}
