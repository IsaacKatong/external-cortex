import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runConfigEditor, FIELDS } from "../configEditor.js";
import { saveAllConfigs } from "../saveUserConfig.js";
import { loadAllConfigs } from "../loadUserConfig.js";
import { CONFIG_DEFAULTS } from "../userConfig.js";

const originalIsTTY = process.stdin.isTTY;

/**
 * Build a mock rlFactory that returns answers in sequence.
 * Each call to `rlFactory()` pops the next answer from the list.
 */
function sequentialRlFactory(answers: string[]) {
  let index = 0;
  return () => ({
    question: (_prompt: string, cb: (answer: string) => void) => {
      const answer = index < answers.length ? answers[index]! : "q";
      index++;
      cb(answer);
    },
    close: vi.fn(),
  });
}

function setupTempConfig() {
  const dir = mkdtempSync(join(tmpdir(), "ec-editor-"));
  const path = join(dir, "config.json");
  return { dir, path };
}

/** Look up the 1-based field number by label so tests don't break when fields are added. */
function fieldNum(label: string): string {
  const index = FIELDS.findIndex((f) => f.label === label);
  if (index === -1) throw new Error(`Unknown field label: ${label}`);
  return String(index + 1);
}

describe("runConfigEditor", () => {
  beforeEach(() => {
    Object.defineProperty(process.stdin, "isTTY", { value: true, writable: true });
  });

  afterEach(() => {
    Object.defineProperty(process.stdin, "isTTY", { value: originalIsTTY, writable: true });
  });

  it("quits immediately when user enters 'q'", async () => {
    const { path } = setupTempConfig();
    saveAllConfigs({ test: { ...CONFIG_DEFAULTS, colors: { ...CONFIG_DEFAULTS.colors } } }, path);

    await runConfigEditor(path, sequentialRlFactory(["q"]));

    // Should not throw, configs unchanged
    const configs = loadAllConfigs(path);
    expect(configs["test"]).toBeDefined();
  });

  it("edits a field and saves", async () => {
    const { path } = setupTempConfig();
    saveAllConfigs({ myconfig: { ...CONFIG_DEFAULTS, colors: { ...CONFIG_DEFAULTS.colors } } }, path);

    // Select config 1, select storageType field, enter "GITHUB", back, quit
    await runConfigEditor(path, sequentialRlFactory([
      "1",                          // select "myconfig"
      fieldNum("storageType"),      // select "storageType"
      "GITHUB",                     // new value
      "b",                          // back to config selection
      "q",                          // quit
    ]));

    const configs = loadAllConfigs(path);
    expect(configs["myconfig"]!.storageType).toBe("GITHUB");
  });

  it("edits a color field", async () => {
    const { path } = setupTempConfig();
    saveAllConfigs({ theme: { ...CONFIG_DEFAULTS, colors: { ...CONFIG_DEFAULTS.colors } } }, path);

    // Select config 1, select colors.accent field, enter new color, back, quit
    await runConfigEditor(path, sequentialRlFactory([
      "1",                           // select "theme"
      fieldNum("colors.accent"),     // select "colors.accent"
      "#00ff00",                     // new value
      "b",                           // back to config selection
      "q",                           // quit
    ]));

    const configs = loadAllConfigs(path);
    expect(configs["theme"]!.colors.accent).toBe("#00ff00");
  });

  it("creates a new config with defaults", async () => {
    const { path } = setupTempConfig();
    saveAllConfigs({ existing: { ...CONFIG_DEFAULTS, colors: { ...CONFIG_DEFAULTS.colors } } }, path);

    // Select "Create new", name it "brand-new", back from fields, quit
    await runConfigEditor(path, sequentialRlFactory([
      "2",          // "Create new config" (existing has 1 config, so option 2)
      "brand-new",  // new config name
      "b",          // back from field selection to config selection
      "q",          // quit
    ]));

    const configs = loadAllConfigs(path);
    expect(configs["brand-new"]).toBeDefined();
    expect(configs["brand-new"]!.storageType).toBe(CONFIG_DEFAULTS.storageType);
  });

  it("goes back from create config screen", async () => {
    const { path } = setupTempConfig();
    saveAllConfigs({ existing: { ...CONFIG_DEFAULTS, colors: { ...CONFIG_DEFAULTS.colors } } }, path);

    // Select "Create new", then back, then quit
    await runConfigEditor(path, sequentialRlFactory([
      "2",  // "Create new config"
      "b",  // back from name prompt
      "q",  // quit
    ]));

    const configs = loadAllConfigs(path);
    expect(Object.keys(configs)).toEqual(["existing"]);
  });

  it("goes back from field edit screen", async () => {
    const { path } = setupTempConfig();
    saveAllConfigs({ cfg: { ...CONFIG_DEFAULTS, colors: { ...CONFIG_DEFAULTS.colors } } }, path);

    // Select config, select field, back without editing, back, quit
    await runConfigEditor(path, sequentialRlFactory([
      "1",                          // select "cfg"
      fieldNum("storageType"),      // select "storageType"
      "b",                          // back from edit screen
      "b",                          // back to config selection
      "q",                          // quit
    ]));

    const configs = loadAllConfigs(path);
    expect(configs["cfg"]!.storageType).toBe(CONFIG_DEFAULTS.storageType);
  });

  it("edits multiple fields in sequence", async () => {
    const { path } = setupTempConfig();
    saveAllConfigs({ multi: { ...CONFIG_DEFAULTS, colors: { ...CONFIG_DEFAULTS.colors } } }, path);

    await runConfigEditor(path, sequentialRlFactory([
      "1",                            // select "multi"
      fieldNum("storageType"),        // storageType
      "GITHUB",                       // new value
      fieldNum("githubRepoName"),     // githubRepoName
      "user/my-repo",                 // new value
      "b",                            // back
      "q",                            // quit
    ]));

    const configs = loadAllConfigs(path);
    expect(configs["multi"]!.storageType).toBe("GITHUB");
    expect(configs["multi"]!.githubRepoName).toBe("user/my-repo");
  });

  it("has a field for every leaf value in CONFIG_DEFAULTS", () => {
    // Count leaf (non-object) values in CONFIG_DEFAULTS
    function countLeaves(obj: Record<string, unknown>): number {
      let count = 0;
      for (const value of Object.values(obj)) {
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          count += countLeaves(value as Record<string, unknown>);
        } else {
          count++;
        }
      }
      return count;
    }

    const expectedCount = countLeaves(CONFIG_DEFAULTS as unknown as Record<string, unknown>);
    expect(FIELDS.length).toBe(expectedCount);
  });

  it("every field can read and write CONFIG_DEFAULTS round-trip", () => {
    const config = { ...CONFIG_DEFAULTS, colors: { ...CONFIG_DEFAULTS.colors } };
    for (const field of FIELDS) {
      const original = field.get(config);
      field.set(config, "test-value");
      expect(field.get(config)).toBe("test-value");
      field.set(config, original);
      expect(field.get(config)).toBe(original);
    }
  });

  it("does nothing in non-interactive environment", async () => {
    Object.defineProperty(process.stdin, "isTTY", { value: undefined, writable: true });
    const { path } = setupTempConfig();
    saveAllConfigs({ test: { ...CONFIG_DEFAULTS, colors: { ...CONFIG_DEFAULTS.colors } } }, path);

    await runConfigEditor(path, sequentialRlFactory([]));

    // Should return without prompting
    const configs = loadAllConfigs(path);
    expect(configs["test"]!.storageType).toBe(CONFIG_DEFAULTS.storageType);
  });
});
