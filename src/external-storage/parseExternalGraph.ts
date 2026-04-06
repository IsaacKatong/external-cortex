import type {
  Datum,
  DatumDimension,
  DatumTag,
  DatumTagAssociation,
  Edge,
  EdgeTag,
  ExternalGraph,
} from "./types.js";

export function parseExternalGraph(json: string): ExternalGraph {
  const parsed = JSON.parse(json);

  const datums: Datum[] = (parsed.datums ?? []).map((d: Datum) => ({
    id: d.id,
    name: d.name,
    type: d.type,
    content: d.content,
  }));

  const edges: Edge[] = (parsed.edges ?? []).map((e: Edge) => ({
    fromDatumID: e.fromDatumID,
    toDatumID: e.toDatumID,
  }));

  const datumTags: DatumTag[] = (parsed.datumTags ?? []).map((dt: DatumTag) => ({
    name: dt.name,
    datumID: dt.datumID,
  }));

  const datumDimensions: DatumDimension[] = (parsed.datumDimensions ?? []).map(
    (dd: DatumDimension) => ({
      name: dd.name,
      datumID: dd.datumID,
      value: dd.value,
    })
  );

  const datumTagAssociations: DatumTagAssociation[] = (
    parsed.datumTagAssociations ?? []
  ).map((dta: DatumTagAssociation) => ({
    childTagName: dta.childTagName,
    parentTagName: dta.parentTagName,
    type: dta.type,
  }));

  const edgeTags: EdgeTag[] = (parsed.edgeTags ?? []).map((et: EdgeTag) => ({
    name: et.name,
    edgeID: et.edgeID,
  }));

  return {
    datums,
    edges,
    datumTags,
    datumDimensions,
    datumTagAssociations,
    edgeTags,
  };
}
