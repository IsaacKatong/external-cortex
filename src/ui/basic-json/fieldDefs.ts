export type FieldDef = {
  key: string;
  label: string;
  type: "text" | "number";
};

export const DATUM_FIELDS: FieldDef[] = [
  { key: "id", label: "id", type: "text" },
  { key: "name", label: "name", type: "text" },
  { key: "type", label: "type", type: "text" },
  { key: "content", label: "content", type: "text" },
];

export const EDGE_FIELDS: FieldDef[] = [
  { key: "fromDatumID", label: "fromDatumID", type: "text" },
  { key: "toDatumID", label: "toDatumID", type: "text" },
];

export const DATUM_TAG_FIELDS: FieldDef[] = [
  { key: "name", label: "name", type: "text" },
  { key: "datumID", label: "datumID", type: "text" },
];

export const DATUM_DIMENSION_FIELDS: FieldDef[] = [
  { key: "name", label: "name", type: "text" },
  { key: "datumID", label: "datumID", type: "text" },
  { key: "value", label: "value", type: "number" },
];

export const DATUM_TAG_ASSOCIATION_FIELDS: FieldDef[] = [
  { key: "childTagName", label: "childTagName", type: "text" },
  { key: "parentTagName", label: "parentTagName", type: "text" },
  { key: "type", label: "type", type: "text" },
];

export const EDGE_TAG_FIELDS: FieldDef[] = [
  { key: "name", label: "name", type: "text" },
  { key: "edgeID", label: "edgeID", type: "text" },
];
