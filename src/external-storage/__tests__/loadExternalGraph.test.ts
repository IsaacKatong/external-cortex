import { describe, it, expect } from "vitest";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { readFileSync } from "node:fs";
import { loadFromLocal } from "../loadExternalGraph.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = resolve(__dirname, "../__fixtures__");

function loadFixture(name: string): string {
  return readFileSync(resolve(fixturesDir, name), "utf-8");
}

describe("loadFromLocal", () => {
  const tmpRoot = resolve(__dirname, "../__tmp_test_root__");
  const tmpStorage = resolve(tmpRoot, "local-storage");

  function setup(files: Record<string, string>) {
    mkdirSync(tmpStorage, { recursive: true });
    for (const [name, content] of Object.entries(files)) {
      writeFileSync(resolve(tmpStorage, name), content, "utf-8");
    }
  }

  function teardown() {
    rmSync(tmpRoot, { recursive: true, force: true });
  }

  it("loads and parses the first JSON file from local storage", () => {
    const fixture = loadFixture("valid-simple.json");
    setup({ "graph.json": fixture });

    const graph = loadFromLocal(tmpRoot);

    expect(graph.datums).toHaveLength(4);
    expect(graph.edges).toHaveLength(6);
    expect(graph.datumTags).toHaveLength(8);
    expect(graph.edgeTags).toHaveLength(12);

    teardown();
  });

  it("parses datum fields correctly from local storage", () => {
    const fixture = loadFixture("valid-simple.json");
    setup({ "graph.json": fixture });

    const graph = loadFromLocal(tmpRoot);

    expect(graph.datums[0]).toEqual({
      id: "a1b2c3d4-0001-4000-8000-000000000001",
      name: "First Note",
      type: "MARKDOWN",
      content: "# First Note\nThis is the first datum with **markdown** content.",
    });

    teardown();
  });

  it("defaults missing arrays to empty", () => {
    const fixture = loadFixture("valid-simple.json");
    setup({ "graph.json": fixture });

    const graph = loadFromLocal(tmpRoot);

    expect(graph.datumDimensions).toEqual([]);
    expect(graph.datumTagAssociations).toEqual([]);

    teardown();
  });

  it("throws when no JSON files are found", () => {
    setup({ "readme.txt": "not json" });

    expect(() => loadFromLocal(tmpRoot)).toThrow(
      /No JSON files found in local storage directory/
    );

    teardown();
  });

  it("throws when the directory does not exist", () => {
    expect(() => loadFromLocal(resolve(__dirname, "nonexistent-root"))).toThrow();
  });

  it("throws when JSON file contains invalid JSON", () => {
    setup({ "bad.json": "not valid json" });

    expect(() => loadFromLocal(tmpRoot)).toThrow();

    teardown();
  });
});
