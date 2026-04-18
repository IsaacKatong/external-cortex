import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { PACKAGE_ROOT } from "./packageRoot.js";
import { requireGitHubTooling } from "./preflight.js";
import { USER_STATE_DIR } from "./workspace.js";
import { USER_CONFIG_PATH } from "../config/loadUserConfig.js";

/**
 * Deploy and sync scripts read/write `pages/<repo>/` and `dist/` relative
 * to the current working directory. Switching into the per-user state
 * dir keeps that state out of the user's project checkout and makes the
 * CLI behave the same regardless of where it is invoked from.
 */
function chdirToUserState(): void {
  mkdirSync(USER_STATE_DIR, { recursive: true });
  process.chdir(USER_STATE_DIR);
}

const require = createRequire(import.meta.url);

function readPackageVersion(): string {
  try {
    const pkg = require(`${PACKAGE_ROOT}/package.json`) as { version?: string };
    return pkg.version ?? "unknown";
  } catch {
    return "unknown";
  }
}

const HELP = `
external-cortex <command>

Commands:
  deploy     Deploy External Cortex to a GitHub Pages repo
  sync       Pull the latest graph.json from a configured repo
  config     Edit or create named configurations
  version    Print the installed CLI version
  help       Show this help

Files:
  Config lives at ${USER_CONFIG_PATH}

Requires:
  git, gh (authenticated via "gh auth login")
`.trim();

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);

  switch (command) {
    case undefined:
    case "help":
    case "--help":
    case "-h":
      console.log(HELP);
      return;

    case "version":
    case "--version":
    case "-v":
      console.log(readPackageVersion());
      return;

    case "deploy":
      requireGitHubTooling();
      chdirToUserState();
      await import("../deployment/github-pages/deploy.js");
      return;

    case "sync":
      requireGitHubTooling();
      chdirToUserState();
      await import("../deployment/github-pages/sync.js");
      return;

    case "config":
      await import("../config/editConfig.js");
      return;

    default:
      console.error(`Unknown command: ${command}`);
      if (rest.length > 0) {
        console.error(`Extra args: ${rest.join(" ")}`);
      }
      console.error("");
      console.error(HELP);
      process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
