import { useState, useRef, useCallback } from "react";
import type { Database } from "sql.js";
import { exportGraph } from "../repository/exportGraph.js";
import { commitGraphJson } from "../github-api/commitFile.js";
import { encryptGraphJson } from "../encryption/browserEncrypt.js";

/**
 * Sync status indicates the current state of graph persistence.
 */
export type SyncStatus = "synced" | "unsaved" | "syncing" | "error";

/**
 * Return value of the `useSyncStatus` hook.
 */
export type SyncStatusHook = {
  /** Current sync status. */
  status: SyncStatus;
  /** Human-readable error message when `status` is `"error"`. */
  errorMessage: string | null;
  /** Mark the graph as dirty (unsaved changes). Starts the debounce timer. */
  markDirty: () => void;
  /** Force an immediate save, bypassing the debounce timer. */
  forceSave: () => Promise<void>;
};

const DEBOUNCE_MS = 1_000;

/**
 * React hook that manages syncing the in-memory SQLite graph to GitHub.
 *
 * Call `markDirty()` after every mutation. A debounce timer auto-saves
 * after 1 second of inactivity. `forceSave()` saves immediately.
 *
 * If a password is provided, the exported JSON is encrypted before
 * committing to GitHub.
 *
 * @param db - The sql.js Database instance.
 * @param token - GitHub personal access token, or `null` if not signed in.
 * @param repoFullName - Full repository name in `owner/repo` format.
 * @param password - Password for encrypting graph.json. Empty string means no encryption.
 */
export function useSyncStatus(
  db: Database | null,
  token: string | null,
  repoFullName: string,
  password: string = ""
): SyncStatusHook {
  const [status, setStatus] = useState<SyncStatus>("synced");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Prevent concurrent saves
  const savingRef = useRef(false);

  const save = useCallback(async (): Promise<void> => {
    if (!db || !token || !repoFullName || savingRef.current) return;

    savingRef.current = true;
    setStatus("syncing");
    setErrorMessage(null);

    try {
      const graph = exportGraph(db);
      const json = JSON.stringify(graph, null, 2);
      const content = password ? await encryptGraphJson(json, password) : json;
      await commitGraphJson(token, repoFullName, content);
      setStatus("synced");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save to GitHub";
      setErrorMessage(message);
      setStatus("error");
    } finally {
      savingRef.current = false;
    }
  }, [db, token, repoFullName, password]);

  const markDirty = useCallback((): void => {
    if (!token || !repoFullName) return;

    setStatus("unsaved");

    // Reset the debounce timer
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      save();
    }, DEBOUNCE_MS);
  }, [token, repoFullName, save]);

  const forceSave = useCallback(async (): Promise<void> => {
    // Clear any pending debounce
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    await save();
  }, [save]);

  return { status, errorMessage, markDirty, forceSave };
}
