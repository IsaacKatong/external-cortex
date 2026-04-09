import { useState, useMemo, type ReactNode } from "react";
import type { ExternalGraph } from "../../external-storage/types.js";
import { TEXT_PRIMARY, BACKGROUND } from "../../config/colors.js";
import { DatumList } from "./DatumList.js";
import { EdgeList } from "./EdgeList.js";
import { TagFilter } from "./TagFilter.js";

export type BasicJsonViewProps = {
  graph: ExternalGraph;
};

export function BasicJsonView({ graph }: BasicJsonViewProps): ReactNode {
  const [selectedDatumTags, setSelectedDatumTags] = useState<Set<string>>(
    new Set()
  );
  const [selectedEdgeTags, setSelectedEdgeTags] = useState<Set<string>>(
    new Set()
  );

  const allDatumTagNames = useMemo(
    () => [...new Set(graph.datumTags.map((dt) => dt.name))].sort(),
    [graph.datumTags]
  );

  const allEdgeTagNames = useMemo(
    () => [...new Set(graph.edgeTags.map((et) => et.name))].sort(),
    [graph.edgeTags]
  );

  const filteredDatums = useMemo(() => {
    if (selectedDatumTags.size === 0) {
      return graph.datums;
    }
    const matchingDatumIDs = new Set(
      graph.datumTags
        .filter((dt) => selectedDatumTags.has(dt.name))
        .map((dt) => dt.datumID)
    );
    return graph.datums.filter((d) => matchingDatumIDs.has(d.id));
  }, [graph.datums, graph.datumTags, selectedDatumTags]);

  const filteredEdges = useMemo(() => {
    if (selectedEdgeTags.size === 0) {
      return graph.edges;
    }
    const matchingEdgeIDs = new Set(
      graph.edgeTags
        .filter((et) => selectedEdgeTags.has(et.name))
        .map((et) => et.edgeID)
    );
    return graph.edges.filter(
      (e) => matchingEdgeIDs.has(`${e.fromDatumID}->${e.toDatumID}`)
    );
  }, [graph.edges, graph.edgeTags, selectedEdgeTags]);

  function toggleDatumTag(tag: string): void {
    setSelectedDatumTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }

  function toggleEdgeTag(tag: string): void {
    setSelectedEdgeTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }

  return (
    <div style={{ color: TEXT_PRIMARY, backgroundColor: BACKGROUND, minHeight: "100vh", padding: 16 }}>
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

      <DatumList
        datums={filteredDatums}
        datumTags={graph.datumTags}
        datumDimensions={graph.datumDimensions}
      />

      <EdgeList edges={filteredEdges} edgeTags={graph.edgeTags} />
    </div>
  );
}
