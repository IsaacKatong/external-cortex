/**
 * Shape of the user configuration file at `~/.external-cortex/config.json`.
 *
 * Every field is optional — missing fields fall back to their default value.
 */
export interface ExternalCortexConfig {
  /** Active storage backend. Valid values: `"LOCAL"`, `"GITHUB"`. */
  storageType: string;
  /** Directory path (relative to project root) for local storage data files. */
  localStorageDirectory: string;
  /** Active hosting backend. Valid values: `"S3"`, `"GITHUB_PAGES"`. */
  hostingType: string;
  /** Active UI rendering style. Valid values: `"BASIC_JSON"`. */
  uiStyle: string;
  /** GitHub repository name used for hosting (e.g. `"my-cortex-site"`). */
  githubRepoName: string;
  /** Password used to encrypt `graph.json`. Empty string means no encryption. */
  password: string;
  /** Application color palette. */
  colors: ExternalCortexColors;
}

/**
 * Color palette section of the user configuration.
 */
export interface ExternalCortexColors {
  /** Primary text color (hex). */
  textPrimary: string;
  /** Secondary text color (hex). */
  textSecondary: string;
  /** Page background color (hex). */
  background: string;
  /** Border color (hex). */
  border: string;
  /** Accent color for interactive elements (hex). */
  accent: string;
}

/**
 * A map of named configurations. Each key is a user-defined name for the
 * config, and each value is the configuration object for that instance.
 */
export type ExternalCortexConfigMap = Record<string, ExternalCortexConfig>;

/**
 * The reserved name for the default configuration.
 */
export const DEFAULT_CONFIG_NAME = "default";

/**
 * Default configuration values.
 *
 * These match the hardcoded values that were previously in each config file.
 * When no user config file exists, or a field is missing, these are used.
 */
export const CONFIG_DEFAULTS: ExternalCortexConfig = {
  storageType: "LOCAL",
  localStorageDirectory: "local-storage",
  hostingType: "GITHUB_PAGES",
  uiStyle: "BASIC_JSON",
  githubRepoName: "",
  password: "",
  colors: {
    textPrimary: "#e0e0e0",
    textSecondary: "#a0a0a0",
    background: "#1a1a1a",
    border: "#444444",
    accent: "#6cb4ee",
  },
};
