import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { parseExternalGraph } from "./external-storage/parseExternalGraph.js";
import { initializeDatabase } from "./repository/initializeDatabase.js";
import { createGraphRepository } from "./repository/GraphRepository.js";
import { ExternalGraphView } from "./ui/ExternalGraphView.js";
import { GitHubAuthProvider } from "./github-auth/GitHubAuthContext.js";
import { PasswordPrompt } from "./ui/PasswordPrompt.js";
import { ENCRYPTED } from "./config/encryption.js";
import { decryptGraphJson } from "./encryption/decrypt.js";

const root = createRoot(document.getElementById("root")!);

async function start(): Promise<void> {
  const response = await fetch(`${import.meta.env.BASE_URL}graph.json`);

  if (!response.ok) {
    throw new Error(
      "Failed to load graph.json. Place your graph JSON file at local-storage/graph.json."
    );
  }

  const rawText = await response.text();

  if (ENCRYPTED) {
    renderPasswordPrompt(rawText);
  } else {
    await loadAndRender(rawText);
  }
}

function renderPasswordPrompt(ciphertext: string, error: string | null = null): void {
  root.render(
    <StrictMode>
      <PasswordPrompt
        error={error}
        onSubmit={(password) => attemptDecrypt(ciphertext, password)}
      />
    </StrictMode>
  );
}

async function attemptDecrypt(ciphertext: string, password: string): Promise<void> {
  try {
    const json = await decryptGraphJson(ciphertext, password);
    await loadAndRender(json);
  } catch {
    renderPasswordPrompt(ciphertext, "Invalid password. Please try again.");
  }
}

async function loadAndRender(json: string): Promise<void> {
  const graph = parseExternalGraph(json);

  const loadData = await initializeDatabase({
    locateFile: (file: string) => `${import.meta.env.BASE_URL}${file}`,
  });
  const { db } = loadData(graph);
  const repository = createGraphRepository(db);

  root.render(
    <StrictMode>
      <GitHubAuthProvider>
        <ExternalGraphView graph={graph} repository={repository} db={db} />
      </GitHubAuthProvider>
    </StrictMode>
  );
}

start();
