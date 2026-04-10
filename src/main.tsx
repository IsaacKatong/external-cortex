import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { parseExternalGraph } from "./external-storage/parseExternalGraph.js";
import { ExternalGraphView } from "./ui/ExternalGraphView.js";

async function start(): Promise<void> {
  const response = await fetch(`${import.meta.env.BASE_URL}graph.json`);

  if (!response.ok) {
    throw new Error(
      "Failed to load graph.json. Place your graph JSON file at local-storage/graph.json."
    );
  }

  const json = await response.text();
  const graph = parseExternalGraph(json);

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ExternalGraphView graph={graph} />
    </StrictMode>
  );
}

start();
