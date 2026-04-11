/**
 * GitHub-related runtime configuration.
 *
 * Values are loaded from `~/.external-cortex/config.json` at build time.
 * If no user config is found, the defaults are empty strings (disabled).
 */

/**
 * The full GitHub repository name in `owner/repo` format used for hosting.
 *
 * When set, the app can persist graph changes back to this repository
 * via the GitHub Contents API.
 */
export const GITHUB_REPO_NAME: string = __EC_GITHUB_REPO_NAME__;
