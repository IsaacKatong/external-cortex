import type { Database } from "sql.js";
import type {
  ExternalGraph,
  Datum,
  Edge,
  DatumTag,
  DatumDimension,
  DatumTagAssociation,
  EdgeTag,
} from "../external-storage/types.js";

/**
 * Export the full graph from the SQLite database back to an `ExternalGraph`.
 *
 * This is the inverse of `insertGraph` in `initializeDatabase.ts`.
 * It queries every table and assembles the result into the same shape
 * as the original `graph.json` input.
 *
 * @param db - The sql.js Database instance.
 * @returns The complete graph as an `ExternalGraph` object.
 */
export function exportGraph(db: Database): ExternalGraph {
  return {
    datums: queryAll<Datum>(db, "SELECT id, name, type, content FROM Datum"),
    edges: queryAll<Edge>(db, "SELECT fromDatumID, toDatumID FROM Edge"),
    datumTags: queryAll<DatumTag>(db, "SELECT name, datumID FROM DatumTag"),
    datumDimensions: queryAll<DatumDimension>(
      db,
      "SELECT name, datumID, value FROM DatumDimension"
    ),
    datumTagAssociations: queryAll<DatumTagAssociation>(
      db,
      "SELECT childTagName, parentTagName, type FROM DatumTagAssociations"
    ),
    edgeTags: queryAll<EdgeTag>(db, "SELECT name, edgeID FROM EdgeTag"),
  };
}

/**
 * Run a SELECT query and return all rows as typed objects.
 *
 * Uses `db.exec` which returns column names alongside values,
 * then maps each row into an object keyed by column name.
 */
function queryAll<T>(db: Database, sql: string): T[] {
  const results = db.exec(sql);
  if (results.length === 0) return [];

  const { columns, values } = results[0]!;
  return values.map((row) => {
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < columns.length; i++) {
      obj[columns[i]!] = row[i];
    }
    return obj as T;
  });
}
