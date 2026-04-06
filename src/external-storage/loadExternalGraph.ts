import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { StorageType, STORAGE_TYPE, LOCAL_STORAGE_DIRECTORY } from "../config/external-storage.js";
import { parseExternalGraph } from "./parseExternalGraph.js";
import type { ExternalGraph } from "./types.js";

/**
 * Load the user's external graph from local storage.
 *
 * Reads the first `.json` file found in the configured local storage
 * directory, parses it into an `ExternalGraph`, and returns it.
 *
 * @param rootDir - Absolute path to the project root. Defaults to `process.cwd()`.
 * @returns The parsed `ExternalGraph`.
 * @throws If no JSON file is found or the file cannot be parsed.
 */
export function loadFromLocal(rootDir: string = process.cwd()): ExternalGraph {
  const dir = resolve(rootDir, LOCAL_STORAGE_DIRECTORY);
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));

  if (files.length === 0) {
    throw new Error(`No JSON files found in local storage directory: ${dir}`);
  }

  const json = readFileSync(resolve(dir, files[0]!), "utf-8");
  return parseExternalGraph(json);
}

/**
 * Load the user's external graph from GitHub.
 *
 * @todo Implement GitHub storage loading.
 */
export function loadFromGitHub(): ExternalGraph {
  // TODO: Implement GitHub storage loading
  throw new Error("GitHub storage is not yet implemented");
}

/**
 * Load the user's external graph using the currently configured storage backend.
 *
 * Delegates to the appropriate loader based on the `STORAGE_TYPE` config value.
 *
 * @param rootDir - Absolute path to the project root (used by local storage).
 * @returns The parsed `ExternalGraph`.
 */
export function loadExternalGraph(rootDir?: string): ExternalGraph {
  switch (STORAGE_TYPE) {
    case StorageType.LOCAL:
      return loadFromLocal(rootDir);
    case StorageType.GITHUB:
      return loadFromGitHub();
  }
}
