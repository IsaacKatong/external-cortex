import initSqlJs, { type Database } from "sql.js";
import type { ExternalGraph } from "../external-storage/types.js";
import { createSchema } from "./schema.js";

export type QueryDatabase = {
  // TODO: Add query methods
  db: Database;
};

export type LoadData = (graph: ExternalGraph) => QueryDatabase;

function insertGraph(db: Database, graph: ExternalGraph): void {
  const insertDatum = db.prepare(
    "INSERT INTO Datum (id, name, type, content) VALUES (?, ?, ?, ?)"
  );
  for (const d of graph.datums) {
    insertDatum.run([d.id, d.name, d.type, d.content]);
  }
  insertDatum.free();

  const insertEdge = db.prepare(
    "INSERT INTO Edge (fromDatumID, toDatumID) VALUES (?, ?)"
  );
  for (const e of graph.edges) {
    insertEdge.run([e.fromDatumID, e.toDatumID]);
  }
  insertEdge.free();

  const insertDatumTag = db.prepare(
    "INSERT INTO DatumTag (name, datumID) VALUES (?, ?)"
  );
  for (const dt of graph.datumTags) {
    insertDatumTag.run([dt.name, dt.datumID]);
  }
  insertDatumTag.free();

  const insertDatumDimension = db.prepare(
    "INSERT INTO DatumDimension (name, datumID, value) VALUES (?, ?, ?)"
  );
  for (const dd of graph.datumDimensions) {
    insertDatumDimension.run([dd.name, dd.datumID, dd.value]);
  }
  insertDatumDimension.free();

  const insertDatumTagAssociation = db.prepare(
    "INSERT INTO DatumTagAssociations (childTagName, parentTagName, type) VALUES (?, ?, ?)"
  );
  for (const dta of graph.datumTagAssociations) {
    insertDatumTagAssociation.run([dta.childTagName, dta.parentTagName, dta.type]);
  }
  insertDatumTagAssociation.free();

  const insertEdgeTag = db.prepare(
    "INSERT INTO EdgeTag (name, edgeID) VALUES (?, ?)"
  );
  for (const et of graph.edgeTags) {
    insertEdgeTag.run([et.name, et.edgeID]);
  }
  insertEdgeTag.free();
}

export async function initializeDatabase(): Promise<LoadData> {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  createSchema(db);

  return (graph: ExternalGraph): QueryDatabase => {
    insertGraph(db, graph);

    return {
      // TODO: Add query methods
      db,
    };
  };
}
