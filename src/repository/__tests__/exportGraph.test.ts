import { describe, it, expect, beforeEach } from "vitest";
import initSqlJs, { type Database } from "sql.js";
import { createSchema } from "../schema.js";
import { exportGraph } from "../exportGraph.js";
import type { ExternalGraph } from "../../external-storage/types.js";

let db: Database;

const SAMPLE_GRAPH: ExternalGraph = {
  version: 0,
  datums: [
    { id: "d1", name: "Alpha", type: "note", content: "Hello" },
    { id: "d2", name: "Beta", type: "link", content: "https://example.com" },
  ],
  edges: [{ fromDatumID: "d1", toDatumID: "d2" }],
  datumTags: [
    { name: "tag-a", datumID: "d1" },
    { name: "tag-b", datumID: "d2" },
  ],
  datumDimensions: [{ name: "importance", datumID: "d1", value: 0.8 }],
  datumTagAssociations: [
    { childTagName: "tag-a", parentTagName: "tag-b", type: "related" },
  ],
  edgeTags: [{ name: "ref", edgeID: "d1->d2" }],
};

describe("exportGraph", () => {
  beforeEach(async () => {
    const SQL = await initSqlJs();
    db = new SQL.Database();
    createSchema(db);
  });

  it("returns empty arrays when the database has no data", () => {
    const result = exportGraph(db);

    expect(result).toEqual({
      version: 0,
      datums: [],
      edges: [],
      datumTags: [],
      datumDimensions: [],
      datumTagAssociations: [],
      edgeTags: [],
    });
  });

  it("round-trips inserted data back to the original graph", () => {
    // Insert the sample data
    for (const d of SAMPLE_GRAPH.datums) {
      db.run("INSERT INTO Datum (id, name, type, content) VALUES (?, ?, ?, ?)", [
        d.id,
        d.name,
        d.type,
        d.content,
      ]);
    }
    for (const e of SAMPLE_GRAPH.edges) {
      db.run("INSERT INTO Edge (fromDatumID, toDatumID) VALUES (?, ?)", [
        e.fromDatumID,
        e.toDatumID,
      ]);
    }
    for (const dt of SAMPLE_GRAPH.datumTags) {
      db.run("INSERT INTO DatumTag (name, datumID) VALUES (?, ?)", [
        dt.name,
        dt.datumID,
      ]);
    }
    for (const dd of SAMPLE_GRAPH.datumDimensions) {
      db.run(
        "INSERT INTO DatumDimension (name, datumID, value) VALUES (?, ?, ?)",
        [dd.name, dd.datumID, dd.value]
      );
    }
    for (const dta of SAMPLE_GRAPH.datumTagAssociations) {
      db.run(
        "INSERT INTO DatumTagAssociations (childTagName, parentTagName, type) VALUES (?, ?, ?)",
        [dta.childTagName, dta.parentTagName, dta.type]
      );
    }
    for (const et of SAMPLE_GRAPH.edgeTags) {
      db.run("INSERT INTO EdgeTag (name, edgeID) VALUES (?, ?)", [
        et.name,
        et.edgeID,
      ]);
    }

    const result = exportGraph(db);

    expect(result).toEqual(SAMPLE_GRAPH);
  });

  it("produces valid JSON when stringified", () => {
    for (const d of SAMPLE_GRAPH.datums) {
      db.run("INSERT INTO Datum (id, name, type, content) VALUES (?, ?, ?, ?)", [
        d.id,
        d.name,
        d.type,
        d.content,
      ]);
    }

    const result = exportGraph(db);
    const json = JSON.stringify(result, null, 2);
    const parsed = JSON.parse(json) as ExternalGraph;

    expect(parsed.datums).toEqual(SAMPLE_GRAPH.datums);
  });
});
