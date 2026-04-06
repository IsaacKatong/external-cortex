import type { Database } from "sql.js";

// --- Datum ---

const CREATE_DATUM = `
  CREATE TABLE IF NOT EXISTS Datum (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL
  )
`;

const INDEX_DATUM_FROM_NAME = `
  CREATE INDEX IF NOT EXISTS datum_from_name ON Datum (name)
`;

const INDEX_DATUM_FROM_TYPE = `
  CREATE INDEX IF NOT EXISTS datum_from_type ON Datum (type)
`;

// --- Edge ---

const CREATE_EDGE = `
  CREATE TABLE IF NOT EXISTS Edge (
    fromDatumID TEXT NOT NULL,
    toDatumID TEXT NOT NULL,
    PRIMARY KEY (fromDatumID, toDatumID)
  )
`;

const INDEX_EDGE_REVERSE = `
  CREATE INDEX IF NOT EXISTS edge_reverse ON Edge (toDatumID, fromDatumID)
`;

// --- DatumTag ---

const CREATE_DATUM_TAG = `
  CREATE TABLE IF NOT EXISTS DatumTag (
    name TEXT NOT NULL,
    datumID TEXT NOT NULL,
    PRIMARY KEY (name, datumID)
  )
`;

const INDEX_DATUM_TAG_FROM_DATUM_ID = `
  CREATE INDEX IF NOT EXISTS datum_tag_from_datum_id ON DatumTag (datumID)
`;

// --- DatumDimension ---

const CREATE_DATUM_DIMENSION = `
  CREATE TABLE IF NOT EXISTS DatumDimension (
    name TEXT NOT NULL,
    datumID TEXT NOT NULL,
    value REAL NOT NULL,
    PRIMARY KEY (name, datumID)
  )
`;

const INDEX_DATUM_DIMENSION_FROM_DATUM_ID = `
  CREATE INDEX IF NOT EXISTS datum_dimension_from_datum_id ON DatumDimension (datumID)
`;

// --- DatumTagAssociations ---

const CREATE_DATUM_TAG_ASSOCIATIONS = `
  CREATE TABLE IF NOT EXISTS DatumTagAssociations (
    childTagName TEXT NOT NULL,
    parentTagName TEXT NOT NULL,
    type TEXT NOT NULL,
    PRIMARY KEY (childTagName, parentTagName, type)
  )
`;

const INDEX_DATUM_TAG_ASSOCIATIONS_FROM_PARENT_TAG_NAME = `
  CREATE INDEX IF NOT EXISTS datum_tag_associations_from_parent_tag_name ON DatumTagAssociations (parentTagName)
`;

// --- EdgeTag ---

const CREATE_EDGE_TAG = `
  CREATE TABLE IF NOT EXISTS EdgeTag (
    name TEXT NOT NULL,
    edgeID TEXT NOT NULL,
    PRIMARY KEY (name, edgeID)
  )
`;

const INDEX_EDGE_TAG_FROM_EDGE_ID = `
  CREATE INDEX IF NOT EXISTS edge_tag_from_edge_id ON EdgeTag (edgeID)
`;

// --- Schema Creation ---

const SCHEMA = [
  CREATE_DATUM,
  INDEX_DATUM_FROM_NAME,
  INDEX_DATUM_FROM_TYPE,
  CREATE_EDGE,
  INDEX_EDGE_REVERSE,
  CREATE_DATUM_TAG,
  INDEX_DATUM_TAG_FROM_DATUM_ID,
  CREATE_DATUM_DIMENSION,
  INDEX_DATUM_DIMENSION_FROM_DATUM_ID,
  CREATE_DATUM_TAG_ASSOCIATIONS,
  INDEX_DATUM_TAG_ASSOCIATIONS_FROM_PARENT_TAG_NAME,
  CREATE_EDGE_TAG,
  INDEX_EDGE_TAG_FROM_EDGE_ID,
];

export function createSchema(db: Database): void {
  for (const statement of SCHEMA) {
    db.run(statement);
  }
}
