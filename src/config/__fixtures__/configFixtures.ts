import type { ExternalCortexConfig, ExternalCortexConfigMap } from "../userConfig.js";
import { CONFIG_DEFAULTS } from "../userConfig.js";

/**
 * Creates a mock ExternalCortexConfig with optional overrides.
 */
export function createMockConfig(
  overrides: Partial<ExternalCortexConfig> = {}
): ExternalCortexConfig {
  return {
    ...CONFIG_DEFAULTS,
    colors: { ...CONFIG_DEFAULTS.colors, ...overrides.colors },
    ...overrides,
  };
}

/**
 * Creates a mock multi-config map with optional named configs.
 */
export function createMockConfigMap(
  entries: Record<string, Partial<ExternalCortexConfig>> = {}
): ExternalCortexConfigMap {
  const result: ExternalCortexConfigMap = {};
  for (const [name, overrides] of Object.entries(entries)) {
    result[name] = createMockConfig(overrides);
  }
  return result;
}
