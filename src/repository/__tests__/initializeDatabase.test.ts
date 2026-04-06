import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeDatabase } from "../initializeDatabase.js";
import { parseExternalGraph } from "../../external-storage/parseExternalGraph.js";
import type { ExternalGraph } from "../../external-storage/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = resolve(__dirname, "../../external-storage/__fixtures__");

function loadFixture(name: string): ExternalGraph {
  const json = readFileSync(resolve(fixturesDir, name), "utf-8");
  return parseExternalGraph(json);
}

describe("initializeDatabase", () => {
  it("returns a loadData callback", async () => {
    const loadData = await initializeDatabase();
    expect(typeof loadData).toBe("function");
  });

  it("loadData returns a QueryDatabase with a db handle", async () => {
    const loadData = await initializeDatabase();
    const graph = loadFixture("valid-simple.json");
    const queryDb = loadData(graph);

    expect(queryDb).toHaveProperty("db");
  });

  describe("data insertion with valid-simple.json", () => {
    it("inserts all 4 datums", async () => {
      const loadData = await initializeDatabase();
      const queryDb = loadData(loadFixture("valid-simple.json"));

      const result = queryDb.db.exec("SELECT COUNT(*) FROM Datum");
      expect(result[0].values[0][0]).toBe(4);
    });

    it("inserts datum fields correctly", async () => {
      const loadData = await initializeDatabase();
      const queryDb = loadData(loadFixture("valid-simple.json"));

      const result = queryDb.db.exec(
        "SELECT id, name, type, content FROM Datum WHERE id = 'a1b2c3d4-0001-4000-8000-000000000001'"
      );

      expect(result[0].values[0]).toEqual([
        "a1b2c3d4-0001-4000-8000-000000000001",
        "First Note",
        "MARKDOWN",
        "# First Note\nThis is the first datum with **markdown** content.",
      ]);
    });

    it("inserts all 6 edges", async () => {
      const loadData = await initializeDatabase();
      const queryDb = loadData(loadFixture("valid-simple.json"));

      const result = queryDb.db.exec("SELECT COUNT(*) FROM Edge");
      expect(result[0].values[0][0]).toBe(6);
    });

    it("inserts edge fields correctly", async () => {
      const loadData = await initializeDatabase();
      const queryDb = loadData(loadFixture("valid-simple.json"));

      const result = queryDb.db.exec(
        "SELECT fromDatumID, toDatumID FROM Edge ORDER BY fromDatumID, toDatumID LIMIT 1"
      );

      expect(result[0].values[0]).toEqual([
        "a1b2c3d4-0001-4000-8000-000000000001",
        "a1b2c3d4-0002-4000-8000-000000000002",
      ]);
    });

    it("inserts all 8 datum tags", async () => {
      const loadData = await initializeDatabase();
      const queryDb = loadData(loadFixture("valid-simple.json"));

      const result = queryDb.db.exec("SELECT COUNT(*) FROM DatumTag");
      expect(result[0].values[0][0]).toBe(8);
    });

    it("inserts datum tag fields correctly", async () => {
      const loadData = await initializeDatabase();
      const queryDb = loadData(loadFixture("valid-simple.json"));

      const result = queryDb.db.exec(
        "SELECT name, datumID FROM DatumTag WHERE datumID = 'a1b2c3d4-0001-4000-8000-000000000001' ORDER BY name"
      );

      expect(result[0].values).toEqual([
        ["testDatumTag1", "a1b2c3d4-0001-4000-8000-000000000001"],
        ["testDatumTag3", "a1b2c3d4-0001-4000-8000-000000000001"],
      ]);
    });

    it("inserts all 12 edge tags", async () => {
      const loadData = await initializeDatabase();
      const queryDb = loadData(loadFixture("valid-simple.json"));

      const result = queryDb.db.exec("SELECT COUNT(*) FROM EdgeTag");
      expect(result[0].values[0][0]).toBe(12);
    });

    it("inserts edge tag fields correctly", async () => {
      const loadData = await initializeDatabase();
      const queryDb = loadData(loadFixture("valid-simple.json"));

      const result = queryDb.db.exec(
        "SELECT name, edgeID FROM EdgeTag WHERE edgeID = 'a1b2c3d4-0001-4000-8000-000000000001->a1b2c3d4-0002-4000-8000-000000000002' ORDER BY name"
      );

      expect(result[0].values).toEqual([
        ["testEdgeTag1", "a1b2c3d4-0001-4000-8000-000000000001->a1b2c3d4-0002-4000-8000-000000000002"],
        ["testEdgeTag2", "a1b2c3d4-0001-4000-8000-000000000001->a1b2c3d4-0002-4000-8000-000000000002"],
      ]);
    });

    it("inserts 0 datum dimensions (none in fixture)", async () => {
      const loadData = await initializeDatabase();
      const queryDb = loadData(loadFixture("valid-simple.json"));

      const result = queryDb.db.exec("SELECT COUNT(*) FROM DatumDimension");
      expect(result[0].values[0][0]).toBe(0);
    });

    it("inserts 0 datum tag associations (none in fixture)", async () => {
      const loadData = await initializeDatabase();
      const queryDb = loadData(loadFixture("valid-simple.json"));

      const result = queryDb.db.exec("SELECT COUNT(*) FROM DatumTagAssociations");
      expect(result[0].values[0][0]).toBe(0);
    });
  });

  describe("data insertion with empty graph", () => {
    const emptyGraph: ExternalGraph = {
      datums: [],
      edges: [],
      datumTags: [],
      datumDimensions: [],
      datumTagAssociations: [],
      edgeTags: [],
    };

    it("handles empty graph without errors", async () => {
      const loadData = await initializeDatabase();
      const queryDb = loadData(emptyGraph);

      const result = queryDb.db.exec("SELECT COUNT(*) FROM Datum");
      expect(result[0].values[0][0]).toBe(0);
    });
  });

  describe("data insertion with all object types", () => {
    const fullGraph: ExternalGraph = {
      datums: [{ id: "d1", name: "test", type: "MARKDOWN", content: "hello" }],
      edges: [{ fromDatumID: "d1", toDatumID: "d2" }],
      datumTags: [{ name: "tag1", datumID: "d1" }],
      datumDimensions: [{ name: "price", datumID: "d1", value: 9.99 }],
      datumTagAssociations: [{ childTagName: "child", parentTagName: "parent", type: "inherits" }],
      edgeTags: [{ name: "etag1", edgeID: "d1->d2" }],
    };

    it("inserts datum dimensions", async () => {
      const loadData = await initializeDatabase();
      const queryDb = loadData(fullGraph);

      const result = queryDb.db.exec("SELECT name, datumID, value FROM DatumDimension");
      expect(result[0].values[0]).toEqual(["price", "d1", 9.99]);
    });

    it("inserts datum tag associations", async () => {
      const loadData = await initializeDatabase();
      const queryDb = loadData(fullGraph);

      const result = queryDb.db.exec(
        "SELECT childTagName, parentTagName, type FROM DatumTagAssociations"
      );
      expect(result[0].values[0]).toEqual(["child", "parent", "inherits"]);
    });
  });
});
