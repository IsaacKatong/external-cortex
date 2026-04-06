import { describe, it, expect, beforeEach, afterEach } from "vitest";
import initSqlJs, { type Database } from "sql.js";
import { createSchema } from "../schema.js";

describe("createSchema", () => {
  let db: Database;

  beforeEach(async () => {
    const SQL = await initSqlJs();
    db = new SQL.Database();
    createSchema(db);
  });

  afterEach(() => {
    db.close();
  });

  it("creates all 6 tables", () => {
    const result = db.exec(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    const tableNames = result[0].values.map((row) => row[0]);

    expect(tableNames).toEqual([
      "Datum",
      "DatumDimension",
      "DatumTag",
      "DatumTagAssociations",
      "Edge",
      "EdgeTag",
    ]);
  });

  it("Datum has id as primary key", () => {
    db.run("INSERT INTO Datum (id, name, type, content) VALUES ('1', 'a', 'b', 'c')");
    expect(() => {
      db.run("INSERT INTO Datum (id, name, type, content) VALUES ('1', 'd', 'e', 'f')");
    }).toThrow();
  });

  it("Edge has (fromDatumID, toDatumID) as primary key", () => {
    db.run("INSERT INTO Edge (fromDatumID, toDatumID) VALUES ('a', 'b')");
    expect(() => {
      db.run("INSERT INTO Edge (fromDatumID, toDatumID) VALUES ('a', 'b')");
    }).toThrow();
  });

  it("DatumTag has (name, datumID) as primary key", () => {
    db.run("INSERT INTO DatumTag (name, datumID) VALUES ('tag1', 'a')");
    expect(() => {
      db.run("INSERT INTO DatumTag (name, datumID) VALUES ('tag1', 'a')");
    }).toThrow();
  });

  it("DatumDimension has (name, datumID) as primary key", () => {
    db.run("INSERT INTO DatumDimension (name, datumID, value) VALUES ('dim1', 'a', 1.0)");
    expect(() => {
      db.run("INSERT INTO DatumDimension (name, datumID, value) VALUES ('dim1', 'a', 2.0)");
    }).toThrow();
  });

  it("DatumTagAssociations has (childTagName, parentTagName, type) as primary key", () => {
    db.run("INSERT INTO DatumTagAssociations (childTagName, parentTagName, type) VALUES ('c', 'p', 't')");
    expect(() => {
      db.run("INSERT INTO DatumTagAssociations (childTagName, parentTagName, type) VALUES ('c', 'p', 't')");
    }).toThrow();
  });

  it("EdgeTag has (name, edgeID) as primary key", () => {
    db.run("INSERT INTO EdgeTag (name, edgeID) VALUES ('tag1', 'e1')");
    expect(() => {
      db.run("INSERT INTO EdgeTag (name, edgeID) VALUES ('tag1', 'e1')");
    }).toThrow();
  });

  it("creates all 7 indices", () => {
    const result = db.exec(
      "SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );
    const indexNames = result[0].values.map((row) => row[0]);

    expect(indexNames).toEqual([
      "datum_dimension_from_datum_id",
      "datum_from_name",
      "datum_from_type",
      "datum_tag_associations_from_parent_tag_name",
      "datum_tag_from_datum_id",
      "edge_reverse",
      "edge_tag_from_edge_id",
    ]);
  });
});
