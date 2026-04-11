import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runConfigEditor } from "../configEditor.js";
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

    // Select config 1, select field 1 (storageType), enter "GITHUB", back, quit
    await runConfigEditor(path, sequentialRlFactory([
      "1",       // select "myconfig"
      "1",       // select "storageType"
      "GITHUB",  // new value
      "b",       // back to config selection
      "q",       // quit
    ]));

    const configs = loadAllConfigs(path);
    expect(configs["myconfig"]!.storageType).toBe("GITHUB");
  });

  it("edits a color field", async () => {
    const { path } = setupTempConfig();
    saveAllConfigs({ theme: { ...CONFIG_DEFAULTS, colors: { ...CONFIG_DEFAULTS.colors } } }, path);

    // Select config 1, select field 10 (colors.accent), enter new color, back, quit
    await runConfigEditor(path, sequentialRlFactory([
      "1",        // select "theme"
      "10",       // select "colors.accent"
      "#00ff00",  // new value
      "b",        // back to config selection
      "q",        // quit
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
      "1",  // select "cfg"
      "1",  // select "storageType"
      "b",  // back from edit screen
      "b",  // back to config selection
      "q",  // quit
    ]));

    const configs = loadAllConfigs(path);
    expect(configs["cfg"]!.storageType).toBe(CONFIG_DEFAULTS.storageType);
  });

  it("edits multiple fields in sequence", async () => {
    const { path } = setupTempConfig();
    saveAllConfigs({ multi: { ...CONFIG_DEFAULTS, colors: { ...CONFIG_DEFAULTS.colors } } }, path);

    await runConfigEditor(path, sequentialRlFactory([
      "1",                   // select "multi"
      "1",                   // storageType
      "GITHUB",              // new value
      "5",                   // githubRepoName
      "user/my-repo",        // new value
      "b",                   // back
      "q",                   // quit
    ]));

    const configs = loadAllConfigs(path);
    expect(configs["multi"]!.storageType).toBe("GITHUB");
    expect(configs["multi"]!.githubRepoName).toBe("user/my-repo");
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
