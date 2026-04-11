import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";
import { CONFIG_DEFAULTS } from "./userConfig.js";
import type { ExternalCortexConfig, ExternalCortexColors } from "./userConfig.js";

/**
 * Path to the user's configuration file.
 */
export const USER_CONFIG_PATH: string = resolve(
  homedir(),
  ".external-cortex",
  "config.json"
);

/**
 * Load the user's External Cortex configuration from `~/.external-cortex/config.json`.
 *
 * Reads the JSON file, merges it with {@link CONFIG_DEFAULTS}, and returns a
 * complete `ExternalCortexConfig`. Missing fields use their default values.
 * If the file does not exist or cannot be parsed, the full defaults are returned.
 *
 * @param configPath - Absolute path to the config file. Defaults to `~/.external-cortex/config.json`.
 * @returns The merged configuration.
 */
export function loadUserConfig(
  configPath: string = USER_CONFIG_PATH
): ExternalCortexConfig {
  let raw: Record<string, unknown>;
  try {
    const json = readFileSync(configPath, "utf-8");
    raw = JSON.parse(json) as Record<string, unknown>;
  } catch {
    return { ...CONFIG_DEFAULTS, colors: { ...CONFIG_DEFAULTS.colors } };
  }

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
    colors,
  };
}

/**
 * Return `value` if it is a string, otherwise return `fallback`.
 */
function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}
