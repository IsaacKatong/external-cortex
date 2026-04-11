import { describe, it, expect } from "vitest";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { saveAllConfigs } from "../saveUserConfig.js";
import { loadAllConfigs } from "../loadUserConfig.js";
import { CONFIG_DEFAULTS } from "../userConfig.js";

function tempConfigPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "ec-test-"));
  return join(dir, "config.json");
}

describe("saveAllConfigs", () => {
  it("creates the file and parent directory", () => {
    const dir = mkdtempSync(join(tmpdir(), "ec-test-"));
    const path = join(dir, "subdir", "config.json");

    saveAllConfigs({ test: { ...CONFIG_DEFAULTS, colors: { ...CONFIG_DEFAULTS.colors } } }, path);

    const raw = readFileSync(path, "utf-8");
    const parsed = JSON.parse(raw);
    expect(parsed["test"]).toBeDefined();
    expect(parsed["test"].storageType).toBe("LOCAL");

    rmSync(dir, { recursive: true, force: true });
  });

  it("round-trips through loadAllConfigs", () => {
    const path = tempConfigPath();
    const configs = {
      alpha: {
        ...CONFIG_DEFAULTS,
        storageType: "GITHUB",
        githubRepoName: "user/repo",
        colors: { ...CONFIG_DEFAULTS.colors, accent: "#ff0000" },
      },
      beta: {
        ...CONFIG_DEFAULTS,
        colors: { ...CONFIG_DEFAULTS.colors },
      },
    };

    saveAllConfigs(configs, path);
    const loaded = loadAllConfigs(path);

    expect(loaded["alpha"]!.storageType).toBe("GITHUB");
    expect(loaded["alpha"]!.githubRepoName).toBe("user/repo");
    expect(loaded["alpha"]!.colors.accent).toBe("#ff0000");
    expect(loaded["beta"]!.storageType).toBe("LOCAL");
  });

  it("overwrites an existing file", () => {
    const path = tempConfigPath();

    saveAllConfigs({ first: { ...CONFIG_DEFAULTS, colors: { ...CONFIG_DEFAULTS.colors } } }, path);
    saveAllConfigs({ second: { ...CONFIG_DEFAULTS, colors: { ...CONFIG_DEFAULTS.colors } } }, path);

    const loaded = loadAllConfigs(path);
    expect(loaded["first"]).toBeUndefined();
    expect(loaded["second"]).toBeDefined();
  });
});
