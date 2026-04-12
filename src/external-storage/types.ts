export type Datum = {
  id: string;
  name: string;
  type: string;
  content: string;
};

export type Edge = {
  fromDatumID: string;
  toDatumID: string;
};

export type DatumTag = {
  name: string;
  datumID: string;
};

export type DatumDimension = {
  name: string;
  datumID: string;
  value: number;
};

export type DatumTagAssociation = {
  childTagName: string;
  parentTagName: string;
  type: string;
};

export type EdgeTag = {
  name: string;
  edgeID: string;
};

export type ExternalGraph = {
  /** Monotonically increasing version counter for conflict detection. */
  version: number;
  datums: Datum[];
  edges: Edge[];
  datumTags: DatumTag[];
  datumDimensions: DatumDimension[];
  datumTagAssociations: DatumTagAssociation[];
  edgeTags: EdgeTag[];
};

/**
 * Envelope format for an encrypted graph.json file.
 *
 * The `version` field is stored in plaintext so it can be read without
 * decryption (e.g. for version-check CI). The `graph_blob` field holds
 * the `base64(salt || iv || ciphertext + authTag)` payload.
 */
export type EncryptedGraphEnvelope = {
  /** Encrypted graph payload as a base64 string. */
  graph_blob: string;
  /** Graph version, readable without decryption. */
  version: number;
};
