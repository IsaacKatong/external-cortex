/**
 * Supported hosting backends for deploying External Cortex as a website.
 *
 * - `S3`           - Deploy built assets to an AWS S3 bucket configured for static hosting.
 * - `GITHUB_PAGES` - Deploy built assets to a GitHub repository with GitHub Pages enabled.
 */
export enum HostingType {
  S3 = "S3",
  GITHUB_PAGES = "GITHUB_PAGES",
}

/**
 * The active hosting backend used to deploy External Cortex.
 *
 * Value is loaded from `~/.external-cortex/config.json` at build time.
 * Defaults to `GITHUB_PAGES` if no user config is found.
 */
export const HOSTING_TYPE: HostingType = __EC_HOSTING_TYPE__ as HostingType;
