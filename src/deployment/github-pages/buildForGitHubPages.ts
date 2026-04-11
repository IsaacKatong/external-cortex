import { runCommand } from "./runCommand.js";

/**
 * Build the External Cortex project for GitHub Pages hosting.
 *
 * Runs `vite build` with the base path set to `/<repoName>/` so that
 * all asset URLs are correctly prefixed for GitHub Pages project sites.
 * The `configName` is forwarded via the `EC_CONFIG_NAME` environment
 * variable so `vite.config.ts` uses the correct named configuration.
 *
 * @param repoName - The GitHub repository name (used to derive the base path).
 * @param configName - The named config to build with.
 * @param projectRoot - Absolute path to the project root. Defaults to `process.cwd()`.
 */
export function buildForGitHubPages(
  repoName: string,
  configName: string,
  projectRoot: string = process.cwd()
): void {
  runCommand("npx", ["vite", "build", "--base", `/${repoName}/`], {
    cwd: projectRoot,
    env: { ...process.env, EC_CONFIG_NAME: configName },
  });
}
