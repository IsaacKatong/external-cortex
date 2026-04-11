import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { loadUserConfig } from "../loadUserConfig.js";
import { CONFIG_DEFAULTS } from "../userConfig.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const tmpDir = resolve(__dirname, "__tmp_config_test__");
const tmpConfigPath = resolve(tmpDir, "config.json");

describe("loadUserConfig", () => {
  beforeEach(() => {
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns full defaults when config file does not exist", () => {
    const config = loadUserConfig(resolve(tmpDir, "nonexistent.json"));

    expect(config).toEqual(CONFIG_DEFAULTS);
  });

  it("returns full defaults when config file contains invalid JSON", () => {
    writeFileSync(tmpConfigPath, "not valid json", "utf-8");

    const config = loadUserConfig(tmpConfigPath);

    expect(config).toEqual(CONFIG_DEFAULTS);
  });

  it("merges partial config with defaults", () => {
    writeFileSync(
      tmpConfigPath,
      JSON.stringify({ storageType: "GITHUB" }),
      "utf-8"
    );

    const config = loadUserConfig(tmpConfigPath);

    expect(config.storageType).toBe("GITHUB");
    expect(config.localStorageDirectory).toBe(CONFIG_DEFAULTS.localStorageDirectory);
    expect(config.hostingType).toBe(CONFIG_DEFAULTS.hostingType);
    expect(config.uiStyle).toBe(CONFIG_DEFAULTS.uiStyle);
    expect(config.colors).toEqual(CONFIG_DEFAULTS.colors);
  });

  it("merges partial color config with defaults", () => {
    writeFileSync(
      tmpConfigPath,
      JSON.stringify({ colors: { accent: "#ff0000" } }),
      "utf-8"
    );

    const config = loadUserConfig(tmpConfigPath);

    expect(config.colors.accent).toBe("#ff0000");
    expect(config.colors.textPrimary).toBe(CONFIG_DEFAULTS.colors.textPrimary);
    expect(config.colors.textSecondary).toBe(CONFIG_DEFAULTS.colors.textSecondary);
    expect(config.colors.background).toBe(CONFIG_DEFAULTS.colors.background);
    expect(config.colors.border).toBe(CONFIG_DEFAULTS.colors.border);
  });

  it("loads a complete config file", () => {
    const custom = {
      storageType: "GITHUB",
      localStorageDirectory: "custom-storage",
      hostingType: "S3",
      uiStyle: "BASIC_JSON",
      colors: {
        textPrimary: "#111111",
        textSecondary: "#222222",
        background: "#333333",
        border: "#444444",
        accent: "#555555",
      },
    };
    writeFileSync(tmpConfigPath, JSON.stringify(custom), "utf-8");

    const config = loadUserConfig(tmpConfigPath);

    expect(config).toEqual(custom);
  });

  it("ignores non-string values and uses defaults", () => {
    writeFileSync(
      tmpConfigPath,
      JSON.stringify({
        storageType: 42,
        hostingType: true,
        colors: { accent: null, border: 123 },
      }),
      "utf-8"
    );

    const config = loadUserConfig(tmpConfigPath);

    expect(config.storageType).toBe(CONFIG_DEFAULTS.storageType);
    expect(config.hostingType).toBe(CONFIG_DEFAULTS.hostingType);
    expect(config.colors.accent).toBe(CONFIG_DEFAULTS.colors.accent);
    expect(config.colors.border).toBe(CONFIG_DEFAULTS.colors.border);
  });

  it("returns a new object each time (no shared references)", () => {
    const a = loadUserConfig(resolve(tmpDir, "nonexistent.json"));
    const b = loadUserConfig(resolve(tmpDir, "nonexistent.json"));

    expect(a).toEqual(b);
    expect(a).not.toBe(b);
    expect(a.colors).not.toBe(b.colors);
  });
});
