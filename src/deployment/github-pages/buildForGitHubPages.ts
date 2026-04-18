import { resolve } from "node:path";
import { runCommand } from "./runCommand.js";

/**
 * Build the External Cortex project for GitHub Pages hosting.
 *
 * Runs `vite build` with the base path set to `/<repoName>/` so that
 * all asset URLs are correctly prefixed for GitHub Pages project sites.
 * The `configName` is forwarded via the `EC_CONFIG_NAME` environment
 * variable so `vite.config.ts` uses the correct named configuration.
 *
 * When invoked via the published CLI, `EC_PACKAGE_ROOT` is set to the
 * installed package directory. In that case vite runs from the package
 * root (so it finds `vite.config.ts` and `src/`) and emits its `dist/`
 * output into `projectRoot/dist/` — which lives under the user's
 * per-user state dir, not inside the globally-installed package.
 *
 * @param repoName - The GitHub repository name (used to derive the base path).
 * @param configName - The named config to build with.
 * @param projectRoot - Absolute path where `pages/<repo>` and `dist/` live.
 *   Defaults to `process.cwd()`.
 */
export function buildForGitHubPages(
  repoName: string,
  configName: string,
  projectRoot: string = process.cwd()
): void {
  const sourceRoot = process.env.EC_PACKAGE_ROOT ?? projectRoot;
  const runningFromPackage = sourceRoot !== projectRoot;

  const args = ["vite", "build", "--base", `/${repoName}/`];
  if (runningFromPackage) {
    // --outDir is outside vite's project root; opt in to emptying it so
    // stale assets from previous builds don't leak into the next deploy.
    args.push("--outDir", resolve(projectRoot, "dist"), "--emptyOutDir");
  }

  runCommand("npx", args, {
    cwd: sourceRoot,
    env: {
      ...process.env,
      EC_CONFIG_NAME: configName,
      EC_REPO_DIR: resolve(projectRoot, "pages", repoName),
      EC_SKIP_SYNC: "1",
    },
  });
}
