/**
 * Compile-time constants injected by Vite's `define` option in `vite.config.ts`.
 *
 * These are populated from the user's `~/.external-cortex/config.json` at
 * build time. If no config file exists, they contain the default values
 * from {@link CONFIG_DEFAULTS}.
 */

declare const __EC_STORAGE_TYPE__: string;
declare const __EC_LOCAL_STORAGE_DIRECTORY__: string;
declare const __EC_HOSTING_TYPE__: string;
declare const __EC_UI_STYLE__: string;
declare const __EC_TEXT_PRIMARY__: string;
declare const __EC_TEXT_SECONDARY__: string;
declare const __EC_BACKGROUND__: string;
declare const __EC_BORDER__: string;
declare const __EC_ACCENT__: string;
declare const __EC_GITHUB_REPO_NAME__: string;
