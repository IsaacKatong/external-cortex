import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseExternalGraph } from "../parseExternalGraph.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = resolve(__dirname, "../__fixtures__");

function loadFixture(name: string): string {
  return readFileSync(resolve(fixturesDir, name), "utf-8");
}

describe("parseExternalGraph", () => {
  describe("valid-simple.json", () => {
    const json = loadFixture("valid-simple.json");
    const graph = parseExternalGraph(json);

    it("parses all 4 datums", () => {
      expect(graph.datums).toHaveLength(4);
    });

    it("parses datum fields correctly", () => {
      const first = graph.datums[0];
      expect(first).toEqual({
        id: "a1b2c3d4-0001-4000-8000-000000000001",
        name: "First Note",
        type: "MARKDOWN",
        content: "# First Note\nThis is the first datum with **markdown** content.",
      });
    });

    it("all datums have type MARKDOWN", () => {
      for (const datum of graph.datums) {
        expect(datum.type).toBe("MARKDOWN");
      }
    });

    it("parses all 6 edges (fully connected)", () => {
      expect(graph.edges).toHaveLength(6);
    });

    it("parses edge fields correctly", () => {
      expect(graph.edges[0]).toEqual({
        fromDatumID: "a1b2c3d4-0001-4000-8000-000000000001",
        toDatumID: "a1b2c3d4-0002-4000-8000-000000000002",
      });
    });

    it("parses all 8 datum tags (2 per datum)", () => {
      expect(graph.datumTags).toHaveLength(8);
    });

    it("parses datum tag fields correctly", () => {
      expect(graph.datumTags[0]).toEqual({
        name: "testDatumTag1",
        datumID: "a1b2c3d4-0001-4000-8000-000000000001",
      });
    });

    it("parses all 12 edge tags (2 per edge)", () => {
      expect(graph.edgeTags).toHaveLength(12);
    });

    it("parses edge tag fields correctly", () => {
      expect(graph.edgeTags[0]).toEqual({
        name: "testEdgeTag1",
        edgeID: "a1b2c3d4-0001-4000-8000-000000000001->a1b2c3d4-0002-4000-8000-000000000002",
      });
    });

    it("defaults missing arrays to empty", () => {
      expect(graph.datumDimensions).toEqual([]);
      expect(graph.datumTagAssociations).toEqual([]);
    });

    it("defaults version to 0 when not present", () => {
      expect(graph.version).toBe(0);
    });
  });

  it("throws on invalid JSON", () => {
    expect(() => parseExternalGraph("not json")).toThrow();
  });

  it("returns all empty arrays for empty object", () => {
    const graph = parseExternalGraph("{}");
    expect(graph.datums).toEqual([]);
    expect(graph.edges).toEqual([]);
    expect(graph.datumTags).toEqual([]);
    expect(graph.datumDimensions).toEqual([]);
    expect(graph.datumTagAssociations).toEqual([]);
    expect(graph.edgeTags).toEqual([]);
    expect(graph.version).toBe(0);
  });

  it("parses version when present", () => {
    const graph = parseExternalGraph('{"version": 42}');
    expect(graph.version).toBe(42);
  });

  it("defaults non-numeric version to 0", () => {
    const graph = parseExternalGraph('{"version": "not-a-number"}');
    expect(graph.version).toBe(0);
  });
});
