import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { parseExternalGraph } from "./external-storage/parseExternalGraph.js";
import { initializeDatabase } from "./repository/initializeDatabase.js";
import { createGraphRepository } from "./repository/GraphRepository.js";
import { ExternalGraphView } from "./ui/ExternalGraphView.js";
import { GitHubAuthProvider } from "./github-auth/GitHubAuthContext.js";

async function start(): Promise<void> {
  const response = await fetch(`${import.meta.env.BASE_URL}graph.json`);

  if (!response.ok) {
    throw new Error(
      "Failed to load graph.json. Place your graph JSON file at local-storage/graph.json."
    );
  }

  const json = await response.text();
  const graph = parseExternalGraph(json);

  const loadData = await initializeDatabase({
    locateFile: (file: string) => `${import.meta.env.BASE_URL}${file}`,
  });
  const { db } = loadData(graph);
  const repository = createGraphRepository(db);

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <GitHubAuthProvider>
        <ExternalGraphView graph={graph} repository={repository} db={db} />
      </GitHubAuthProvider>
    </StrictMode>
  );
}

start();
