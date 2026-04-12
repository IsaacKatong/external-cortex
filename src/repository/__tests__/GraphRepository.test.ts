import { describe, it, expect } from "vitest";
import { initializeDatabase } from "../initializeDatabase.js";
import { createGraphRepository } from "../GraphRepository.js";
import type { ExternalGraph } from "../../external-storage/types.js";

const emptyGraph: ExternalGraph = {
  version: 0,
  datums: [],
  edges: [],
  datumTags: [],
  datumDimensions: [],
  datumTagAssociations: [],
  edgeTags: [],
};

async function setupDb() {
  const loadData = await initializeDatabase();
  const { db } = loadData(emptyGraph);
  const repo = createGraphRepository(db);
  return { db, repo };
}

describe("GraphRepository", () => {
  describe("addDatum", () => {
    it("inserts a datum into the database", async () => {
      const { db, repo } = await setupDb();
      repo.addDatum({ id: "d1", name: "Test", type: "MARKDOWN", content: "hello" });

      const result = db.exec("SELECT id, name, type, content FROM Datum");
      expect(result[0].values[0]).toEqual(["d1", "Test", "MARKDOWN", "hello"]);
    });

    it("inserts multiple datums", async () => {
      const { db, repo } = await setupDb();
      repo.addDatum({ id: "d1", name: "First", type: "MARKDOWN", content: "a" });
      repo.addDatum({ id: "d2", name: "Second", type: "PLAIN", content: "b" });

      const result = db.exec("SELECT COUNT(*) FROM Datum");
      expect(result[0].values[0][0]).toBe(2);
    });
  });

  describe("addEdge", () => {
    it("inserts an edge into the database", async () => {
      const { db, repo } = await setupDb();
      repo.addEdge({ fromDatumID: "d1", toDatumID: "d2" });

      const result = db.exec("SELECT fromDatumID, toDatumID FROM Edge");
      expect(result[0].values[0]).toEqual(["d1", "d2"]);
    });
  });

  describe("addDatumTag", () => {
    it("inserts a datum tag into the database", async () => {
      const { db, repo } = await setupDb();
      repo.addDatumTag({ name: "science", datumID: "d1" });

      const result = db.exec("SELECT name, datumID FROM DatumTag");
      expect(result[0].values[0]).toEqual(["science", "d1"]);
    });
  });

  describe("addDatumDimension", () => {
    it("inserts a datum dimension into the database", async () => {
      const { db, repo } = await setupDb();
      repo.addDatumDimension({ name: "importance", datumID: "d1", value: 7.5 });

      const result = db.exec("SELECT name, datumID, value FROM DatumDimension");
      expect(result[0].values[0]).toEqual(["importance", "d1", 7.5]);
    });
  });

  describe("addDatumTagAssociation", () => {
    it("inserts a datum tag association into the database", async () => {
      const { db, repo } = await setupDb();
      repo.addDatumTagAssociation({
        childTagName: "physics",
        parentTagName: "science",
        type: "inherits",
      });

      const result = db.exec(
        "SELECT childTagName, parentTagName, type FROM DatumTagAssociations"
      );
      expect(result[0].values[0]).toEqual(["physics", "science", "inherits"]);
    });
  });

  describe("addEdgeTag", () => {
    it("inserts an edge tag into the database", async () => {
      const { db, repo } = await setupDb();
      repo.addEdgeTag({ name: "causal", edgeID: "d1->d2" });

      const result = db.exec("SELECT name, edgeID FROM EdgeTag");
      expect(result[0].values[0]).toEqual(["causal", "d1->d2"]);
    });
  });
});
