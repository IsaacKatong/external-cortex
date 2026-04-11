import { useState, useMemo, useCallback, type ReactNode } from "react";
import type {
  ExternalGraph,
  Datum,
  Edge,
  DatumTag,
  DatumDimension,
  DatumTagAssociation,
  EdgeTag,
} from "../../external-storage/types.js";
import type { GraphRepository } from "../../repository/GraphRepository.js";
import { TEXT_PRIMARY, BACKGROUND } from "../../config/colors.js";
import { TagFilter } from "./TagFilter.js";
import { ArraySection } from "./ArraySection.js";
import {
  DATUM_FIELDS,
  EDGE_FIELDS,
  DATUM_TAG_FIELDS,
  DATUM_DIMENSION_FIELDS,
  DATUM_TAG_ASSOCIATION_FIELDS,
  EDGE_TAG_FIELDS,
} from "./fieldDefs.js";

export type BasicJsonViewProps = {
  graph: ExternalGraph;
  repository?: GraphRepository;
};

export function BasicJsonView({ graph, repository }: BasicJsonViewProps): ReactNode {
  const [datums, setDatums] = useState<Datum[]>(graph.datums);
  const [edges, setEdges] = useState<Edge[]>(graph.edges);
  const [datumTags, setDatumTags] = useState<DatumTag[]>(graph.datumTags);
  const [datumDimensions, setDatumDimensions] = useState<DatumDimension[]>(
    graph.datumDimensions
  );
  const [datumTagAssociations, setDatumTagAssociations] = useState<
    DatumTagAssociation[]
  >(graph.datumTagAssociations);
  const [edgeTags, setEdgeTags] = useState<EdgeTag[]>(graph.edgeTags);

  const [selectedDatumTags, setSelectedDatumTags] = useState<Set<string>>(
    new Set()
  );
  const [selectedEdgeTags, setSelectedEdgeTags] = useState<Set<string>>(
    new Set()
  );

  const allDatumTagNames = useMemo(
    () => [...new Set(datumTags.map((dt) => dt.name))].sort(),
    [datumTags]
  );

  const allEdgeTagNames = useMemo(
    () => [...new Set(edgeTags.map((et) => et.name))].sort(),
    [edgeTags]
  );

  const filteredDatums = useMemo(() => {
    if (selectedDatumTags.size === 0) return datums;
    const matchingIDs = new Set(
      datumTags
        .filter((dt) => selectedDatumTags.has(dt.name))
        .map((dt) => dt.datumID)
    );
    return datums.filter((d) => matchingIDs.has(d.id));
  }, [datums, datumTags, selectedDatumTags]);

  const filteredEdges = useMemo(() => {
    if (selectedEdgeTags.size === 0) return edges;
    const matchingIDs = new Set(
      edgeTags
        .filter((et) => selectedEdgeTags.has(et.name))
        .map((et) => et.edgeID)
    );
    return edges.filter(
      (e) => matchingIDs.has(`${e.fromDatumID}->${e.toDatumID}`)
    );
  }, [edges, edgeTags, selectedEdgeTags]);

  function toggleDatumTag(tag: string): void {
    setSelectedDatumTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  function toggleEdgeTag(tag: string): void {
    setSelectedEdgeTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  const datumIdValidator = useCallback(
    (value: string): string | undefined => {
      if (datums.some((d) => d.id === value)) {
        return "ID already exists";
      }
      return undefined;
    },
    [datums]
  );

  const datumValidators = useMemo(
    () => ({ id: datumIdValidator }),
    [datumIdValidator]
  );

  function addDatum(values: Record<string, string | number>): void {
    const datum = values as unknown as Datum;
    repository?.addDatum(datum);
    setDatums((prev) => [...prev, datum]);
  }

  function addEdge(values: Record<string, string | number>): void {
    const edge = values as unknown as Edge;
    repository?.addEdge(edge);
    setEdges((prev) => [...prev, edge]);
  }

  function addDatumTag(values: Record<string, string | number>): void {
    const tag = values as unknown as DatumTag;
    repository?.addDatumTag(tag);
    setDatumTags((prev) => [...prev, tag]);
  }

  function addDatumDimension(values: Record<string, string | number>): void {
    const dim = values as unknown as DatumDimension;
    repository?.addDatumDimension(dim);
    setDatumDimensions((prev) => [...prev, dim]);
  }

  function addDatumTagAssociation(
    values: Record<string, string | number>
  ): void {
    const assoc = values as unknown as DatumTagAssociation;
    repository?.addDatumTagAssociation(assoc);
    setDatumTagAssociations((prev) => [...prev, assoc]);
  }

  function addEdgeTag(values: Record<string, string | number>): void {
    const tag = values as unknown as EdgeTag;
    repository?.addEdgeTag(tag);
    setEdgeTags((prev) => [...prev, tag]);
  }

  return (
    <div
      style={{
        color: TEXT_PRIMARY,
        backgroundColor: BACKGROUND,
        minHeight: "100vh",
        padding: 16,
      }}
    >
      <h1>External Graph — Basic JSON View</h1>

      <TagFilter
        label="Filter Datums by Tag"
        tags={allDatumTagNames}
        selectedTags={selectedDatumTags}
        onToggleTag={toggleDatumTag}
      />

      <TagFilter
        label="Filter Edges by Tag"
        tags={allEdgeTagNames}
        selectedTags={selectedEdgeTags}
        onToggleTag={toggleEdgeTag}
      />

      <ArraySection<Datum>
        title="Datums"
        items={filteredDatums}
        fields={DATUM_FIELDS}
        validators={datumValidators}
        itemKey={(d) => d.id}
        onSave={addDatum}
      />

      <ArraySection<Edge>
        title="Edges"
        items={filteredEdges}
        fields={EDGE_FIELDS}
        itemKey={(e) => `${e.fromDatumID}->${e.toDatumID}`}
        onSave={addEdge}
      />

      <ArraySection<DatumTag>
        title="DatumTags"
        items={datumTags}
        fields={DATUM_TAG_FIELDS}
        itemKey={(dt) => `${dt.name}-${dt.datumID}`}
        onSave={addDatumTag}
      />

      <ArraySection<DatumDimension>
        title="DatumDimensions"
        items={datumDimensions}
        fields={DATUM_DIMENSION_FIELDS}
        itemKey={(dd) => `${dd.name}-${dd.datumID}`}
        onSave={addDatumDimension}
      />

      <ArraySection<DatumTagAssociation>
        title="DatumTagAssociations"
        items={datumTagAssociations}
        fields={DATUM_TAG_ASSOCIATION_FIELDS}
        itemKey={(a) => `${a.childTagName}-${a.parentTagName}-${a.type}`}
        onSave={addDatumTagAssociation}
      />

      <ArraySection<EdgeTag>
        title="EdgeTags"
        items={edgeTags}
        fields={EDGE_TAG_FIELDS}
        itemKey={(et) => `${et.name}-${et.edgeID}`}
        onSave={addEdgeTag}
      />
    </div>
  );
}
