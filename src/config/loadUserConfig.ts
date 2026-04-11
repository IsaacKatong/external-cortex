import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";
import { CONFIG_DEFAULTS, DEFAULT_CONFIG_NAME } from "./userConfig.js";
import type {
  ExternalCortexConfig,
  ExternalCortexColors,
  ExternalCortexConfigMap,
} from "./userConfig.js";

/**
 * Path to the user's configuration file.
 */
export const USER_CONFIG_PATH: string = resolve(
  homedir(),
  ".external-cortex",
  "config.json"
);

/**
 * Load all named configurations from `~/.external-cortex/config.json`.
 *
 * The file is expected to be a JSON map where each key is a config name
 * and each value is a config object. A legacy single-object file (no
 * config names) is treated as the `"default"` config.
 *
 * Missing fields in each config fall back to {@link CONFIG_DEFAULTS}.
 * If the file does not exist or cannot be parsed, a map containing only
 * the `"default"` config (with full defaults) is returned.
 *
 * @param configPath - Absolute path to the config file.
 * @returns A map of config name to merged configuration.
 */
export function loadAllConfigs(
  configPath: string = USER_CONFIG_PATH
): ExternalCortexConfigMap {
  let raw: Record<string, unknown>;
  try {
    const json = readFileSync(configPath, "utf-8");
    raw = JSON.parse(json) as Record<string, unknown>;
  } catch {
    return { [DEFAULT_CONFIG_NAME]: { ...CONFIG_DEFAULTS, colors: { ...CONFIG_DEFAULTS.colors } } };
  }

  if (isLegacySingleConfig(raw)) {
    return { [DEFAULT_CONFIG_NAME]: parseConfig(raw) };
  }

  const result: ExternalCortexConfigMap = {};
  for (const [name, value] of Object.entries(raw)) {
    if (typeof value === "object" && value !== null) {
      result[name] = parseConfig(value as Record<string, unknown>);
    }
  }

  if (Object.keys(result).length === 0) {
    return { [DEFAULT_CONFIG_NAME]: { ...CONFIG_DEFAULTS, colors: { ...CONFIG_DEFAULTS.colors } } };
  }

  return result;
}

/**
 * Return the config names from the config map, excluding "default".
 */
export function getConfigNames(configs: ExternalCortexConfigMap): string[] {
  return Object.keys(configs).filter((name) => name !== DEFAULT_CONFIG_NAME);
}

/**
 * Load a single named configuration from the config file.
 *
 * @param name - The config name to load. Defaults to `"default"`.
 * @param configPath - Absolute path to the config file.
 * @returns The merged configuration for the given name.
 */
export function loadUserConfig(
  name: string = DEFAULT_CONFIG_NAME,
  configPath: string = USER_CONFIG_PATH
): ExternalCortexConfig {
  const configs = loadAllConfigs(configPath);
  return configs[name] ?? { ...CONFIG_DEFAULTS, colors: { ...CONFIG_DEFAULTS.colors } };
}

/**
 * Detect whether a parsed JSON object is a legacy single-config format
 * (has known config keys at the top level) rather than the new map format.
 */
function isLegacySingleConfig(raw: Record<string, unknown>): boolean {
  const knownKeys = [
    "storageType",
    "localStorageDirectory",
    "hostingType",
    "uiStyle",
    "githubRepoName",
    "password",
    "colors",
  ];
  return knownKeys.some((key) => key in raw);
}

/**
 * Parse a raw config object into a full ExternalCortexConfig,
 * filling missing fields from CONFIG_DEFAULTS.
 */
function parseConfig(raw: Record<string, unknown>): ExternalCortexConfig {
  const rawColors =
    typeof raw["colors"] === "object" && raw["colors"] !== null
      ? (raw["colors"] as Record<string, unknown>)
      : {};

  const colors: ExternalCortexColors = {
    textPrimary: asString(rawColors["textPrimary"], CONFIG_DEFAULTS.colors.textPrimary),
    textSecondary: asString(rawColors["textSecondary"], CONFIG_DEFAULTS.colors.textSecondary),
    background: asString(rawColors["background"], CONFIG_DEFAULTS.colors.background),
    border: asString(rawColors["border"], CONFIG_DEFAULTS.colors.border),
    accent: asString(rawColors["accent"], CONFIG_DEFAULTS.colors.accent),
  };

  return {
    storageType: asString(raw["storageType"], CONFIG_DEFAULTS.storageType),
    localStorageDirectory: asString(
      raw["localStorageDirectory"],
      CONFIG_DEFAULTS.localStorageDirectory
    ),
    hostingType: asString(raw["hostingType"], CONFIG_DEFAULTS.hostingType),
    uiStyle: asString(raw["uiStyle"], CONFIG_DEFAULTS.uiStyle),
    githubRepoName: asString(raw["githubRepoName"], CONFIG_DEFAULTS.githubRepoName),
    password: asString(raw["password"], CONFIG_DEFAULTS.password),
    colors,
  };
}

/**
 * Return `value` if it is a string, otherwise return `fallback`.
 */
function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}
