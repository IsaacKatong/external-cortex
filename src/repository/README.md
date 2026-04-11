# Repository

This folder contains the SQLite database schema, bulk-load logic, and mutation APIs. The database is powered by [sql.js](https://github.com/sql-js/sql.js), a JavaScript implementation of SQLite.

- `schema.ts` — Table and index DDL statements.
- `initializeDatabase.ts` — Initializes sql.js, creates the schema, and bulk-loads an `ExternalGraph`.
- `GraphRepository.ts` — UI-agnostic interface and implementation for inserting individual elements into the database. Any UI layer can depend on the `GraphRepository` type without coupling to SQLite internals.

## Tables

| Table                 | Primary Key                                  | Description                          |
|-----------------------|----------------------------------------------|--------------------------------------|
| Datum                 | `id`                                         | Information dumped into the system   |
| Edge                  | `(fromDatumID, toDatumID)`                   | Links between datums                 |
| DatumTag              | `(name, datumID)`                            | Tags assigned to datums              |
| DatumDimension        | `(name, datumID)`                            | Numeric dimensions on datums         |
| DatumTagAssociations  | `(childTagName, parentTagName, type)`        | Tag hierarchy associations           |
| EdgeTag               | `(name, edgeID)`                             | Tags assigned to edges               |

## Indices

| Index                                          | Table                | Column(s)                  | Purpose                              |
|------------------------------------------------|----------------------|----------------------------|--------------------------------------|
| `datum_from_name`                              | Datum                | `name`                     | Look up datums by name               |
| `datum_from_type`                              | Datum                | `type`                     | Look up datums by type               |
| `edge_reverse`                                 | Edge                 | `(toDatumID, fromDatumID)` | Look up edges by destination datum   |
| `datum_tag_from_datum_id`                      | DatumTag             | `datumID`                  | Look up tags for a datum             |
| `datum_dimension_from_datum_id`                | DatumDimension       | `datumID`                  | Look up dimensions for a datum       |
| `datum_tag_associations_from_parent_tag_name`  | DatumTagAssociations | `parentTagName`            | Look up children of a parent tag     |
| `edge_tag_from_edge_id`                        | EdgeTag              | `edgeID`                   | Look up tags for an edge             |
