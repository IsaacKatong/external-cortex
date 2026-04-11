import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { parseExternalGraph } from "./external-storage/parseExternalGraph.js";
import { initializeDatabase } from "./repository/initializeDatabase.js";
import { createGraphRepository } from "./repository/GraphRepository.js";
import { ExternalGraphView } from "./ui/ExternalGraphView.js";
import { GitHubAuthProvider } from "./github-auth/GitHubAuthContext.js";
import { PasswordPrompt } from "./ui/PasswordPrompt.js";
import { decryptGraphJson } from "./encryption/decrypt.js";
import { downloadGraphJson } from "./github-api/commitFile.js";
import { GITHUB_REPO_NAME } from "./config/github.js";

const root = createRoot(document.getElementById("root")!);

/**
 * Check if the raw text looks like encrypted content (not valid JSON).
 */
function isEncrypted(rawText: string): boolean {
  try {
    JSON.parse(rawText);
    return false;
  } catch {
    return true;
  }
}

/**
 * Try to load a fresh graph.json from the GitHub repo API.
 * Returns the raw text or null if unavailable.
 */
async function tryDownloadFresh(token: string): Promise<string | null> {
  if (!GITHUB_REPO_NAME) return null;
  return downloadGraphJson(token, GITHUB_REPO_NAME);
}

async function start(): Promise<void> {
  const response = await fetch(`${import.meta.env.BASE_URL}graph.json?t=${Date.now()}`);

  if (!response.ok) {
    throw new Error(
      "Failed to load graph.json. Place your graph JSON file at local-storage/graph.json."
    );
  }

  const rawText = await response.text();

  if (isEncrypted(rawText)) {
    renderPasswordPrompt(rawText);
  } else {
    await loadAndRender(rawText, "");
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
    await loadAndRender(json, password);
  } catch {
    renderPasswordPrompt(ciphertext, "Invalid password. Please try again.");
  }
}

async function loadAndRender(json: string, password: string): Promise<void> {
  const graph = parseExternalGraph(json);

  const loadData = await initializeDatabase({
    locateFile: (file: string) => `${import.meta.env.BASE_URL}${file}`,
  });
  const { db } = loadData(graph);
  const repository = createGraphRepository(db);

  root.render(
    <StrictMode>
      <GitHubAuthProvider>
        <ExternalGraphView
          graph={graph}
          repository={repository}
          db={db}
          password={password}
          onFreshDownload={async (token: string) => {
            const fresh = await tryDownloadFresh(token);
            if (!fresh) return;
            try {
              const freshJson = isEncrypted(fresh)
                ? await decryptGraphJson(fresh, password)
                : fresh;
              const freshGraph = parseExternalGraph(freshJson);
              const freshLoadData = await initializeDatabase({
                locateFile: (file: string) => `${import.meta.env.BASE_URL}${file}`,
              });
              const { db: freshDb } = freshLoadData(freshGraph);
              const freshRepository = createGraphRepository(freshDb);
              root.render(
                <StrictMode>
                  <GitHubAuthProvider>
                    <ExternalGraphView
                      graph={freshGraph}
                      repository={freshRepository}
                      db={freshDb}
                      password={password}
                    />
                  </GitHubAuthProvider>
                </StrictMode>
              );
            } catch {
              // Decryption or parse failed — keep using static graph.json
            }
          }}
        />
      </GitHubAuthProvider>
    </StrictMode>
  );
}

start();
