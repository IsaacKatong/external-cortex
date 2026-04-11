import { describe, it, expect } from "vitest";
import { CONFIG_DEFAULTS, DEFAULT_CONFIG_NAME } from "../userConfig.js";

describe("DEFAULT_CONFIG_NAME", () => {
  it("is the string 'default'", () => {
    expect(DEFAULT_CONFIG_NAME).toBe("default");
  });
});

describe("CONFIG_DEFAULTS", () => {
  it("has all required top-level fields", () => {
    expect(CONFIG_DEFAULTS).toHaveProperty("storageType");
    expect(CONFIG_DEFAULTS).toHaveProperty("localStorageDirectory");
    expect(CONFIG_DEFAULTS).toHaveProperty("hostingType");
    expect(CONFIG_DEFAULTS).toHaveProperty("uiStyle");
    expect(CONFIG_DEFAULTS).toHaveProperty("colors");
  });

  it("has all required color fields", () => {
    expect(CONFIG_DEFAULTS.colors).toHaveProperty("textPrimary");
    expect(CONFIG_DEFAULTS.colors).toHaveProperty("textSecondary");
    expect(CONFIG_DEFAULTS.colors).toHaveProperty("background");
    expect(CONFIG_DEFAULTS.colors).toHaveProperty("border");
    expect(CONFIG_DEFAULTS.colors).toHaveProperty("accent");
  });

  it("uses string values for all fields", () => {
    expect(typeof CONFIG_DEFAULTS.storageType).toBe("string");
    expect(typeof CONFIG_DEFAULTS.localStorageDirectory).toBe("string");
    expect(typeof CONFIG_DEFAULTS.hostingType).toBe("string");
    expect(typeof CONFIG_DEFAULTS.uiStyle).toBe("string");

    for (const value of Object.values(CONFIG_DEFAULTS.colors)) {
      expect(typeof value).toBe("string");
    }
  });
});
