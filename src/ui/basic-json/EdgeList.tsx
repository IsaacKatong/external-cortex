import type { ReactNode } from "react";
import type { Edge, EdgeTag } from "../../external-storage/types.js";
import { BORDER } from "../../config/colors.js";

export type EdgeListProps = {
  edges: Edge[];
  edgeTags: EdgeTag[];
};

function edgeID(edge: Edge): string {
  return `${edge.fromDatumID}->${edge.toDatumID}`;
}

export function EdgeList({ edges, edgeTags }: EdgeListProps): ReactNode {
  if (edges.length === 0) {
    return <p>No edges to display.</p>;
  }

  return (
    <section>
      <h2>Edges ({edges.length})</h2>
      {edges.map((edge) => {
        const id = edgeID(edge);
        const tags = edgeTags
          .filter((et) => et.edgeID === id)
          .map((et) => et.name);

        return (
          <article key={id} data-testid={`edge-${id}`} style={{ borderBottom: `1px solid ${BORDER}`, paddingBottom: 8, marginBottom: 8 }}>
            <pre style={{ margin: 0 }}>{JSON.stringify({ ...edge, tags }, null, 2)}</pre>
          </article>
        );
      })}
    </section>
  );
}
