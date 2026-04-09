import type { ExternalGraph } from "../../external-storage/types.js";

export function createTestGraph(): ExternalGraph {
  return {
    datums: [
      {
        id: "d1",
        name: "Note A",
        type: "MARKDOWN",
        content: "# Note A\nFirst note.",
      },
      {
        id: "d2",
        name: "Note B",
        type: "MARKDOWN",
        content: "# Note B\nSecond note.",
      },
      {
        id: "d3",
        name: "Note C",
        type: "MARKDOWN",
        content: "# Note C\nThird note.",
      },
    ],
    edges: [
      { fromDatumID: "d1", toDatumID: "d2" },
      { fromDatumID: "d2", toDatumID: "d3" },
    ],
    datumTags: [
      { name: "science", datumID: "d1" },
      { name: "history", datumID: "d1" },
      { name: "science", datumID: "d2" },
      { name: "history", datumID: "d3" },
    ],
    datumDimensions: [
      { name: "importance", datumID: "d1", value: 5 },
      { name: "importance", datumID: "d2", value: 3 },
    ],
    datumTagAssociations: [],
    edgeTags: [
      { name: "causal", edgeID: "d1->d2" },
      { name: "temporal", edgeID: "d1->d2" },
      { name: "causal", edgeID: "d2->d3" },
    ],
  };
}
