import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { USER_CONFIG_PATH } from "./loadUserConfig.js";
import type { ExternalCortexConfigMap } from "./userConfig.js";

/**
 * Persist the full config map to `~/.external-cortex/config.json`.
 *
 * Creates the parent directory if it does not exist.
 *
 * @param configs - The complete config map to save.
 * @param configPath - Absolute path to the config file (for testing).
 */
export function saveAllConfigs(
  configs: ExternalCortexConfigMap,
  configPath: string = USER_CONFIG_PATH
): void {
  mkdirSync(dirname(configPath), { recursive: true });
  writeFileSync(configPath, JSON.stringify(configs, null, 2) + "\n", "utf-8");
}
