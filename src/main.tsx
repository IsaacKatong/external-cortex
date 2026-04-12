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
import type { EncryptedGraphEnvelope } from "./external-storage/types.js";

const root = createRoot(document.getElementById("root")!);

/**
 * Check if the raw text is an encrypted graph envelope (has `graph_blob` field).
 *
 * Returns the parsed envelope if encrypted, or `null` if it's plaintext JSON.
 */
function parseEnvelope(rawText: string): EncryptedGraphEnvelope | null {
  try {
    const parsed = JSON.parse(rawText);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "graph_blob" in parsed
    ) {
      return parsed as EncryptedGraphEnvelope;
    }
    return null;
  } catch {
    // Not valid JSON at all — treat as legacy raw base64 ciphertext
    return { graph_blob: rawText, version: 0 };
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
  const envelope = parseEnvelope(rawText);

  if (envelope) {
    renderPasswordPrompt(envelope);
  } else {
    await loadAndRender(rawText, "", 0);
  }
}

function renderPasswordPrompt(
  envelope: EncryptedGraphEnvelope,
  error: string | null = null
): void {
  root.render(
    <StrictMode>
      <PasswordPrompt
        error={error}
        onSubmit={(password) => attemptDecrypt(envelope, password)}
      />
    </StrictMode>
  );
}

async function attemptDecrypt(
  envelope: EncryptedGraphEnvelope,
  password: string
): Promise<void> {
  try {
    const json = await decryptGraphJson(envelope.graph_blob, password);
    await loadAndRender(json, password, envelope.version);
  } catch {
    renderPasswordPrompt(envelope, "Invalid password. Please try again.");
  }
}

async function loadAndRender(
  json: string,
  password: string,
  envelopeVersion: number
): Promise<void> {
  const graph = parseExternalGraph(json);

  // If the envelope carried a version (encrypted path), use it.
  // Otherwise the version was already parsed from the JSON.
  if (envelopeVersion > 0 && graph.version === 0) {
    graph.version = envelopeVersion;
  }

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
              const freshEnvelope = parseEnvelope(fresh);
              let freshJson: string;
              let freshEnvelopeVersion = 0;
              if (freshEnvelope) {
                freshJson = await decryptGraphJson(
                  freshEnvelope.graph_blob,
                  password
                );
                freshEnvelopeVersion = freshEnvelope.version;
              } else {
                freshJson = fresh;
              }
              const freshGraph = parseExternalGraph(freshJson);
              if (freshEnvelopeVersion > 0 && freshGraph.version === 0) {
                freshGraph.version = freshEnvelopeVersion;
              }
              const freshLoadData = await initializeDatabase({
                locateFile: (file: string) =>
                  `${import.meta.env.BASE_URL}${file}`,
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
