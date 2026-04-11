import type { Database } from "sql.js";
import type {
  Datum,
  Edge,
  DatumTag,
  DatumDimension,
  DatumTagAssociation,
  EdgeTag,
} from "../external-storage/types.js";

export type GraphRepository = {
  addDatum(datum: Datum): void;
  addEdge(edge: Edge): void;
  addDatumTag(tag: DatumTag): void;
  addDatumDimension(dim: DatumDimension): void;
  addDatumTagAssociation(assoc: DatumTagAssociation): void;
  addEdgeTag(tag: EdgeTag): void;
};

export function createGraphRepository(db: Database): GraphRepository {
  return {
    addDatum(datum: Datum): void {
      db.run(
        "INSERT INTO Datum (id, name, type, content) VALUES (?, ?, ?, ?)",
        [datum.id, datum.name, datum.type, datum.content]
      );
    },

    addEdge(edge: Edge): void {
      db.run("INSERT INTO Edge (fromDatumID, toDatumID) VALUES (?, ?)", [
        edge.fromDatumID,
        edge.toDatumID,
      ]);
    },

    addDatumTag(tag: DatumTag): void {
      db.run("INSERT INTO DatumTag (name, datumID) VALUES (?, ?)", [
        tag.name,
        tag.datumID,
      ]);
    },

    addDatumDimension(dim: DatumDimension): void {
      db.run(
        "INSERT INTO DatumDimension (name, datumID, value) VALUES (?, ?, ?)",
        [dim.name, dim.datumID, dim.value]
      );
    },

    addDatumTagAssociation(assoc: DatumTagAssociation): void {
      db.run(
        "INSERT INTO DatumTagAssociations (childTagName, parentTagName, type) VALUES (?, ?, ?)",
        [assoc.childTagName, assoc.parentTagName, assoc.type]
      );
    },

    addEdgeTag(tag: EdgeTag): void {
      db.run("INSERT INTO EdgeTag (name, edgeID) VALUES (?, ?)", [
        tag.name,
        tag.edgeID,
      ]);
    },
  };
}
